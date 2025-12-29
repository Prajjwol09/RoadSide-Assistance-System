// Reopen any service_requests left with status 'declined'

import db from "../lib/db"

console.log("Reopening declined service requests...")

try {
  const info = db.prepare("SELECT COUNT(*) as cnt FROM service_requests WHERE status = 'declined'").get()
  console.log(`Found ${info.cnt} declined requests.`)

  const res = db
    .prepare("UPDATE service_requests SET status = 'requested', helper_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE status = 'declined'")
    .run()

  console.log(`Updated ${res.changes} rows.`)
  console.log("Done.")
} catch (e) {
  console.error("Failed to reopen declined requests:", e)
  process.exit(1)
}
