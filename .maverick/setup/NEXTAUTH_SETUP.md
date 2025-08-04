# NextAuth.js + Azure Database Setup Guide

## What is NextAuth.js?

NextAuth.js is a complete authentication solution for Next.js applications that provides:
- ✅ **OAuth providers** (Google, GitHub, Square, etc.)
- ✅ **Email/password authentication**
- ✅ **Session management** with JWTs
- ✅ **Database integration** with Prisma
- ✅ **Security best practices** built-in
- ✅ **TypeScript support**

## ✅ Benefits for Maverick

### **Hosted Solution**: 
- Runs entirely on your server - no external auth service required
- Full control over user data and authentication flow
- No additional costs or vendor lock-in

### **Square Integration**: 
- Custom Square OAuth provider configured
- Automatic token storage and refresh
- Seamless Square merchant account linking

### **Developer Experience**:
- Easy session management with hooks
- Automatic CSRF protection
- Built-in error handling

## 🚀 Installation Steps

### 1. Install Dependencies
```bash
npm install next-auth @next-auth/prisma-adapter prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs
```

### 2. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Copy this to your `.env.local` as `NEXTAUTH_SECRET`

### 3. Configure Azure Database
Add your Azure PostgreSQL connection string to `.env.local`:
```env
DATABASE_URL="postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require"
```

### 4. Initialize Prisma
```bash
npx prisma generate
npx prisma db push
```

### 5. Update Root Layout
```tsx
// src/app/layout.tsx
import { SessionProvider } from '@/components/SessionProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

## 🔧 Usage Examples

### Server Components
```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <div>Welcome {session.user.name}!</div>
}
```

### Client Components
```tsx
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function LoginButton() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <p>Loading...</p>
  
  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }
  
  return (
    <div>
      <button onClick={() => signIn('credentials')}>Sign in with Email</button>
      <button onClick={() => signIn('square')}>Sign in with Square</button>
    </div>
  )
}
```

### API Routes
```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // User is authenticated
  return NextResponse.json({ user: session.user })
}
```

## 🗄️ Database Schema

The Prisma schema includes:

### **NextAuth Required Tables**:
- `User` - User accounts
- `Account` - OAuth account connections
- `Session` - User sessions
- `VerificationToken` - Email verification

### **Maverick Business Tables**:
- `SquareConnection` - Square OAuth tokens
- `Business` - Business formation data
- `BusinessFormation` - Formation workflow tracking
- `ChatSession` - Chat wizard sessions

## 🔐 Security Features

### **Automatic Security**:
- CSRF protection built-in
- Secure cookie handling
- JWT token encryption
- SQL injection prevention via Prisma

### **Password Security**:
- bcrypt hashing with salt rounds
- Secure password validation
- Account lockout protection (can be added)

### **OAuth Security**:
- State parameter validation
- Secure token storage
- Automatic token refresh

## 🚀 Authentication Flows

### **Email/Password Registration**:
1. User fills registration form
2. Password hashed with bcrypt
3. User created in database
4. Auto-login after registration

### **Square OAuth Flow**:
1. User clicks "Sign in with Square"
2. Redirected to Square authorization
3. User grants permissions
4. Square returns authorization code
5. NextAuth exchanges for access token
6. User created/updated with Square data
7. Tokens stored in SquareConnection table

### **Session Management**:
- JWT tokens for stateless authentication
- 30-day session expiry
- Automatic token refresh
- Secure logout with token invalidation

## 🔄 Integration with Existing Code

### **Replace Custom Auth**:
Your existing login/register pages can be updated to use NextAuth:
- Use `signIn()` instead of custom fetch calls
- Use `useSession()` for user state
- Use `getServerSession()` for server-side auth

### **Chat Wizard Integration**:
```tsx
// Chat wizard can access user session
const { data: session } = useSession()

// Save chat data to user's account
await fetch('/api/chat-wizard', {
  method: 'POST',
  body: JSON.stringify({
    userId: session?.user.id,
    chatData: wizardData
  })
})
```

### **Square Integration**:
```tsx
// Check if user has Square connected
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { squareConnection: true }
})

if (user.squareConnection) {
  // Use stored tokens for Square API calls
  const response = await fetch('https://connect.squareup.com/v2/merchants', {
    headers: {
      'Authorization': `Bearer ${user.squareConnection.accessToken}`
    }
  })
}
```

## 🎯 Next Steps

1. **Update Environment Variables** with your Azure database URL
2. **Install Dependencies** and run Prisma setup
3. **Update Login/Register Pages** to use NextAuth
4. **Add Session Provider** to root layout
5. **Test Authentication Flows** with both email and Square
6. **Integrate with Chat Wizard** to save user sessions

This gives you enterprise-grade authentication with full control and seamless Square integration!