// Create new service request page
// Allows users to submit roadside assistance requests with location and issue description

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  const [files, setFiles] = useState<File[] | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasActiveRequest, setHasActiveRequest] = useState(false)
  const [activeRequest, setActiveRequest] = useState<any | null>(null)

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login")
        } else {
          setUser(data.user)
          // After we have the user, check for active requests and block creation if present
          fetch("/api/requests/my-requests", { credentials: "include" })
            .then((r) => r.json())
            .then((listData) => {
              if (Array.isArray(listData.requests)) {
                const active = listData.requests.find((req: any) => !["completed", "cancelled"].includes(req.status))
                if (active) {
                  setHasActiveRequest(true)
                  setActiveRequest(active)
                }
              }
            })
            .catch(() => {
              // ignore silently — we'll still allow creation but server has final authority
            })
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

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const arr = Array.from(fileList)
    const allowed = arr.slice(0, 5)
    const validFiles: File[] = []
    const newPreviews: string[] = []

    for (const f of allowed) {
      if (f.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: `${f.name} exceeds 5MB and was skipped.` })
        continue
      }
      validFiles.push(f)
      newPreviews.push(URL.createObjectURL(f))
    }

    setFiles((prev) => {
      const merged = [...(prev || []), ...validFiles].slice(0, 5)
      return merged
    })

    setPreviews((prev) => {
      const merged = [...prev, ...newPreviews].slice(0, 5)
      return merged
    })
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const url = prev[index]
      try {
        URL.revokeObjectURL(url)
      } catch (e) {}
      const next = prev.slice()
      next.splice(index, 1)
      return next
    })

    setFiles((prev) => {
      if (!prev) return prev
      const next = prev.slice()
      next.splice(index, 1)
      return next
    })
  }

  // Cleanup generated object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p)
        } catch (e) {}
      })
    }
  }, [previews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasActiveRequest) {
      toast({
        variant: "destructive",
        title: "Active request exists",
        description: `You already have an active request (status: ${activeRequest?.status}). Please complete or cancel it before creating a new one.`,
      })
      return
    }
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
      const form = new FormData()
      form.append("issue_description", formData.issue_description)
      form.append("latitude", String(lat))
      form.append("longitude", String(lng))
      if (files && files.length > 0) {
        // limit to 5 files
        Array.from(files).slice(0, 5).forEach((f) => form.append("images", f))
      }

      const response = await fetch("/api/requests/create", {
        method: "POST",
        credentials: "include",
        body: form,
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
          description: data.error || data.detail || "An error occurred",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as any)?.message || "An unexpected error occurred",
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
          {hasActiveRequest && (
            <div className="mb-4">
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4">
                <p className="font-medium">You have an active service request</p>
                <p className="text-sm text-muted-foreground">
                  Current status: <strong className="capitalize">{activeRequest?.status}</strong>. 
                  <a href={`/dashboard/request/${activeRequest?.id}`} className="underline ml-1">
                    View request
                  </a>
                </p>
              </div>
            </div>
          )}
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
                  <Label htmlFor="images">Images (optional)</Label>
                  <div
                    className="border-dashed border-2 border-border rounded-md p-4 flex flex-col items-center justify-center text-center bg-muted/30"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const dt = e.dataTransfer
                      if (dt?.files) {
                        handleFiles(dt.files)
                      }
                    }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Drag & drop images here, or</p>
                    <input
                      id="images"
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      Choose Images
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">You may upload up to 5 images. Max 5MB per image.</p>
                  </div>

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative rounded overflow-hidden border">
                          <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-24" />
                          <button
                            type="button"
                            onClick={() => removePreview(idx)}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <Button type="submit" disabled={isLoading || hasActiveRequest} className="flex-1">
                    {hasActiveRequest ? "Active request exists" : isLoading ? "Creating..." : "Create Request"}
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
