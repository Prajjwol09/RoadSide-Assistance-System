// Notifications API route
// GET: Fetch notifications for the current user
// POST: Mark notifications as read

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = "SELECT id, type, message, read, data, created_at FROM notifications WHERE user_id = ?"
    const params: any[] = [session.id]

    if (unreadOnly) {
      query += " AND read = 0"
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const notifications = db.prepare(query).all(...params)

    // Parse data JSON if present
    const parsedNotifications = notifications.map((n: any) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
      read: Boolean(n.read),
    }))

    return NextResponse.json({ notifications: parsedNotifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (action === "mark_read" && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const placeholders = notificationIds.map(() => "?").join(",")
      const query = `UPDATE notifications SET read = 1 WHERE id IN (${placeholders}) AND user_id = ?`
      db.prepare(query).run(...notificationIds, session.id)

      return NextResponse.json({ success: true })
    } else if (action === "mark_all_read") {
      // Mark all notifications as read for the user
      db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(session.id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}