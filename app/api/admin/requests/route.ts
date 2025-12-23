// Get all service requests for admin dashboard

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole("admin")

    // Get all service requests with user and helper info
    const requests = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as user_name,
        h_user.name as helper_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN helpers h ON sr.helper_id = h.id
      LEFT JOIN users h_user ON h.user_id = h_user.id
      ORDER BY sr.created_at DESC
    `,
      )
      .all()

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
