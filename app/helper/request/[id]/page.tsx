// View service request details (Helper view)
// Allows helpers to accept requests and update status

"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, User, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Request {
  id: number
  user_id: number
  user_name: string
  issue_description: string
  latitude: number
  longitude: number
  status: string
  created_at: string
}

export default function HelperRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login")
        } else {
          setUser(data.user)
          loadData()
        }
      })
      .catch(() => router.push("/login"))
  }, [router])

  const loadData = async () => {
    try {
      const response = await fetch(`/api/requests/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setRequest(data.request)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load request details",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    try {
      const response = await fetch(`/api/requests/${params.id}/accept`, {
        method: "PUT",
      })

      if (response.ok) {
        toast({
          title: "Request accepted",
          description: "You are now assigned to this request",
        })
        loadData()
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Failed to accept",
          description: data.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    }
  }

  if (!user || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar user={user} />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Request #{request.id}</CardTitle>
                  <CardDescription>Service request details</CardDescription>
                </div>
                <Badge>{request.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Issue Description</h3>
                <p className="text-muted-foreground">{request.issue_description}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    User: <span className="font-semibold">{request.user_name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(request.created_at).toLocaleString()}</span>
                </div>
              </div>
              {request.status === "pending" && (
                <>
                  <Separator />
                  <Button onClick={handleAcceptRequest} className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Request
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
