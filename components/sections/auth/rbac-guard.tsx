"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface RBACGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "member" | "viewer"
  fallback?: React.ReactNode
}

interface UserProfile {
  id: string
  role: string
  organization_id: string
}

export function RBACGuard({ children, requiredRole, fallback }: RBACGuardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("id, role, organization_id")
        .eq("id", user.id)
        .single()

      setProfile(userProfile)
    } catch (error) {
      console.error("Error checking user role:", error)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  const hasRequiredRole = (userRole: string, required?: string): boolean => {
    if (!required) return true

    const roleHierarchy = {
      viewer: 1,
      member: 2,
      admin: 3,
    }

    return (
      roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[required as keyof typeof roleHierarchy]
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return fallback || <div>Access denied</div>
  }

  if (requiredRole && !hasRequiredRole(profile.role, requiredRole)) {
    return (
      fallback || (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this resource.</p>
        </div>
      )
    )
  }

  return <>{children}</>
}
