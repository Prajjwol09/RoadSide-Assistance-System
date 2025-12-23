// Check if user has already rated a service request

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get("request_id")

    if (!requestId) {
      return NextResponse.json({ error: "Missing request_id parameter" }, { status: 400 })
    }

    // Check if user has rated this request
    const rating = db
      .prepare("SELECT id FROM ratings WHERE service_request_id = ? AND rater_id = ?")
      .get(requestId, session.id)

    return NextResponse.json({ hasRated: !!rating })
  } catch (error) {
    console.error("Check rating error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
