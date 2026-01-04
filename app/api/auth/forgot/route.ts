// Forgot password: generate reset token and store it

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    // Ensure password_resets table exists
    db.prepare(
      `CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ).run()

    const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(String(email).toLowerCase()) as any

    // Always return success to avoid revealing whether email exists
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(20).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    db.prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, token, expires)

    // In production, send email with token link. For dev return token so it can be used directly.
    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
