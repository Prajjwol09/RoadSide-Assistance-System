// Get helper profile API route

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await requireAuth()

    // Ensure helpers remain enabled by default when they load their profile
    try {
      db.prepare("UPDATE helpers SET is_available = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(session.id)
    } catch (e) {
      // ignore update failures
    }

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

    // Fetch recent ratings given to this helper by users (limit 5)
    const ratings = db
      .prepare(
        `
      SELECT r.id, r.stars, r.feedback, r.created_at, u.name as rater_name
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ? AND u.role = 'user'
      ORDER BY r.created_at DESC
      LIMIT 5
    `,
      )
      .all(session.id)

    return NextResponse.json({ profile, ratings })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
