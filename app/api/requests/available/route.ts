// Get available service requests for helpers

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    await requireAuth()

    // Get all requests with status 'requested' or 'pending'
    const requests = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as user_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.status IN ('requested', 'pending')
      ORDER BY sr.created_at DESC
    `,
      )
      .all()

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get available requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
