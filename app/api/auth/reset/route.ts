// Reset password with token

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 })

    const reset = db.prepare("SELECT * FROM password_resets WHERE token = ?").get(token) as any

    if (!reset) return NextResponse.json({ error: "Invalid token" }, { status: 400 })

    const now = new Date().toISOString()
    if (reset.expires_at < now) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 })
    }

    // Update user password (note: passwords are stored in plain text in this demo)
    db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(password, reset.user_id)

    // Remove used token
    db.prepare("DELETE FROM password_resets WHERE id = ?").run(reset.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
