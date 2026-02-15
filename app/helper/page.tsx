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
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Clock, AlertCircle, Star, User, CheckCircle, Wrench, Eye, Power } from "lucide-react"
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar user={user} />
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Helper Profile Card */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg">
          <CardHeader className="pb-8">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">Helper Dashboard</span>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-slate-600 text-lg">Manage your availability and service requests</p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold text-slate-800">{profile.rating_average.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{profile.total_ratings} reviews</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-md">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Skills</p>
                    <p className="text-slate-800 font-medium">{profile.skills}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Service Area</p>
                    <p className="text-slate-800 font-medium">{profile.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {latestReview && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-slate-800">Recent Review</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < latestReview.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600">({latestReview.stars}/5)</span>
                      </div>
                      {latestReview.feedback && (
                        <p className="text-sm text-slate-700 italic">"{latestReview.feedback}"</p>
                      )}
                      <p className="text-xs text-slate-500">By: {latestReview.rater_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Power className="h-5 w-5 text-slate-600" />
                      <Label htmlFor="availability" className="text-slate-800 font-medium">Availability Status</Label>
                    </div>
                    <p className="text-sm text-slate-600">Toggle to accept new requests</p>
                  </div>
                  <Switch
                    id="availability"
                    checked={profile.is_available === 1}
                    onCheckedChange={toggleAvailability}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-600"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Active Requests */}
        {myRequests.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  My Active Requests
                </h2>
                <p className="text-slate-600">Manage your ongoing service requests</p>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {myRequests.map((request) => (
                <Card
                  key={request.id}
                  className="group bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/90"
                >
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">#</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-800">{request.id}</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200 px-4 py-2 rounded-full">
                        {request.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-700 text-base leading-relaxed">
                      {request.issue_description.length > 120
                        ? `${request.issue_description.substring(0, 120)}...`
                        : request.issue_description
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Customer</p>
                        <p className="text-slate-800 font-medium">{request.user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Location</p>
                        <p className="text-slate-800 font-mono text-sm">
                          {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform group-hover:scale-105"
                      onClick={() => router.push(`/helper/request/${request.id}`)}
                    >
                      <Eye className="mr-3 h-5 w-5" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Service Requests */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Available Service Requests
              </h2>
              <p className="text-slate-600">Browse and accept new service requests in your area</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">#</span>
                        </div>
                        <Skeleton className="h-8 w-16 bg-slate-200" />
                      </div>
                      <Skeleton className="h-7 w-24 bg-slate-200 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-full bg-slate-200 mb-2" />
                    <Skeleton className="h-5 w-4/5 bg-slate-200" />
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <Skeleton className="w-12 h-12 bg-slate-200 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20 bg-slate-200" />
                        <Skeleton className="h-5 w-24 bg-slate-200" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <Skeleton className="w-12 h-12 bg-slate-200 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16 bg-slate-200" />
                        <Skeleton className="h-5 w-32 bg-slate-200" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <Skeleton className="w-12 h-12 bg-slate-200 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-12 bg-slate-200" />
                        <Skeleton className="h-5 w-28 bg-slate-200" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="h-12 w-12 text-slate-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">0</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800">No Available Requests</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      There are no service requests available in your area right now. Check back later or update your availability status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <Card
                  key={request.id}
                  className="group bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/90"
                >
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">#</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-800">{request.id}</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200 px-4 py-2 rounded-full">
                        {request.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-700 text-base leading-relaxed">
                      {request.issue_description.length > 120
                        ? `${request.issue_description.substring(0, 120)}...`
                        : request.issue_description
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Customer</p>
                        <p className="text-slate-800 font-medium">{request.user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Location</p>
                        <p className="text-slate-800 font-mono text-sm">
                          {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-md">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Posted</p>
                        <p className="text-slate-800 text-sm">
                          {new Date(request.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
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
