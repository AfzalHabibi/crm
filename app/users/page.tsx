"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserTable } from "@/components/users/user-table"
import { UserForm } from "@/components/users/user-form"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types"
import type { RegisterInput, UpdateUserInput } from "@/lib/validations/auth"

export default function UsersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        limit: "50",
      })

      const response = await fetch(`/api/users?${params}`)
      const result = await response.json()

      if (result.success) {
        setUsers(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handle create/update user
  const handleSubmit = async (data: RegisterInput | UpdateUserInput) => {
    try {
      setIsSubmitting(true)

      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setIsFormOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.message || "Operation failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete user
  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Handle edit user
  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  // Handle view user (placeholder)
  const handleView = (user: User) => {
    toast({
      title: "View User",
      description: `Viewing ${user.name}`,
    })
  }

  const canCreateUsers = session?.user?.role && ["admin", "manager"].includes(session.user.role)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </div>
              {canCreateUsers && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
          </CardContent>
        </Card>

        <UserForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          user={editingUser}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </DashboardLayout>
  )
}
