export interface User {
  _id?: string
  name: string
  email: string
  password?: string
  role: "admin" | "user" | "manager"
  avatar?: string
  phone?: string
  department?: string
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
