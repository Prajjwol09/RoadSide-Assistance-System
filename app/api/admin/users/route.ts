// Get all users for admin dashboard

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole("admin")

    // Get all users
    const users = db
      .prepare("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC")
      .all()

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
