// Database utility for SQLite connection
// This creates a singleton connection to the SQLite database

import Database from "better-sqlite3"
import path from "path"
import { config } from "./config"
import fs from "fs"

const dbPath = config.databasePath.startsWith("./")
  ? path.join(process.cwd(), config.databasePath.slice(2))
  : config.databasePath

// Ensure the data directory exists
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Initialize SQLite database
const isNewDb = !fs.existsSync(dbPath)
const db = new Database(dbPath)

// Enable foreign key constraints (important for referential integrity)
db.pragma("foreign_keys = ON")

// If the database was just created or it's missing core tables, automatically run
// the schema (and seed data if empty) to avoid "no such table" errors during
// development. This mirrors what the standalone `npm run db:init` script does.
function ensureSchemaAndSeed() {
  try {
    const tableCheck = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
      .get()

    if (!tableCheck) {
      console.log("⚠️ No users table found – running automatic DB initialization.")
      const schemaPath = path.join(process.cwd(), "scripts", "01-create-schema.sql")
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, "utf8")
        db.exec(schema)
        console.log("✓ Schema created (auto)")
      } else {
        console.warn(`Schema file not found at ${schemaPath}`)
      }
    }

    // run seed data only if users table is empty
    const userCountRow = db.prepare("SELECT COUNT(*) as count FROM users;").get()
    const userCount = userCountRow ? Number(userCountRow.count) : 0
    if (userCount === 0) {
      const seedPath = path.join(process.cwd(), "scripts", "02-seed-data.sql")
      if (fs.existsSync(seedPath)) {
        const seed = fs.readFileSync(seedPath, "utf8")
        db.exec(seed)
        console.log("✓ Seed data inserted (auto)")
      }
    }
  } catch (err) {
    console.error("Error during automatic DB initialization:", err)
  }
}

ensureSchemaAndSeed()

// Export the database instance for use in API routes
export default db
