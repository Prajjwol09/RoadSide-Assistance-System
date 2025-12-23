// Get all helpers for admin dashboard

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole("admin")

    // Get all helpers with user info
    const helpers = db
      .prepare(
        `
      SELECT 
        h.*,
        u.name,
        u.email
      FROM helpers h
      JOIN users u ON h.user_id = u.id
      ORDER BY h.rating_average DESC, h.total_ratings DESC
    `,
      )
      .all()

    return NextResponse.json({ helpers })
  } catch (error) {
    console.error("Get helpers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
