"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Saving...' : 'Save password'}</Button>
              <Button variant="ghost" onClick={() => router.push('/login')}>Back</Button>
            </div>
          </form>

          {message && <div className="mt-4 text-sm text-muted-foreground">{message}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
