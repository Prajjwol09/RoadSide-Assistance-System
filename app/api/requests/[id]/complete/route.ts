// Mark service request as completed (User action)

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Fetch the service request
    const serviceRequest = db.prepare("SELECT * FROM service_requests WHERE id = ?").get(id)

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Allow the request owner (user) OR the assigned helper OR admin to mark completed
    const isOwner = serviceRequest.user_id === session.id && session.role === "user"
    let isHelper = false
    if (session.role === "helper") {
      // `service_requests.helper_id` references the `helpers.id` (not users.id).
      // Map current session user -> helpers record to check ownership.
      const helperRecord = db.prepare("SELECT id FROM helpers WHERE user_id = ?").get(session.id) as any
      if (helperRecord && helperRecord.id === serviceRequest.helper_id) {
        isHelper = true
      }
    }
    const isAdmin = session.role === "admin"

    if (!isOwner && !isHelper && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update request status to completed
    db.prepare(
      "UPDATE service_requests SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Complete request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
