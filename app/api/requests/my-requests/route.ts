// Get user's service requests API route

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await requireAuth()

    // Get all requests created by the user
    const requests = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as helper_name
      FROM service_requests sr
      LEFT JOIN helpers h ON sr.helper_id = h.id
      LEFT JOIN users u ON h.user_id = u.id
      WHERE sr.user_id = ?
      ORDER BY sr.created_at DESC
    `,
      )
      .all(session.id)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get my requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
