// Accept service request (Helper action)
// Also automatically sets helper availability to unavailable

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

    // Update request status to accepted
    db.prepare("UPDATE service_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id)

    // Automatically set helper availability to unavailable
    db.prepare("UPDATE helpers SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(helper.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
