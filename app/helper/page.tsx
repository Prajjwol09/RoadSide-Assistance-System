// Helper Dashboard
// Main interface for helpers to view requests and manage availability

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, Clock, AlertCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HelperProfile {
  id: number
  skills: string
  address: string
  is_available: number
  rating_average: number
  total_ratings: number
}

interface ServiceRequest {
  id: number
  user_name: string
  issue_description: string
  latitude: number
  longitude: number
  status: string
  created_at: string
}

export default function HelperDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<HelperProfile | null>(null)
  const [ratings, setRatings] = useState<any[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || (data.user.role !== "helper" && data.user.role !== "admin")) {
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
      // Load helper profile
      const profileRes = await fetch("/api/helpers/profile")
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        setProfile(profileData.profile)
        setRatings(profileData.ratings || [])
      }

      // Load available requests
      const requestsRes = await fetch("/api/requests/available")
      const requestsData = await requestsRes.json()
      if (requestsRes.ok) {
        setRequests(requestsData.requests)
      }

      // Load my accepted requests
      const myRequestsRes = await fetch("/api/requests/my-accepted")
      const myRequestsData = await myRequestsRes.json()
      if (myRequestsRes.ok) {
        setMyRequests(myRequestsData.requests)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const latestReview = ratings && ratings.length > 0 ? ratings[0] : null

  const toggleAvailability = async (isAvailable: boolean) => {
    try {
      const response = await fetch("/api/helpers/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: isAvailable }),
      })

      if (response.ok) {
        setProfile((prev) => (prev ? { ...prev, is_available: isAvailable ? 1 : 0 } : null))
        toast({
          title: "Availability updated",
          description: `You are now ${isAvailable ? "available" : "unavailable"}`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      })
    }
  }

  if (!user || !profile) {
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
      <main className="container py-6 space-y-6">
        {/* Helper Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Helper Profile</CardTitle>
                <CardDescription>Manage your availability and view your stats</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">
                  {profile.rating_average.toFixed(1)} ({profile.total_ratings})
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Skills</Label>
              <p className="text-sm text-muted-foreground">{profile.skills}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Service Area</Label>
              <p className="text-sm text-muted-foreground">{profile.address}</p>
            </div>
            {latestReview && (
              <div>
                <Label className="text-sm font-medium">Recent Review</Label>
                <div className="mt-2">
                  <div key={latestReview.id} className="border rounded p-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{latestReview.stars} / 5</span>
                    </div>
                    {latestReview.feedback && <p className="text-sm text-muted-foreground mt-1">{latestReview.feedback}</p>}
                    <div className="text-xs text-muted-foreground mt-1">By: {latestReview.rater_name}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="availability">Availability Status</Label>
                <p className="text-sm text-muted-foreground">Toggle to accept new requests</p>
              </div>
              <Switch id="availability" checked={profile.is_available === 1} onCheckedChange={toggleAvailability} />
            </div>
          </CardContent>
        </Card>

        {/* My Active Requests */}
        {myRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">My Active Requests</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                      <Badge>{request.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{request.issue_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>User: {request.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                      </span>
                    </div>
                    <Button className="w-full mt-4" onClick={() => router.push(`/helper/request/${request.id}`)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Requests */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Service Requests</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No available requests at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                      <Badge variant="secondary">{request.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{request.issue_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>User: {request.user_name}</span>
                    </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
