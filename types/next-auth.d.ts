declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      avatar?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    avatar?: string
  }
}
