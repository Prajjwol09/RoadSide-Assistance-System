// Get system statistics for admin dashboard

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole("admin")

    // Get total users count
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any

    // Get total helpers count
    const totalHelpers = db.prepare("SELECT COUNT(*) as count FROM helpers").get() as any

    // Get total requests count
    const totalRequests = db.prepare("SELECT COUNT(*) as count FROM service_requests").get() as any

    // Get completed requests count
    const completedRequests = db
      .prepare("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'")
      .get() as any

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers.count,
        totalHelpers: totalHelpers.count,
        totalRequests: totalRequests.count,
        completedRequests: completedRequests.count,
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
