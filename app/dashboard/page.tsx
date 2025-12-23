// User Dashboard
// Main interface for users to view and manage their service requests

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Clock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ServiceRequest {
  id: number
  issue_description: string
  latitude: number
  longitude: number
  status: string
  created_at: string
  helper_name?: string
}

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role === "admin") {
          router.push("/login")
        } else {
          setUser(data.user)
          loadRequests()
        }
      })
      .catch(() => router.push("/login"))
  }, [router])

  const loadRequests = async () => {
    try {
      const response = await fetch("/api/requests/my-requests")
      const data = await response.json()
      if (response.ok) {
        setRequests(data.requests)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load service requests",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "default"
      case "pending":
        return "secondary"
      case "accepted":
        return "default"
      case "completed":
        return "secondary"
      default:
        return "default"
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <Navbar user={user} />
      <main className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Service Requests</h2>
            <p className="text-muted-foreground">Manage your roadside assistance requests</p>
          </div>
          <Button onClick={() => router.push("/dashboard/new-request")}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No service requests yet</p>
              <Button onClick={() => router.push("/dashboard/new-request")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                    <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{request.issue_description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                  {request.helper_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Helper: {request.helper_name}</span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-4 bg-transparent"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/request/${request.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
