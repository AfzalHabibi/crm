export interface User {
  _id?: string
  name: string
  email: string
  password?: string
  role: "admin" | "user" | "manager" | "hr" | "finance" | "sales"
  avatar?: string
  phone?: string
  department?: string
  position?: string
  status: "active" | "inactive" | "suspended"
  permissions: string[]
  lastLogin?: Date
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  passwordChangedAt?: Date
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  socialLinks?: {
    linkedin?: string
    twitter?: string
    github?: string
  }
  preferences?: {
    theme: "light" | "dark" | "system"
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  metadata?: {
    createdBy?: string
    updatedBy?: string
    notes?: string
    tags?: string[]
  }
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
