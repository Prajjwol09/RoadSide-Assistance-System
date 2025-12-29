// View and manage service request details (User view)
// Allows users to select helpers and track request status

"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, User, Star, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Request {
  id: number
  issue_description: string
  latitude: number
  longitude: number
  status: string
  created_at: string
  helper_id?: number
  helper_name?: string
}

interface Helper {
  id: number
  user_id: number
  name: string
  skills: string
  address: string
  is_available: number
  rating_average: number
  total_ratings: number
}

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const helperMarkerRef = useRef<any>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me", { credentials: "include" })
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
      // Load request details
      const requestRes = await fetch(`/api/requests/${params.id}`)
      const requestData = await requestRes.json()
      if (requestRes.ok) {
        // Support new response shape where helper information is nested
        const req = requestData.request
        if (req && req.helper && !req.helper_name) {
          req.helper_name = req.helper.name
          req.helper_id = req.helper.id
        }
        setRequest(req)

        // Load available helpers if request is still open (treat 'declined' as reopen)
        if (req.status === "requested" || req.status === "declined") {
          const helpersRes = await fetch("/api/helpers/list")
          const helpersData = await helpersRes.json()
          if (helpersRes.ok) {
            setHelpers(helpersData.helpers)
          }
        }
        // initialize map once request is loaded
        setTimeout(() => initMap(), 100)
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

  const initMap = () => {
    if (!mapRef.current || !request) return
    if (leafletMapRef.current) return

    const userLat = request.latitude
    const userLng = request.longitude

    const map = L.map(mapRef.current).setView([userLat, userLng], 13)
    leafletMapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map)

    userMarkerRef.current = L.marker([userLat, userLng]).addTo(map).bindPopup("User location")

    fetchLocationsAndUpdateMarkers()

    setInterval(() => {
      fetchLocationsAndUpdateMarkers()
    }, 5000)
  }

  const fetchLocationsAndUpdateMarkers = async () => {
    if (!request) return
    try {
      const res = await fetch(`/api/requests/${request.id}/locations`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) return

      if (data.helper && data.helper.latitude != null && data.helper.longitude != null) {
        const hl = [data.helper.latitude, data.helper.longitude]
        if (!helperMarkerRef.current) {
          helperMarkerRef.current = L.marker(hl).addTo(leafletMapRef.current).bindPopup('Helper')
        } else {
          helperMarkerRef.current.setLatLng(hl)
        }

        // compute distance
        const d = haversineDistance(request.latitude, request.longitude, data.helper.latitude, data.helper.longitude)
        setDistanceKm(d)
      } else {
        setDistanceKm(null)
      }
    } catch (e) {
      // ignore
    }
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    function toRad(x: number) { return (x * Math.PI) / 180 }
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
  }

  const handleSelectHelper = async (helperId: number) => {
    try {
      const response = await fetch(`/api/requests/${params.id}/select-helper`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helper_id: helperId }),
      })

      if (response.ok) {
        toast({
          title: "Helper selected",
          description: "The helper has been notified of your request",
        })
        loadData()
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Failed to select helper",
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

  const handleCompleteRequest = async () => {
    try {
      const response = await fetch(`/api/requests/${params.id}/complete`, {
        method: "PUT",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Request completed",
          description: "You can now rate the helper",
        })
        router.push(`/dashboard/request/${params.id}/rate`)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete request",
      })
    }
  }

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(`/api/requests/${params.id}/cancel`, {
        method: "PUT",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Request cancelled",
          description: "Your service request has been cancelled",
        })
        loadData()
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Failed to cancel request",
          description: data?.error || data?.detail || "Unable to cancel request",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as any)?.message || "Failed to cancel request",
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Request #{request.id}</CardTitle>
                  <CardDescription>Service request details and status</CardDescription>
                </div>
                <Badge variant={request.status === "completed" ? "secondary" : "default"}>{request.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Issue Description</h3>
                <p className="text-muted-foreground">{request.issue_description}</p>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
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
              {request.helper_name && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Helper: <span className="font-semibold">{request.helper_name}</span>
                    </span>
                  </div>
                </>
              )}
              {request.helper && request.helper.phone && (
                <div className="pt-2 text-sm">
                  <strong>Phone:</strong> {request.helper.phone}
                </div>
              )}
              {request.status === "accepted" && (
                <Button onClick={handleCompleteRequest} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
              {request.status === "pending" && (
                <div className="pt-2">
                  <Button variant="destructive" onClick={handleCancelRequest} className="w-full">
                    Cancel Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Map */}
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
              <CardDescription>Track helper and user locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                {distanceKm != null ? (
                  <div className="text-sm">Distance between you and helper: <strong>{distanceKm} km</strong></div>
                ) : (
                  <div className="text-sm text-muted-foreground">Helper location not available yet</div>
                )}
              </div>
              <div ref={mapRef} id="map" style={{ height: 300, width: "100%" }} />
            </CardContent>
          </Card>

          {/* Available Helpers */}
          {request.status === "requested" && helpers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Helper</CardTitle>
                <CardDescription>Choose from available helpers to assist you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {helpers.map((helper) => (
                  <Card key={helper.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{helper.name}</h4>
                            {helper.is_available === 1 && <Badge variant="secondary">Available</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{helper.skills}</p>
                          <p className="text-xs text-muted-foreground">{helper.address}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {helper.rating_average.toFixed(1)} ({helper.total_ratings} reviews)
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectHelper(helper.id)}
                          disabled={helper.is_available === 0}
                          size="sm"
                        >
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
