"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoadSathiLogo } from "@/components/logo"
import { ChevronLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const params = useParams()
  const token = (params as any).token
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const data = await res.json()
      if (res.ok) {
        setMessage('Password reset successful. Redirecting to login...')
        setTimeout(() => router.push('/login'), 1500)
      } else {
        setMessage(data.error || 'Failed to reset password')
      }
    } catch (e) {
      setMessage('Failed to send request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity duration-200">
              <RoadSathiLogo size="lg" showText={true} />
            </Link>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
            Create New Password
          </h1>
          <p className="text-slate-600">Enter your new password below</p>
        </div>

        {/* Reset Password Form */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="text-slate-700 font-medium">New Password</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  placeholder="Enter your new password"
                  className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? "Saving..." : "Save password"}
                </Button>
              </div>
            </form>

          {message && <div className="mt-4 text-sm text-slate-600 text-center">{message}</div>}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-slate-600 text-sm">
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
