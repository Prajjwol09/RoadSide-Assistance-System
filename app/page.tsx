// Home page - redirects to login
// This is the entry point of the application

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          // Redirect based on role
          if (data.user.role === "admin") {
            router.push("/admin")
          } else if (data.user.role === "helper") {
            router.push("/helper")
          } else {
            router.push("/dashboard")
          }
        } else {
          router.push("/login")
        }
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
