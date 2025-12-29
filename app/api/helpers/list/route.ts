// Get list of all helpers with their profiles
// Supports optional filtering by availability

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const availableOnly = searchParams.get("available") === "true"

    let query = `
      SELECT 
        h.id,
        h.skills,
        h.address,
        h.latitude,
        h.longitude,
        h.is_available,
        h.rating_average,
        h.total_ratings,
        u.name as name
      FROM helpers h
      JOIN users u ON h.user_id = u.id
    `

    if (availableOnly) {
      query += " WHERE h.is_available = 1"
    }

    query += " ORDER BY h.rating_average DESC, h.total_ratings DESC"

    const helpers = db.prepare(query).all()

    return NextResponse.json({ helpers })
  } catch (error) {
    console.error("Get helpers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
