// Create new service request page
// Allows users to submit roadside assistance requests with location and issue description

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    issue_description: "",
    latitude: "",
    longitude: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login")
        } else {
          setUser(data.user)
        }
      })
      .catch(() => router.push("/login"))
  }, [router])

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          })
          toast({
            title: "Location obtained",
            description: "Your current location has been set",
          })
        },
        () => {
          toast({
            variant: "destructive",
            title: "Location error",
            description: "Unable to get your location. Please enter manually.",
          })
        },
      )
    } else {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate coordinates
    const lat = Number.parseFloat(formData.latitude)
    const lng = Number.parseFloat(formData.longitude)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast({
        variant: "destructive",
        title: "Invalid location",
        description: "Please provide valid latitude and longitude",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_description: formData.issue_description,
          latitude: lat,
          longitude: lng,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Request created",
          description: "Your service request has been submitted",
        })
        router.push(`/dashboard/request/${data.requestId}`)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to create request",
          description: data.error || "An error occurred",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
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
              <CardTitle>Create Service Request</CardTitle>
              <CardDescription>Describe your issue and provide your location</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue Description</Label>
                  <Textarea
                    id="issue"
                    placeholder="Describe your roadside issue in detail (e.g., flat tire, dead battery, out of fuel)"
                    value={formData.issue_description}
                    onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full bg-transparent">
                    <MapPin className="mr-2 h-4 w-4" />
                    Use My Current Location
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="40.7128"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="-74.0060"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Creating..." : "Create Request"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
