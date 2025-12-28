// Login API route
// Handles user authentication and session creation

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt:", { email })

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    // In production, use proper password hashing (bcrypt, argon2, etc.)
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any
    console.log("Login lookup result:", user ? { id: user.id, email: user.email, role: user.role } : null)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
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
