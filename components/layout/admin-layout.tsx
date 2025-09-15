"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
