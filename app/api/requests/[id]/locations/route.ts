import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const req = db.prepare("SELECT id, latitude, longitude, helper_id FROM service_requests WHERE id = ?").get(id)
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    let helperLocation = null
    if (req.helper_id) {
      const h = db.prepare("SELECT latitude, longitude FROM helpers WHERE id = ?").get(req.helper_id)
      if (h) helperLocation = { latitude: h.latitude, longitude: h.longitude }
    }

    return NextResponse.json({ user: { latitude: req.latitude, longitude: req.longitude }, helper: helperLocation })
  } catch (error) {
    console.error("Get request locations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
