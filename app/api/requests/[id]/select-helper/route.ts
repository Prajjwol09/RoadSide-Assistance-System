// Select helper for service request (User action)

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { helper_id } = body

    // Verify the request belongs to the user
    const serviceRequest = db.prepare("SELECT * FROM service_requests WHERE id = ? AND user_id = ?").get(id, session.id)

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or access denied" }, { status: 404 })
    }

    // Update request with selected helper and change status to pending
    db.prepare(
      "UPDATE service_requests SET helper_id = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(helper_id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Select helper error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
