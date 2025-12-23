// Get helper's accepted service requests

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await requireAuth()

    // Get helper ID
    const helper = db.prepare("SELECT id FROM helpers WHERE user_id = ?").get(session.id) as any

    if (!helper) {
      return NextResponse.json({ requests: [] })
    }

    // Get all requests accepted by this helper
    const requests = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as user_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.helper_id = ? AND sr.status IN ('accepted', 'pending')
      ORDER BY sr.created_at DESC
    `,
      )
      .all(helper.id)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get my accepted requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
