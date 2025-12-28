// Create service request API route

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { issue_description, latitude, longitude } = body

    // Debug: log session and incoming payload to help diagnose FK errors
    console.log("Create request: session=", session)
    console.log("Create request: payload=", { issue_description, latitude, longitude })

    // Ensure the session user actually exists in the users table (avoid FK failure)
    const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(session.id)
    if (!userExists) {
      console.error(`Create request error: session user id=${session.id} not found in users table`)
      return NextResponse.json({ error: "Invalid session user" }, { status: 401 })
    }

    // Validate input
    if (!issue_description || !latitude || !longitude) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already has an active request
    const existingRequest = db
      .prepare("SELECT id FROM service_requests WHERE user_id = ? AND status NOT IN ('completed', 'cancelled')")
      .get(session.id)

    if (existingRequest) {
      return NextResponse.json({ error: "You already have an active service request" }, { status: 409 })
    }

    // Create service request
    const result = db
      .prepare(
        "INSERT INTO service_requests (user_id, issue_description, latitude, longitude, status) VALUES (?, ?, ?, ?, 'requested')",
      )
      .run(session.id, issue_description, Number(latitude), Number(longitude))

    return NextResponse.json({
      success: true,
      requestId: result.lastInsertRowid,
    })
  } catch (error) {
    console.error("Create request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
