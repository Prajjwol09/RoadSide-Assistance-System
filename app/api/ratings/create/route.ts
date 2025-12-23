// Create rating API route
// Allows users and helpers to rate each other after service completion
// Also updates helper's average rating

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { service_request_id, rated_id, stars, feedback } = body

    // Validate input
    if (!service_request_id || !rated_id || !stars) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if service request exists and is completed
    const serviceRequest = db.prepare("SELECT * FROM service_requests WHERE id = ?").get(service_request_id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 })
    }

    if (serviceRequest.status !== "completed") {
      return NextResponse.json({ error: "Can only rate completed service requests" }, { status: 400 })
    }

    // Check if user has already rated
    const existingRating = db
      .prepare("SELECT id FROM ratings WHERE service_request_id = ? AND rater_id = ?")
      .get(service_request_id, session.id)

    if (existingRating) {
      return NextResponse.json({ error: "You have already rated this service" }, { status: 409 })
    }

    // Insert rating
    db.prepare(
      "INSERT INTO ratings (service_request_id, rater_id, rated_id, stars, feedback) VALUES (?, ?, ?, ?, ?)",
    ).run(service_request_id, session.id, rated_id, stars, feedback)

    // Update helper's average rating if rating a helper
    const helper = db.prepare("SELECT id FROM helpers WHERE user_id = ?").get(rated_id) as any

    if (helper) {
      // Calculate new average rating
      const ratingsStats = db
        .prepare(
          `
        SELECT 
          AVG(stars) as avg_rating,
          COUNT(*) as total_ratings
        FROM ratings
        WHERE rated_id = ?
      `,
        )
        .get(rated_id) as any

      // Update helper profile
      db.prepare(
        "UPDATE helpers SET rating_average = ?, total_ratings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).run(ratingsStats.avg_rating || 0, ratingsStats.total_ratings || 0, helper.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create rating error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
