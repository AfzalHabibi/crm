"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { registerSchema, updateUserSchema, type RegisterInput, type UpdateUserInput } from "@/lib/validations/auth"
import type { User } from "@/types"

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSubmit: (data: RegisterInput | UpdateUserInput) => Promise<void>
  isLoading: boolean
}

export function UserForm({ open, onOpenChange, user, onSubmit, isLoading }: UserFormProps) {
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : registerSchema),
    defaultValues: isEditing
      ? {
          name: user?.name,
          email: user?.email,
          role: user?.role as "admin" | "user" | "manager",
          phone: user?.phone,
          department: user?.department,
          isActive: user?.isActive,
        }
      : {
          role: "user",
          isActive: true,
        },
  })

  const handleFormSubmit = async (data: RegisterInput | UpdateUserInput) => {
    await onSubmit(data)
    reset()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update user information." : "Add a new user to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password" as keyof RegisterInput)}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value) => setValue("role", value as "admin" | "user" | "manager")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" {...register("phone")} className={errors.phone ? "border-destructive" : ""} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                {...register("department")}
                className={errors.department ? "border-destructive" : ""}
              />
              {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
            </div>

            {isEditing && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={watch("isActive" as keyof UpdateUserInput) as boolean}
                  onCheckedChange={(checked) => setValue("isActive" as keyof UpdateUserInput, checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
