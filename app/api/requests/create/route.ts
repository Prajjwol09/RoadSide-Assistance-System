// Create service request API route

import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { config } from "@/lib/config"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    let issue_description: any = null
    let latitude: any = null
    let longitude: any = null
    let files: File[] = []

    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      issue_description = form.get("issue_description") as string
      latitude = form.get("latitude") as string
      longitude = form.get("longitude") as string

      // Collect files
      // formData.getAll isn't available on NextRequest; iterate keys
      for (const key of Array.from(form.keys())) {
        const value = form.getAll(key)
        for (const v of value) {
          // @ts-ignore
          if (v && typeof (v as any).arrayBuffer === "function") {
            // @ts-ignore
            files.push(v as File)
          }
        }
      }
    } else {
      const body = await request.json()
      issue_description = body.issue_description
      latitude = body.latitude
      longitude = body.longitude
    }

    // Debug: log session and incoming payload to help diagnose FK errors
    console.log("Create request: session=", session)
    console.log("Create request: payload=", { issue_description, latitude, longitude, filesCount: files.length })

    // Ensure the session user actually exists in the users table (avoid FK failure)
    const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(session.id)
    if (!userExists) {
      console.error(`Create request error: session user id=${session.id} not found in users table`)
      return NextResponse.json({ error: "Invalid session user" }, { status: 401 })
    }

    // Validate input
    if (!issue_description || !latitude || !longitude) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already has an active request
    const existingRequest = db
      .prepare("SELECT id FROM service_requests WHERE user_id = ? AND status NOT IN ('completed', 'cancelled')")
      .get(session.id)

    if (existingRequest) {
      return NextResponse.json({ error: "You already have an active service request" }, { status: 409 })
    }

    // Create service request
    const result = db
      .prepare(
        "INSERT INTO service_requests (user_id, issue_description, latitude, longitude, status) VALUES (?, ?, ?, ?, 'requested')",
      )
      .run(session.id, issue_description, Number(latitude), Number(longitude))

    const requestId = result.lastInsertRowid

    // If files were uploaded, validate and store them
    if (files && files.length > 0) {
      const publicRoot = path.join(process.cwd(), "public")
      const targetDir = path.join(publicRoot, "uploads", "service_requests", String(requestId))
      fs.mkdirSync(targetDir, { recursive: true })

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
      const maxSize = 5 * 1024 * 1024 // 5MB per file

      for (const file of files.slice(0, 10)) {
        // @ts-ignore
        const contentType = (file as any).type || ""
        // @ts-ignore
        const name = (file as any).name || `upload-${Date.now()}`
        // @ts-ignore
        const size = (file as any).size || 0

        if (!allowedTypes.includes(contentType)) {
          // skip invalid types
          console.warn(`Skipping file ${name} - invalid type ${contentType}`)
          continue
        }

        if (size > maxSize) {
          console.warn(`Skipping file ${name} - size ${size} exceeds limit`)
          continue
        }

        // Write file
        // @ts-ignore
        const buffer = Buffer.from(await (file as any).arrayBuffer())
        const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
        const destPath = path.join(targetDir, safeName)
        fs.writeFileSync(destPath, buffer)

        // Store record in DB with relative path
        const relative = path.join("/uploads/service_requests", String(requestId), safeName).replace(/\\/g, "/")
        db.prepare(
          "INSERT INTO service_request_images (service_request_id, file_path, original_name, content_type, size) VALUES (?, ?, ?, ?, ?)",
        ).run(requestId, relative, name, contentType, size)
      }
    }

    return NextResponse.json({
      success: true,
      requestId,
    })
  } catch (error: any) {
    console.error("Create request error:", error)
    // In debug mode expose error details to aid development; otherwise return a generic message
    if (config.debug) {
      return NextResponse.json({ error: "Internal server error", detail: error?.message || String(error) }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
