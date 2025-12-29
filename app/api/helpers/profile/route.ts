// Get helper profile API route

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await requireAuth()

    // Get helper profile
    const profile = db
      .prepare(
        `
      SELECT * FROM helpers WHERE user_id = ?
    `,
      )
      .get(session.id)

    if (!profile) {
      return NextResponse.json({ error: "Helper profile not found" }, { status: 404 })
    }

    // Fetch ratings given to this helper (as a user)
    const ratings = db
      .prepare(
        `
      SELECT r.id, r.stars, r.feedback, r.created_at, u.name as rater_name
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ?
      ORDER BY r.created_at DESC
    `,
      )
      .all(session.id)

    return NextResponse.json({ profile, ratings })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
