// Mark service request as completed (User action)

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Verify the request belongs to the user
    const serviceRequest = db.prepare("SELECT * FROM service_requests WHERE id = ? AND user_id = ?").get(id, session.id)

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or access denied" }, { status: 404 })
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
