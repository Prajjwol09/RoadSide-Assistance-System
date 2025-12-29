// Decline service request (Helper action)

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Get helper profile
    const helper = db.prepare("SELECT * FROM helpers WHERE user_id = ?").get(session.id) as any

    if (!helper) {
      return NextResponse.json({ error: "Helper profile not found" }, { status: 404 })
    }

    // Verify the request is assigned to this helper
    const serviceRequest = db
      .prepare("SELECT * FROM service_requests WHERE id = ? AND helper_id = ?")
      .get(id, helper.id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or not assigned to you" }, { status: 404 })
    }

    // Only allow decline when status is 'pending'
    if (serviceRequest.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending or already responded" }, { status: 400 })
    }

    // Re-open the request so the user can select another helper
    // Clear the assigned helper and set status back to 'requested'
    db.prepare(
      "UPDATE service_requests SET helper_id = NULL, status = 'requested', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(id)

    // Record helper response so they can't be re-assigned or re-accept later
    try {
      db.prepare(
        "INSERT OR REPLACE INTO service_request_helper_responses (service_request_id, helper_id, response) VALUES (?, ?, 'declined')",
      ).run(id, helper.id)
    } catch (e) {
      console.warn("Failed to record helper response", e)
    }

    // Do not change helper availability; they remain available

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Decline request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
