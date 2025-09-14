import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
  role: z.enum(["admin", "user", "manager"]).default("user"),
  phone: z.string().optional(),
  department: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.enum(["admin", "user", "manager"]).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
