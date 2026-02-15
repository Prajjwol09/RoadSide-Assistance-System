// Road Sathi Logo Component
// Clean, scalable logo for the roadside assistance platform

import React from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function RoadSathiLogo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-full h-full p-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Road/Path Element */}
          <path
            d="M4 20 L12 16 L20 18 L28 14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          {/* Road markings */}
          <circle cx="8" cy="18" r="1" fill="white" opacity="0.8"/>
          <circle cx="16" cy="17" r="1" fill="white" opacity="0.8"/>
          <circle cx="24" cy="15" r="1" fill="white" opacity="0.8"/>

          {/* Helping Hand Element */}
          <path
            d="M6 12 L8 10 L10 12 L9 14 L7 13 Z"
            fill="white"
            opacity="0.9"
            className="drop-shadow-sm"
          />
          {/* Hand details */}
          <circle cx="7.5" cy="11" r="0.5" fill="rgba(16, 185, 129, 0.8)"/>
          <circle cx="8.5" cy="12" r="0.3" fill="rgba(16, 185, 129, 0.8)"/>
        </svg>
      </div>
      {showText && (
        <div>
          <h1 className={`font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
            Road Sathi
          </h1>
          <p className="text-sm text-slate-600 font-medium">Your Road Companion</p>
        </div>
      )}
    </div>
  )
}

// Simple icon-only version for favicons or small spaces
export function RoadSathiIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }

  return (
    <div className={`flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-4/5 h-4/5"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Road/Path Element */}
        <path
          d="M4 20 L12 16 L20 18 L28 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Road markings */}
        <circle cx="8" cy="18" r="1" fill="white" opacity="0.8"/>
        <circle cx="16" cy="17" r="1" fill="white" opacity="0.8"/>
        <circle cx="24" cy="15" r="1" fill="white" opacity="0.8"/>

        {/* Helping Hand Element */}
        <path
          d="M6 12 L8 10 L10 12 L9 14 L7 13 Z"
          fill="white"
          opacity="0.9"
        />
        {/* Hand details */}
        <circle cx="7.5" cy="11" r="0.5" fill="rgba(16, 185, 129, 0.8)"/>
        <circle cx="8.5" cy="12" r="0.3" fill="rgba(16, 185, 129, 0.8)"/>
      </svg>
    </div>
  )
}