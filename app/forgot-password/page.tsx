"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    setToken(null)
    try {
      const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (res.ok) {
        setMessage('If an account with that email exists, a reset link was generated.')
        if (data?.token) setToken(data.token)
      } else {
        setMessage(data.error || 'Failed to process request')
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
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Sending...' : 'Send reset link'}</Button>
              <Button variant="ghost" onClick={() => router.push('/login')}>Back</Button>
            </div>
          </form>

          {message && <div className="mt-4 text-sm text-muted-foreground">{message}</div>}
          {token && (
            <div className="mt-2 text-xs">
              <div>Dev token (use in reset page):</div>
              <code className="break-all">{token}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
