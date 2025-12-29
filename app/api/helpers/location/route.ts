import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    // Ensure helper profile exists
    const helper = db.prepare("SELECT * FROM helpers WHERE user_id = ?").get(session.id)
    if (!helper) {
      return NextResponse.json({ error: "Helper profile not found" }, { status: 404 })
    }

    db.prepare("UPDATE helpers SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(latitude, longitude, helper.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update helper location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
