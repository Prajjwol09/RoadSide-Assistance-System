// Get all ratings for a specific service request

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    // Get all ratings for this service request
    const ratings = db
      .prepare(
        `
      SELECT 
        r.*,
        rater.name as rater_name,
        rated.name as rated_name
      FROM ratings r
      JOIN users rater ON r.rater_id = rater.id
      JOIN users rated ON r.rated_id = rated.id
      WHERE r.service_request_id = ?
      ORDER BY r.created_at DESC
    `,
      )
      .all(id)

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error("Get ratings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
