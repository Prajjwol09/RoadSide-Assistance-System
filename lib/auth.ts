// Authentication utilities for session management
// Simple session-based authentication without external dependencies

import { cookies } from "next/headers"
import { config } from "./config"
import db from "./db"

// Session data structure
export interface SessionUser {
  id: number
  email: string
  name: string
  role: "user" | "helper" | "admin"
}

// Create a session for a user
// In production, use proper session storage (Redis, database, etc.)
export async function createSession(user: SessionUser) {
  const cookieStore = await cookies()

  // Store user data in a cookie (in production, use encrypted session token)
  cookieStore.set("session", JSON.stringify(user), {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

// Get the current session user
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    const parsed = JSON.parse(sessionCookie.value) as SessionUser

    // Validate that the user still exists in the database (prevents stale sessions after DB reset)
    try {
      const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(parsed.id) as any
      if (!user) {
        // Clear cookie
        cookieStore.delete("session")
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    } catch (err) {
      // If DB access fails, treat as no session
      cookieStore.delete("session")
      return null
    }
  } catch {
    return null
  }
}

// Destroy the current session
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

// Check if user is authenticated
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}

// Check if user has a specific role
export async function requireRole(role: "user" | "helper" | "admin"): Promise<SessionUser> {
  const session = await requireAuth()

  if (session.role !== role && session.role !== "admin") {
    throw new Error("Forbidden")
  }

  return session
}
