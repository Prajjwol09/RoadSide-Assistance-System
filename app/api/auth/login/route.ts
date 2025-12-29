// Login API route
// Handles user authentication and session creation

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { createSession } from "@/lib/auth"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { email, password } = body

    // Normalize
    email = email ? String(email).trim().toLowerCase() : ""
    password = password ? String(password) : ""

    console.log("Login attempt:", { email })

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email (or phone) and password are required" }, { status: 400 })
    }

    // Support login by phone or email. If input looks like digits only, treat as phone.
    let user: any = null
    const phoneLike = /^\d{6,}$/.test(email.replace(/\D/g, "")) && !email.includes("@")

    if (phoneLike) {
      user = db.prepare("SELECT * FROM users WHERE replace(phone, ' ', '') = ? AND password = ?").get(
        email.replace(/\D/g, ""),
        password,
      ) as any
    } else {
      user = db.prepare("SELECT * FROM users WHERE lower(email) = ? AND password = ?").get(email, password) as any
    }

    console.log("Login lookup result:", user ? { id: user.id, email: user.email, role: user.role } : null)

    if (!user) {
      if (config.debug) {
        // Return a hint with existing sample emails (safe for dev only)
        const sample = db.prepare("SELECT email, phone FROM users LIMIT 10").all()
        return NextResponse.json({ error: "Invalid credentials", hints: { sample } }, { status: 401 })
      }
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 })
    }

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
