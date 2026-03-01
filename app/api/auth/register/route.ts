// Registration API route
// Handles new user registration for both users and helpers

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { createSession } from "@/lib/auth"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Register attempt:', { body: { ...body, password: body.password ? '*****' : undefined } })
    let { email, phone, password, name, role, helperData } = body
    // Normalize inputs
    email = String(email).trim().toLowerCase()
    phone = phone ? String(phone).replace(/\s+/g, "") : ""

    // Validate input
    if (!email || !phone || !password || !name || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // ensure phone starts with a single plus sign; clients supply full code
    if (!phone.startsWith("+")) {
      phone = "+" + phone
    }
    // if user somehow included multiple pluses, collapse them to single
    phone = phone.replace(/^\++/, "+")

    // Basic format check: plus followed by digits only
    if (!/^\+\d+$/.test(phone)) {
      return NextResponse.json({ error: "Phone number must include country code and digits" }, { status: 400 })
    }

    // server-side password strength check
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pwdRegex.test(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long and include uppercase, lowercase, and a number" },
        { status: 400 },
      )
    }

    // Check if user already exists (compare normalized phone to avoid formatting collisions)
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ? OR replace(phone, ' ', '') = ?")
      .get(email, phone)

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or phone already exists" }, { status: 409 })
    }

    // Insert new user
    // In production, hash the password using bcrypt or similar
    let result
    try {
      result = db.prepare("INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)").run(
        email,
        phone,
        password,
        name,
        role,
      )
    } catch (err: any) {
      console.error('User insert error:', err)
      // Handle common SQLite errors gracefully
      const message = err?.message || ''

      if (/no such table/i.test(message)) {
        // This should be rare now that db.ts auto-initializes the schema,
        // but provide a clearer message in case something went wrong.
        return NextResponse.json(
          { error: 'Database not initialized (missing users table). Run `npm run db:init` or restart server.' },
          { status: 500 },
        )
      }

      if (/UNIQUE constraint failed/i.test(message) || err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 409 })
      }
      if (config.debug) return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userId = Number(result.lastInsertRowid)

    // If registering as a helper, create helper profile
    if (role === "helper" && helperData) {
      const { skills, address, latitude, longitude } = helperData

      if (!skills || !address) {
        return NextResponse.json({ error: "Helper profile requires skills and address" }, { status: 400 })
      }

      try {
        db
          .prepare("INSERT INTO helpers (user_id, skills, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)")
          .run(userId, skills, address, latitude || null, longitude || null)
      } catch (err: any) {
        console.error('Helper insert error:', err)
        const message = err?.message || ''
        if (/UNIQUE constraint failed/i.test(message) || err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return NextResponse.json({ error: 'Helper profile already exists for this user' }, { status: 409 })
        }
        if (config.debug) return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
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
