// Accept service request (Helper action)
// Also automatically sets helper availability to unavailable

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { notificationService } from "@/lib/notifications"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Get helper profile
    const helper = db.prepare("SELECT * FROM helpers WHERE user_id = ?").get(session.id) as any

    if (!helper) {
      return NextResponse.json({ error: "Helper profile not found" }, { status: 404 })
    }

    // Verify the request is assigned to this helper and still pending
    const serviceRequest = db
      .prepare("SELECT * FROM service_requests WHERE id = ? AND helper_id = ?")
      .get(id, helper.id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or not assigned to you" }, { status: 404 })
    }

    // Only allow accept when status is 'pending'
    if (serviceRequest.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending or already responded" }, { status: 400 })
    }

    // Prevent accept if this helper previously declined
    const prev = db
      .prepare("SELECT id FROM service_request_helper_responses WHERE service_request_id = ? AND helper_id = ? AND response = 'declined'")
      .get(id, helper.id)
    if (prev) {
      return NextResponse.json({ error: "You previously declined this request and cannot accept it" }, { status: 400 })
    }

    // Update request status to accepted
    db.prepare("UPDATE service_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id)

    // Send notification to the user
    const helperUser = db.prepare("SELECT name FROM users WHERE id = ?").get(session.id) as any
    await notificationService.notifyRequestAccepted(serviceRequest.user_id, parseInt(id), helperUser.name)

    // Record helper acceptance
    try {
      db.prepare(
        "INSERT OR REPLACE INTO service_request_helper_responses (service_request_id, helper_id, response) VALUES (?, ?, 'accepted')",
      ).run(id, helper.id)
    } catch (e) {
      console.warn("Failed to record helper acceptance", e)
    }

    // Automatically set helper availability to unavailable
    db.prepare("UPDATE helpers SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(helper.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
