// Registration API route
// Handles new user registration for both users and helpers

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password, name, role, helperData } = body

    // Validate input
    if (!email || !phone || !password || !name || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ? OR phone = ?").get(email, phone)

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or phone already exists" }, { status: 409 })
    }

    // Insert new user
    // In production, hash the password using bcrypt or similar
    const result = db
      .prepare("INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)")
      .run(email, phone, password, name, role)

    const userId = result.lastInsertRowid as number

    // If registering as a helper, create helper profile
    if (role === "helper" && helperData) {
      const { skills, address, latitude, longitude } = helperData

      if (!skills || !address) {
        return NextResponse.json({ error: "Helper profile requires skills and address" }, { status: 400 })
      }

      db.prepare("INSERT INTO helpers (user_id, skills, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)").run(
        userId,
        skills,
        address,
        latitude || null,
        longitude || null,
      )
    }

    // Create session for new user
    await createSession({
      id: userId,
      email,
      name,
      role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
