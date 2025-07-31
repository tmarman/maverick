import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { 
              squareConnection: true,
              githubConnection: true 
            }
          })

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
            image: user.image,
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
      token: 'https://connect.squareup.com/oauth2/token',
      userinfo: {
        url: 'https://connect.squareup.com/v2/merchants',
        async request({ tokens }) {
          const response = await fetch('https://connect.squareup.com/v2/merchants', {
            headers: {
              'Square-Version': '2025-01-23',
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          })
          const data = await response.json()
          const merchant = data.merchants?.[0]
          
          return {
            id: merchant?.id,
            name: merchant?.business_name || 'Square Merchant',
            email: merchant?.main_location_id, // We'll use this as a unique identifier
            image: null
          }
        }
      },
      clientId: process.env.SQUARE_CLIENT_ID!,
      clientSecret: process.env.SQUARE_CLIENT_SECRET!,
      profile: async (profile, tokens) => {
        // Store Square tokens in database
        if (tokens.access_token) {
          await prisma.squareConnection.upsert({
            where: { merchantId: profile.id },
            update: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : null,
            },
            create: {
              merchantId: profile.id,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : null,
              user: {
                connectOrCreate: {
                  where: { email: `square_${profile.id}@maverick.com` },
                  create: {
                    email: `square_${profile.id}@maverick.com`,
                    name: profile.name,
                    image: profile.image,
                  }
                }
              }
            }
          })
        }

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.image,
          squareConnected: true
        }
      }
    }
  ],
  
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.squareConnected = user.squareConnected
        token.githubConnected = user.githubConnected
        token.githubUsername = user.githubUsername
      }
      
      // Store Square account info
      if (account?.provider === 'square' && account.access_token) {
        token.squareAccessToken = account.access_token
        token.squareRefreshToken = account.refresh_token
      }
      
      // Store GitHub account info
      if (account?.provider === 'github' && account.access_token) {
        token.githubAccessToken = account.access_token
        token.githubRefreshToken = account.refresh_token
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.squareConnected = token.squareConnected as boolean
        session.user.githubConnected = token.githubConnected as boolean
        session.user.githubUsername = token.githubUsername as string
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true
    },
    
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful auth
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { user: user.email, provider: account?.provider, isNewUser })
    },
    async createUser({ user }) {
      console.log('New user created:', user.email)
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
}