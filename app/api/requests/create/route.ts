// Create service request API route

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { issue_description, latitude, longitude } = body

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
      .run(session.id, issue_description, latitude, longitude)

    return NextResponse.json({
      success: true,
      requestId: result.lastInsertRowid,
    })
  } catch (error) {
    console.error("Create request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
