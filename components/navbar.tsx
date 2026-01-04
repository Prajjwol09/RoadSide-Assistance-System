// Reusable navigation bar component
// Shows user info and provides logout functionality

"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User as UserIcon, Wrench as ToolIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NavbarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout",
      })
    }
  }

  // Get initials for avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">RS</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Road Sathi</h1>
            <p className="text-xs text-muted-foreground capitalize">{user.role} Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <ProfileButtons user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  )
}

function ProfileButtons({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [showUser, setShowUser] = useState(false)
  const [showHelper, setShowHelper] = useState(false)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [helperProfile, setHelperProfile] = useState<any | null>(null)

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data.user)
      }
    } catch (e) {}
  }

  const fetchHelperProfile = async () => {
    try {
      const res = await fetch('/api/helpers/profile')
      if (res.ok) {
        const data = await res.json()
        setHelperProfile(data.profile)
      }
    } catch (e) {}
  }

  return (
    <div className="flex items-center gap-2">
      <button
        title="User profile"
        className="btn-icon"
        onClick={async () => {
          if (!userProfile) await fetchUserProfile()
          setShowUser((s) => !s)
          setShowHelper(false)
        }}
      >
        <UserIcon className="h-5 w-5" />
      </button>

      <button
        title="Helper profile"
        className="btn-icon"
        onClick={async () => {
          if (!helperProfile) await fetchHelperProfile()
          setShowHelper((s) => !s)
          setShowUser(false)
        }}
      >
        <ToolIcon className="h-5 w-5" />
      </button>

      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>

      {showUser && userProfile && (
        <div className="absolute right-4 top-16 z-50 w-72 rounded border bg-card p-4 shadow">
          <h3 className="font-semibold">User Profile</h3>
          <div className="text-sm mt-2">
            <div><strong>Name:</strong> {userProfile.name}</div>
            <div><strong>Email:</strong> {userProfile.email}</div>
            <div><strong>Role:</strong> {userProfile.role}</div>
          </div>
        </div>
      )}

      {showHelper && helperProfile && (
        <div className="absolute right-4 top-16 z-50 w-80 rounded border bg-card p-4 shadow">
          <h3 className="font-semibold">Helper Profile</h3>
          <div className="text-sm mt-2 space-y-1">
            <div><strong>Skills:</strong> {helperProfile.skills}</div>
            <div><strong>Service Area:</strong> {helperProfile.address}</div>
            <div><strong>Available:</strong> {helperProfile.is_available ? 'Yes' : 'No'}</div>
            <div><strong>Rating:</strong> {helperProfile.rating_average?.toFixed?.(1) ?? '-'} ({helperProfile.total_ratings ?? 0})</div>
          </div>
        </div>
      )}
    </div>
  )
}
