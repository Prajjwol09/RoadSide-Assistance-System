// User Dashboard
// Main interface for users to view and manage their service requests

"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, MapPin, Clock, User, Search, ArrowRight, Calendar, Filter } from "lucide-react"
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

const statusVariants = {
  "In Progress": "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200",
  "Completed": "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200",
  "Pending": "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200",
  "requested": "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200",
  "pending": "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200",
  "accepted": "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200",
  "completed": "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200",
}

const statusLabels = {
  "requested": "Pending",
  "pending": "Pending",
  "accepted": "In Progress",
  "completed": "Completed",
}

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = request.issue_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.id.toString().includes(searchQuery)
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [requests, searchQuery, statusFilter])

  const getStatusDisplay = (status: string) => {
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  const getStatusVariant = (status: string) => {
    const displayStatus = getStatusDisplay(status)
    return statusVariants[displayStatus as keyof typeof statusVariants] || statusVariants["Pending"]
  }

  if (!user) {
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
        {/* Header Section */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">Road Sathi</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              My Service Requests
            </h1>
            <p className="text-lg text-slate-600 max-w-md">
              Your trusted roadside assistance companion - manage all your service requests in one place
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/new-request")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="mr-3 h-5 w-5" />
            New Request
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              placeholder="Search requests by description or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm border-white/30 rounded-2xl shadow-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300 text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
              <Filter className="text-slate-500 h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-0 bg-transparent shadow-none focus:ring-0 text-slate-700 font-medium">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-white/30 rounded-xl">
                  <SelectItem value="all" className="hover:bg-blue-50 focus:bg-blue-50">All Statuses</SelectItem>
                  <SelectItem value="requested" className="hover:bg-yellow-50 focus:bg-yellow-50">Pending</SelectItem>
                  <SelectItem value="accepted" className="hover:bg-blue-50 focus:bg-blue-50">In Progress</SelectItem>
                  <SelectItem value="completed" className="hover:bg-green-50 focus:bg-green-50">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#</span>
                      </div>
                      <Skeleton className="h-7 w-16 bg-slate-200" />
                    </div>
                    <Skeleton className="h-7 w-24 bg-slate-200 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-full bg-slate-200 mb-2" />
                  <Skeleton className="h-5 w-4/5 bg-slate-200" />
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <Skeleton className="h-5 w-32 bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <Skeleton className="h-5 w-40 bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <Skeleton className="h-5 w-28 bg-slate-200" />
                  </div>
                  <Skeleton className="h-12 w-full bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl mt-6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-blue-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">?</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-800">
                    {requests.length === 0 ? "No service requests yet" : "No matching requests"}
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {requests.length === 0
                      ? "Ready to get help? Create your first roadside assistance request and we'll connect you with nearby helpers."
                      : "Try adjusting your search terms or filter criteria to find what you're looking for."
                    }
                  </p>
                </div>
                {requests.length === 0 && (
                  <Button
                    onClick={() => router.push("/dashboard/new-request")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="mr-3 h-5 w-5" />
                    Create Your First Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-center">
              <div className="px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/30 shadow-sm">
                <p className="text-slate-700 font-medium">
                  Showing <span className="text-blue-600 font-bold">{filteredRequests.length}</span> of <span className="text-slate-800 font-bold">{requests.length}</span> requests
                </p>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
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
                      <Badge
                        className={`px-4 py-2 text-sm font-semibold border-0 rounded-full shadow-sm ${
                          getStatusVariant(request.status)
                        }`}
                      >
                        {getStatusDisplay(request.status)}
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
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Date & Time</p>
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
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Helper</p>
                        <p className="text-slate-800 text-sm">
                          {request.helper_name ? (
                            <span className="font-semibold text-slate-900">{request.helper_name}</span>
                          ) : (
                            <span className="text-slate-500 italic">Not assigned yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform group-hover:scale-105"
                      onClick={() => router.push(`/dashboard/request/${request.id}`)}
                    >
                      View Details
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
