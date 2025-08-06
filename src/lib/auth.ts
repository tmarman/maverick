import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { withRetry } from './database-health'
import bcrypt from 'bcryptjs'
import * as Sentry from '@sentry/nextjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      squareConnected?: boolean
      githubConnected?: boolean
      githubUsername?: string
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
    image?: string
    squareConnected?: boolean
    githubConnected?: boolean
    githubUsername?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Magic Link Email Provider (Primary signup method)
    EmailProvider({
      from: process.env.AZURE_COMMUNICATION_FROM_EMAIL || 'donotreply@voxelbox.com',
      sendVerificationRequest: async ({ identifier: email, url, provider, theme }) => {
        // Use Azure Communication Services for magic links
        try {
          const { azureEmailService } = await import('@/lib/azure-email')
          const success = await azureEmailService.sendMagicLinkEmail(email, url)
          
          if (!success) {
            console.error(`Failed to send magic link email to ${email}`)
          }
          
          // Also log for development
          if (process.env.NODE_ENV === 'development') {
            console.log('\n🪄 MAGIC LINK SIGNIN')
            console.log(`Email: ${email}`)
            console.log(`Link: ${url}`)
            console.log('Email sent via Azure Communication Services!\n')
          }
        } catch (error) {
          console.error('Magic link email error:', error)
          
          // Fallback: log the link for development
          if (process.env.NODE_ENV === 'development') {
            console.log('\n🪄 MAGIC LINK SIGNIN (FALLBACK)')
            console.log(`Email: ${email}`)
            console.log(`Link: ${url}`)
            console.log('Use this link to sign in!\n')
          }
        }
      }
    }),

    // GitHub OAuth provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo admin:repo_hook'
        }
      }
    }),
    
    // Credentials provider for email/password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Ensure database is warmed up before authentication
          const { ensureDatabaseWarmed } = await import('./database-warmup')
          await ensureDatabaseWarmed()
          
          const user = await withRetry(() => prisma.user.findUnique({
            where: { email: credentials.email },
            include: { 
              squareConnection: true,
              githubConnection: true 
            }
          }))

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image || undefined,
            squareConnected: !!user.squareConnection,
            githubConnected: !!user.githubConnection,
            githubUsername: user.githubConnection?.username
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    
    // Square OAuth provider (custom)
    {
      id: 'square',
      name: 'Square',
      type: 'oauth',
      authorization: {
        url: 'https://connect.squareup.com/oauth2/authorize',
        params: {
          scope: [
            'MERCHANT_PROFILE_READ',
            'PAYMENTS_READ',
            'PAYMENTS_WRITE', 
            'ORDERS_READ',
            'ORDERS_WRITE',
            'CUSTOMERS_READ',
            'CUSTOMERS_WRITE',
            'SETTLEMENTS_READ',
            'BANK_ACCOUNTS_READ'
          ].join(' '),
          response_type: 'code',
          session: 'false'
        }
      },
      token: {
        url: 'https://connect.squareup.com/oauth2/token',
        async request({ params, provider }) {
          console.log('🔄 Square token exchange request:', {
            clientId: provider.clientId,
            hasClientSecret: !!provider.clientSecret,
            code: params.code?.slice(0, 20) + '...',
            redirect_uri: params.redirect_uri
          })
          
          const response = await fetch('https://connect.squareup.com/oauth2/token', {
            method: 'POST',
            headers: {
              'Square-Version': '2025-01-23',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              client_id: provider.clientId,
              client_secret: provider.clientSecret,
              code: params.code,
              grant_type: 'authorization_code',
              redirect_uri: params.redirect_uri
            }),
          })
          
          const responseText = await response.text()
          console.log('📥 Square token response:', {
            status: response.status,
            statusText: response.statusText,
            response: responseText.slice(0, 200) + '...'
          })
          
          if (!response.ok) {
            const errorData = {
              status: response.status,
              statusText: response.statusText,
              fullResponse: responseText,
              requestBody: {
                client_id: provider.clientId,
                grant_type: 'authorization_code',
                code: params.code?.slice(0, 20) + '...',
                redirect_uri: params.redirect_uri
              }
            }
            
            console.error('🚨 Square token exchange failed:', errorData)
            
            // Report to Sentry with structured data
            Sentry.captureException(new Error(`Square token exchange failed: ${response.status} ${response.statusText}`), {
              tags: {
                oauth_provider: 'square',
                oauth_step: 'token_exchange'
              },
              extra: errorData
            })
            
            throw new Error(`Square token exchange failed: ${response.status} ${response.statusText} - ${responseText}`)
          }
          
          return JSON.parse(responseText)
        }
      },
      userinfo: {
        url: 'https://connect.squareup.com/v2/merchants',
        async request({ tokens }) {
          console.log('👤 Square userinfo request with access token:', tokens.access_token?.slice(0, 20) + '...')
          
          const response = await fetch('https://connect.squareup.com/v2/merchants', {
            headers: {
              'Square-Version': '2025-01-23',
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          })
          
          const responseText = await response.text()
          console.log('📥 Square merchant response:', {
            status: response.status,
            response: responseText.slice(0, 200) + '...'
          })
          
          if (!response.ok) {
            const errorData = {
              status: response.status,
              statusText: response.statusText,
              fullResponse: responseText,
              accessToken: tokens.access_token?.slice(0, 20) + '...'
            }
            
            console.error('🚨 Square merchant info failed:', errorData)
            
            // Report to Sentry with structured data
            Sentry.captureException(new Error(`Square merchant info failed: ${response.status}`), {
              tags: {
                oauth_provider: 'square',
                oauth_step: 'merchant_info'
              },
              extra: errorData
            })
            
            throw new Error(`Square merchant info failed: ${response.status} - ${responseText}`)
          }
          
          const data = JSON.parse(responseText)
          const merchant = data.merchants?.[0]
          
          console.log('🏪 Merchant info:', {
            id: merchant?.id,
            name: merchant?.business_name,
            mainLocationId: merchant?.main_location_id
          })
          
          return {
            id: merchant?.id || merchant?.main_location_id,
            name: merchant?.business_name || 'Square Merchant',
            email: `square-${merchant?.id || merchant?.main_location_id}@square.local`, // Create a proper email
            image: undefined
          }
        }
      },
      clientId: process.env.SQUARE_CLIENT_ID!,
      clientSecret: process.env.SQUARE_CLIENT_SECRET!,
      profile: async (profile, tokens) => {
        // Store Square tokens in database
        if (tokens.access_token && typeof tokens.access_token === 'string') {
          const accessToken = tokens.access_token as string
          const refreshToken = typeof tokens.refresh_token === 'string' ? tokens.refresh_token : undefined
          
          await withRetry(() => prisma.squareConnection.upsert({
            where: { merchantId: profile.id },
            update: {
              accessToken,
              refreshToken,
              expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : null,
            },
            create: {
              merchantId: profile.id,
              accessToken,
              refreshToken,
              expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : null,
              user: {
                connectOrCreate: {
                  where: { email: `square_${profile.id}@maverick.com` },
                  create: {
                    email: `square_${profile.id}@maverick.com`,
                    name: profile.name,
                    image: profile.image || undefined,
                  }
                }
              }
            }
          }))
        }

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.image || undefined,
          squareConnected: true
        }
      }
    }
  ],
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to app for successful logins
      return `${baseUrl}/app`
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.squareConnected = user.squareConnected || false
        token.githubConnected = user.githubConnected || false
        token.githubUsername = user.githubUsername
      }
      
      // Store Square account info
      if (account?.provider === 'square' && account.access_token) {
        token.squareAccessToken = account.access_token
        token.squareRefreshToken = account.refresh_token
      }
      
      // Store GitHub account info
      if (account?.provider === 'github' && account.access_token && user) {
        token.githubAccessToken = account.access_token
        token.githubRefreshToken = account.refresh_token
        
        // Store GitHub connection in database
        try {
          const { storeGitHubConnection } = await import('./github-service')
          await storeGitHubConnection(user.id, {
            githubId: account.providerAccountId,
            username: (account as any).login || '',
            accessToken: account.access_token,
            refreshToken: account.refresh_token || undefined,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
            scopes: account.scope?.split(' ') || []
          })
        } catch (error) {
          console.error('Failed to store GitHub connection:', error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        
        // Refresh GitHub connection status from database
        try {
          const user = await withRetry(() => prisma.user.findUnique({
            where: { id: token.id as string },
            include: { 
              githubConnection: true,
              squareConnection: true 
            }
          }))
          
          if (user) {
            session.user.githubConnected = !!user.githubConnection
            session.user.githubUsername = user.githubConnection?.username || token.githubUsername as string
            session.user.squareConnected = !!user.squareConnection
          } else {
            session.user.squareConnected = (token.squareConnected as boolean) || false
            session.user.githubConnected = (token.githubConnected as boolean) || false
            session.user.githubUsername = token.githubUsername as string
          }
        } catch (error) {
          console.error('Error refreshing connection status:', error)
          session.user.squareConnected = (token.squareConnected as boolean) || false
          session.user.githubConnected = (token.githubConnected as boolean) || false
          session.user.githubUsername = token.githubUsername as string
        }
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Handle GitHub account linking for existing users
      if (account?.provider === 'github') {
        try {
          // Check if there's an existing session/user trying to link GitHub
          const existingUser = await withRetry(() => prisma.user.findUnique({
            where: { email: user.email! },
            include: { githubConnection: true }
          }))
          
          if (existingUser && !existingUser.githubConnection) {
            // User exists but doesn't have GitHub linked - this is an account linking scenario
            console.log(`Linking GitHub account to existing user: ${user.email}`)
            
            // Link the GitHub account to the existing user
            await withRetry(() => prisma.gitHubConnection.create({
              data: {
                userId: existingUser.id,
                githubId: account.providerAccountId,
                username: (profile as any)?.login || '',
                accessToken: account.access_token!,
                refreshToken: account.refresh_token || undefined,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                scopes: JSON.stringify(account.scope?.split(' ') || [])
              }
            }))
            
            // Update the user object to reflect the new connection
            user.id = existingUser.id
            user.githubConnected = true
            user.githubUsername = (profile as any)?.login
          }
        } catch (error) {
          console.error('Error linking GitHub account:', error)
          return false
        }
      }
      
      return true
    }
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { user: user.email, provider: account?.provider, isNewUser })
      
      // Send welcome email for new users
      if (isNewUser && user.email) {
        try {
          const { azureEmailService } = await import('@/lib/azure-email')
          await azureEmailService.sendWelcomeEmail(user.email, user.name || undefined)
        } catch (error) {
          console.error('Welcome email error:', error)
        }
      }
    },
    async createUser({ user }) {
      console.log('New user created:', user.email)
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
}