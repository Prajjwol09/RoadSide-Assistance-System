// Update helper availability API route

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { is_available } = body

    // Update availability
    db.prepare("UPDATE helpers SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(
      is_available ? 1 : 0,
      session.id,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update availability error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
