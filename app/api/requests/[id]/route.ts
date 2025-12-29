// Get service request by ID

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const serviceRequest = db
      .prepare(
        `
      SELECT 
        sr.*,
        u.name as user_name,
        u.id as user_user_id,
        h_user.id as helper_user_id,
        h_user.name as helper_name,
        h_user.phone as helper_phone,
        h.skills as helper_skills,
        h.address as helper_address
      FROM service_requests sr
      JOIN users u ON sr.user_id = u.id
      LEFT JOIN helpers h ON sr.helper_id = h.id
      LEFT JOIN users h_user ON h.user_id = h_user.id
      WHERE sr.id = ?
    `,
      )
      .get(id) as any

    if (!serviceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Fetch images for this request
    const images = db
      .prepare("SELECT id, file_path, original_name, content_type, size FROM service_request_images WHERE service_request_id = ? ORDER BY created_at DESC")
      .all(id)

    // Do not expose helper phone/details to arbitrary users. Only expose to the assigned user after acceptance.
    let helper = undefined
    if (serviceRequest.helper_user_id) {
      helper = {
        id: serviceRequest.helper_user_id,
        name: serviceRequest.helper_name,
        skills: serviceRequest.helper_skills,
        address: serviceRequest.helper_address,
      }

      // Expose phone and other contact details to the request owner once a helper
      // has been assigned (status is not the initial 'requested'). This lets the
      // user see the helper's phone after they select a helper (status 'pending')
      // as well as after the helper accepts ('accepted').
      if (serviceRequest.user_id === session.id && serviceRequest.status !== "requested") {
        helper.phone = serviceRequest.helper_phone
      }
    }

    // Build response object
    const responseObj: any = {
      request: {
        id: serviceRequest.id,
        user_id: serviceRequest.user_id,
        issue_description: serviceRequest.issue_description,
        latitude: serviceRequest.latitude,
        longitude: serviceRequest.longitude,
        status: serviceRequest.status,
        created_at: serviceRequest.created_at,
        updated_at: serviceRequest.updated_at,
        completed_at: serviceRequest.completed_at,
        user_name: serviceRequest.user_name,
        helper: helper,
      },
      images,
    }

    return NextResponse.json(responseObj)
  } catch (error) {
    console.error("Get request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
