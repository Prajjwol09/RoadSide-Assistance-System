// Registration page component
// Allows new users to create accounts as either regular users or helpers

"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { RoadSathiLogo } from "@/components/logo"
import { Check, Eye, EyeOff, ChevronLeft } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<"user" | "helper">("user")
  const [countryCode, setCountryCode] = useState("+977")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", // user will enter local number only
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [helperData, setHelperData] = useState({
    skills: "",
    address: "",
    latitude: "",
    longitude: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  // Password requirement flags (recomputed on each render)
  const pwd = formData.password
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  const hasLength = pwd.length >= 8

  const countryOptions = useMemo(
    () => [
      { code: "+977", label: "Nepal" },
      { code: "+1", label: "USA" },
      { code: "+91", label: "India" },
      { code: "+44", label: "UK" },
      { code: "+61", label: "Australia" },
      // add more codes as needed
    ],
    [],
  )

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      })
      setIsLoading(false)
      return
    }

    // Validate password strength (min 8 chars, uppercase, lowercase, digit)
    const pwd = formData.password
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pwdRegex.test(pwd)) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Password must be at least 8 characters and include uppercase, lowercase and a number",
      })
      setIsLoading(false)
      return
    }

    try {
      // Normalize phone (remove spaces) and trim email before sending
      let normalizedPhone = formData.phone ? formData.phone.replace(/\s+/g, "") : formData.phone
      // strip any leading "+" the user may have typed with code
      if (normalizedPhone && normalizedPhone.startsWith("+")) {
        normalizedPhone = normalizedPhone.replace(/^\+/, "")
      }
      const fullPhone = normalizedPhone ? `${countryCode}${normalizedPhone}` : normalizedPhone
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          role,
          helperData:
            role === "helper"
              ? {
                  ...helperData,
                  latitude: helperData.latitude ? Number.parseFloat(helperData.latitude) : null,
                  longitude: helperData.longitude ? Number.parseFloat(helperData.longitude) : null,
                }
              : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        })

        // Redirect based on role
        if (role === "helper") {
          router.push("/helper")
        } else {
          router.push("/dashboard")
        }
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || data.detail || "An error occurred",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity duration-200">
              <RoadSathiLogo size="lg" showText={true} />
            </Link>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
            Create Your Account
          </h1>
          <p className="text-slate-600">Join our community of users and helpers</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/30 rounded-3xl shadow-2xl">
          <form onSubmit={handleRegister}>
            <CardContent className="p-8 space-y-8">
              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-semibold text-lg">I want to register as:</Label>
                <RadioGroup value={role} onValueChange={(value: any) => setRole(value)} className="flex gap-6">
                  <div className="flex items-center space-x-3 p-4 bg-slate-50/50 rounded-2xl border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer">
                    <RadioGroupItem value="user" id="user" />
                    <div>
                      <Label htmlFor="user" className="cursor-pointer font-semibold text-slate-800">
                        User
                      </Label>
                      <p className="text-sm text-slate-600">Request roadside assistance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-slate-50/50 rounded-2xl border border-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer">
                    <RadioGroupItem value="helper" id="helper" />
                    <div>
                      <Label htmlFor="helper" className="cursor-pointer font-semibold text-slate-800">
                        Helper
                      </Label>
                      <p className="text-sm text-slate-600">Provide roadside assistance</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Basic Information</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={countryCode}
                        onValueChange={(val) => setCountryCode(val)}
                        className="w-32"
                      >
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((opt) => (
                            <SelectItem key={opt.code} value={opt.code}>
                              {opt.label} ({opt.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9812345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="flex-1 bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Country code is selected on the left.</p>
                  </div>
                  <div></div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-white/50 border-white/30 rounded-2xl pr-10 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    <ul className="text-xs mt-1 space-y-1">
                      <li className={hasUpper ? "text-green-600" : "text-red-600"}>
                        <Check className="inline-block mr-1 size-4" />Uppercase letter
                      </li>
                      <li className={hasLower ? "text-green-600" : "text-red-600"}>
                        <Check className="inline-block mr-1 size-4" />Lowercase letter
                      </li>
                      <li className={hasNumber ? "text-green-600" : "text-red-600"}>
                        <Check className="inline-block mr-1 size-4" />Number
                      </li>
                      <li className={hasLength ? "text-green-600" : "text-red-600"}>
                        <Check className="inline-block mr-1 size-4" />8+ characters
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="bg-white/50 border-white/30 rounded-2xl pr-10 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Helper-specific fields */}
              {role === "helper" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Helper Information</h3>
                  <div className="space-y-3">
                    <Label htmlFor="skills" className="text-slate-700 font-medium">Skills & Services</Label>
                    <Textarea
                      id="skills"
                      placeholder="e.g., Tire Change, Battery Jump, Towing, Fuel Delivery"
                      value={helperData.skills}
                      onChange={(e) => setHelperData({ ...helperData, skills: e.target.value })}
                      required
                      className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300 min-h-24"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-slate-700 font-medium">Service Area Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Your service area address"
                      value={helperData.address}
                      onChange={(e) => setHelperData({ ...helperData, address: e.target.value })}
                      required
                      className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300 min-h-20"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="latitude" className="text-slate-700 font-medium">Latitude (Optional)</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="40.7128"
                        value={helperData.latitude}
                        onChange={(e) => setHelperData({ ...helperData, latitude: e.target.value })}
                        className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="longitude" className="text-slate-700 font-medium">Longitude (Optional)</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="-74.0060"
                        value={helperData.longitude}
                        onChange={(e) => setHelperData({ ...helperData, longitude: e.target.value })}
                        className="bg-white/50 border-white/30 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <p className="text-center text-slate-600 text-sm w-full">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}