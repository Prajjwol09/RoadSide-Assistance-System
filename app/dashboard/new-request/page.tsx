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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md mx-4 border border-white/30">
            <div className="flex flex-col items-center gap-6">
              {/* Animated Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin"></div>
              </div>
              
              {/* Loading Text */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Creating Request
                </h2>
                <p className="text-slate-600 text-sm">
                  Finding nearby helpers for you...
                </p>
              </div>
              
              {/* Animated dots */}
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <Navbar user={user} />
      <main className="container py-12 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header Section - Enhanced */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-sm mb-8 hover:bg-white/70 transition-all duration-300">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              <span className="text-lg font-bold text-slate-700">
                Road Sathi
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 tracking-tight">
              Create Service Request
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Describe your roadside emergency and we'll instantly connect you with verified helpers nearby
            </p>
          </div>

          {/* Active Request Warning - Enhanced */}
          {hasActiveRequest && (
            <div className="mb-12">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 backdrop-blur-sm shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent"></div>
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-800 mb-2 text-lg">Active Service Request</h3>
                      <p className="text-amber-700 text-sm mb-4">
                        You have an active request with status: <span className="font-bold text-amber-900 capitalize">{activeRequest?.status}</span>
                      </p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                      >
                        <a href={`/dashboard/request/${activeRequest?.id}`}>
                          View Active Request →
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Card - Enhanced Premium */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-3xl shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-10 space-y-10">
                {/* Issue Description Section - Enhanced */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Issue Details</h2>
                      <p className="text-slate-600 text-sm mt-1">Help us understand your situation</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="issue" className="text-slate-800 font-semibold text-base block">
                      What's wrong? <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="issue"
                      placeholder="Describe your exact issue (e.g., 'Flat tire on front right wheel', 'Engine won't start', 'Car ran out of fuel')..."
                      value={formData.issue_description}
                      onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                      rows={6}
                      required
                      className="bg-white/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-300 resize-none font-medium"
                    />
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1 -4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Include vehicle type and details about what happened</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                {/* Image Upload Section - Enhanced */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Photos</h2>
                      <p className="text-slate-600 text-sm mt-1">Show the problem (optional)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-100 to-transparent hover:from-slate-200 hover:to-slate-100 transition-all duration-300 cursor-pointer group"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const dt = e.dataTransfer
                        if (dt?.files) {
                          handleFiles(dt.files)
                        }
                      }}
                      onClick={() => inputRef.current?.click()}
                    >
                      <input
                        id="images"
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />

                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-400/30">
                        <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">Upload Photos</h3>
                      <p className="text-slate-300 mb-4">
                        Drag images here or click to browse
                      </p>
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Choose Photos
                      </Button>
                      <p className="text-xs text-slate-400 mt-4">
                        Up to 5 images • Max 5MB each • JPG, PNG
                      </p>
                    </div>

                    {/* Image Previews - Enhanced */}
                    {previews.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white">Selected Images</h4>
                          <span className="text-sm text-slate-300 bg-white/10 px-3 py-1 rounded-full">{previews.length}/5</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {previews.map((src, idx) => (
                            <div key={idx} className="relative group rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg hover:border-white/40 transition-all duration-300">
                              <img
                                src={src}
                                alt={`Preview ${idx + 1}`}
                                className="object-cover w-full h-32 bg-slate-800"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removePreview(idx)
                                  }}
                                  className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                  aria-label="Remove image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                {/* Location Section - Enhanced */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Location</h2>
                      <p className="text-slate-600 text-sm mt-1">Where are you located?</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Button
                      type="button"
                      onClick={handleGetLocation}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                    >
                      <MapPin className="mr-3 h-5 w-5" />
                      Use My Current Location
                    </Button>

                    <div className="flex items-center gap-3 opacity-60">
                      <div className="h-px flex-1 bg-slate-300"></div>
                      <span className="text-slate-600 text-sm font-medium">OR</span>
                      <div className="h-px flex-1 bg-slate-300"></div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="latitude" className="text-slate-800 font-semibold">
                          Latitude <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          placeholder="40.7128"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          required
                          className="bg-white/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="longitude" className="text-slate-800 font-semibold">
                          Longitude <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          placeholder="-74.0060"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          required
                          className="bg-white/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Section - Enhanced */}
                <div className="pt-8 border-t border-slate-200">
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 bg-white/70 hover:bg-white border border-slate-300 text-slate-800 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || hasActiveRequest}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-300 text-lg font-bold ${
                        isLoading
                          ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl scale-100"
                          : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                      } disabled:opacity-60 disabled:cursor-not-allowed text-white ${!isLoading && !hasActiveRequest && "hover:shadow-2xl hover:-translate-y-0.5"}`}
                    >
                      {hasActiveRequest ? (
                        <div className="flex items-center justify-center gap-3">
                          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>Request Active</span>
                        </div>
                      ) : isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="relative w-5 h-5">
                            <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin"></div>
                          </div>
                          <span>Creating Request...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Create Request</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
