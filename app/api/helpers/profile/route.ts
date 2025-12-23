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

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
