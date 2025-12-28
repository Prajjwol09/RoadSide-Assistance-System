// Cancel service request (User action) - allowed only when request is in 'pending' state

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Verify the request belongs to the user
    const serviceRequest = db.prepare("SELECT * FROM service_requests WHERE id = ? AND user_id = ?").get(id, session.id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or access denied" }, { status: 404 })
    }

    // Only allow cancel when status is 'pending'
    if (serviceRequest.status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 })
    }

    // Mark request as cancelled
    db.prepare("UPDATE service_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id)

    // If a helper was assigned, restore their availability
    if (serviceRequest.helper_id) {
      db.prepare("UPDATE helpers SET is_available = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(serviceRequest.helper_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
