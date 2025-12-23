// Get service request by ID

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params

    const serviceRequest = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as user_name,
        h_user.id as helper_user_id,
        h_user.name as helper_name
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN helpers h ON sr.helper_id = h.id
      LEFT JOIN users h_user ON h.user_id = h_user.id
      WHERE sr.id = ?
    `,
      )
      .get(id)

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ request: serviceRequest })
  } catch (error) {
    console.error("Get request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
