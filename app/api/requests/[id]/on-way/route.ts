// Mark helper as on the way (Helper action)

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

    // Verify the request is assigned to this helper and accepted
    const serviceRequest = db
      .prepare("SELECT * FROM service_requests WHERE id = ? AND helper_id = ?")
      .get(id, helper.id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found or not assigned to you" }, { status: 404 })
    }

    // Only allow when status is 'accepted'
    if (serviceRequest.status !== "accepted") {
      return NextResponse.json({ error: "Request must be accepted first" }, { status: 400 })
    }

    // Send notification to the user
    const helperUser = db.prepare("SELECT name FROM users WHERE id = ?").get(session.id) as any
    await notificationService.notifyHelperOnWay(serviceRequest.user_id, parseInt(id), helperUser.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("On way error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}