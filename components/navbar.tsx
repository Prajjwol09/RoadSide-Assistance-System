// Reusable navigation bar component
// Shows user info and provides logout functionality

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User as UserIcon, Wrench as ToolIcon, ChevronDown, Star, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RoadSathiLogo } from "@/components/logo"

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
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="container flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/60 rounded-xl transition-colors duration-200 flex items-center justify-center"
            title="Go back"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>

          {/* Brand Section - Clickable to go home */}
          <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
            <RoadSathiLogo size="md" showText={true} />
          </Link>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-4">
          {/* User Info Card */}
          <div className="hidden lg:flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-white/30 backdrop-blur-sm">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
          </div>

          {/* Profile & Logout Buttons */}
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
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const helperDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUser(false)
      }
      if (helperDropdownRef.current && !helperDropdownRef.current.contains(event.target as Node)) {
        setShowHelper(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      {/* User Profile Button */}
      <div className="relative" ref={userDropdownRef}>
        <button
          title="User profile"
          className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md"
          onClick={async () => {
            if (!userProfile) await fetchUserProfile()
            setShowUser((s) => !s)
            setShowHelper(false)
          }}
        >
          <UserIcon className="h-4 w-4 text-slate-700" />
          <span className="hidden sm:inline text-sm font-medium text-slate-700">Profile</span>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>

        {/* User Profile Dropdown */}
        {showUser && userProfile && (
          <div className="absolute right-0 top-12 z-50 w-80 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                  {userProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-800">{userProfile.name}</h3>
                <p className="text-sm text-slate-600">{userProfile.role}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Email:</span>
                <span className="font-medium text-slate-800">{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Role:</span>
                <span className="font-medium text-slate-800 capitalize">{userProfile.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helper Profile Button (only show for helpers) */}
      {user.role === 'helper' && (
        <div className="relative" ref={helperDropdownRef}>
          <button
            title="Helper profile"
            className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={async () => {
              if (!helperProfile) await fetchHelperProfile()
              setShowHelper((s) => !s)
              setShowUser(false)
            }}
          >
            <ToolIcon className="h-4 w-4 text-slate-700" />
            <span className="hidden sm:inline text-sm font-medium text-slate-700">Helper</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {/* Helper Profile Dropdown */}
          {showHelper && helperProfile && (
            <div className="absolute right-0 top-12 z-50 w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 ring-2 ring-emerald-100">
                  <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold">
                    {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-800">{user.name}</h3>
                  <p className="text-sm text-slate-600">Helper Profile</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    helperProfile.is_available
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {helperProfile.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-slate-800">
                      {helperProfile.rating_average?.toFixed?.(1) ?? '-'}
                    </span>
                    <span className="text-slate-500">
                      ({helperProfile.total_ratings ?? 0})
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Skills:</span>
                  <p className="font-medium text-slate-800 text-xs bg-slate-50 rounded-lg p-2">
                    {helperProfile.skills}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Service Area:</span>
                  <p className="font-medium text-slate-800 text-xs bg-slate-50 rounded-lg p-2">
                    {helperProfile.address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logout Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className="bg-red-50/50 border-red-200/50 text-red-700 hover:bg-red-100/50 hover:border-red-300/50 transition-all duration-300 shadow-sm hover:shadow-md"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  )
}
