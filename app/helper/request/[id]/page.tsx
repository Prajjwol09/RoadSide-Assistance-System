// View service request details (Helper view)
// Allows helpers to accept requests and update status

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
import { MapPin, Clock, User, CheckCircle, Star } from "lucide-react"
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
  helper?: {
    id: number
    name?: string
  }
}

export default function HelperRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const helperMarkerRef = useRef<any>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)

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
        setImages(data.images || [])

        // If completed, load ratings/reviews for this request
        if (data.request.status === "completed") {
          try {
            const rRes = await fetch(`/api/ratings/service-request/${params.id}`)
            const rData = await rRes.json()
            if (rRes.ok) setRatings(rData.ratings || [])
          } catch (e) {
            // ignore ratings fetch errors
          }
        }
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
        // start sending location updates
        startSendingLocation()
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

  const handleMarkCompleted = async () => {
    if (!confirm('Mark this request as completed?')) return
    try {
      const response = await fetch(`/api/requests/${params.id}/complete`, {
        method: 'PUT',
      })

      if (response.ok) {
        toast({ title: 'Request marked completed' })
        loadData()
      } else {
        const data = await response.json()
        toast({ variant: 'destructive', title: 'Failed', description: data.error })
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Unable to complete request' })
    }
  }

  const startSendingLocation = () => {
    // initial send
    sendHelperLocation()
    // send periodically
    setInterval(() => {
      sendHelperLocation()
    }, 5000)
    // also init map polling
    setTimeout(() => initMap(), 200)
  }

  const sendHelperLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch("/api/helpers/location", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          })
        } catch (e) {
          // ignore
        }
      },
      () => {},
      { enableHighAccuracy: true }
    )
  }

  const initMap = () => {
    if (!mapRef.current || !request) return
    if (leafletMapRef.current) return

    const map = L.map(mapRef.current).setView([request.latitude, request.longitude], 13)
    leafletMapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map)

    userMarkerRef.current = L.marker([request.latitude, request.longitude]).addTo(map).bindPopup("User location")
    fetchLocationsAndUpdateMarkers()
    setInterval(() => fetchLocationsAndUpdateMarkers(), 5000)
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
          helperMarkerRef.current = L.marker(hl).addTo(leafletMapRef.current).bindPopup('You')
        } else {
          helperMarkerRef.current.setLatLng(hl)
        }
        const d = haversineDistance(request.latitude, request.longitude, data.helper.latitude, data.helper.longitude)
        setDistanceKm(d)
      } else {
        setDistanceKm(null)
      }
    } catch (e) {}
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
                  <div className="flex gap-2">
                    <Button onClick={handleAcceptRequest} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/requests/${params.id}/decline`, { method: "PUT" })
                          if (res.ok) {
                            toast({ title: "Request declined" })
                            loadData()
                          } else {
                            const d = await res.json()
                            toast({ variant: "destructive", title: "Failed", description: d.error })
                          }
                        } catch (e) {
                          toast({ variant: "destructive", title: "Error", description: "Unable to decline" })
                        }
                      }}
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </>
              )}

              {request.status === "accepted" && user?.role === "helper" && request.helper?.id === user.id && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    <Button onClick={handleMarkCompleted} className="flex-1">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                  </div>
                </>
              )}

              {/* Live Map */}
              <Separator />
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Live Map</h4>
                <div className="text-sm mb-2">
                  {distanceKm != null ? (
                    <>Distance to user: <strong>{distanceKm} km</strong></>
                  ) : (
                    <span className="text-muted-foreground">Waiting for location...</span>
                  )}
                </div>
                <div ref={mapRef} style={{ height: 300, width: "100%" }} />
              </div>

              {images && images.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Images</h4>
                    <div className="flex gap-2 flex-wrap">
                      {images.map((img) => (
                        <img key={img.id} src={img.file_path} alt={img.original_name} className="w-32 h-24 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {ratings && ratings.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Reviews</h4>
                    <div className="space-y-3">
                      {ratings.map((r) => (
                        <div key={r.id} className="border rounded p-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{r.stars} / 5</span>
                          </div>
                          {r.feedback && <p className="text-sm text-muted-foreground mt-1">{r.feedback}</p>}
                          <div className="text-xs text-muted-foreground mt-1">By: {r.rater_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
