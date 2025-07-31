import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      squareConnected: boolean
      githubConnected: boolean
      githubUsername?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    squareConnected?: boolean
    githubConnected?: boolean
    githubUsername?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    image?: string | null
    squareConnected: boolean
    githubConnected: boolean
    githubUsername?: string | null
  }
}