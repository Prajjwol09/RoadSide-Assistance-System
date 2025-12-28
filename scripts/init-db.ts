// Database initialization script
// This script can be run to set up the database and seed initial data

import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const dbPath = process.env.DATABASE_PATH || "./data/roadside.db"
const fullPath = dbPath.startsWith("./") ? path.join(process.cwd(), dbPath.slice(2)) : dbPath

// Ensure the data directory exists
const dbDir = path.dirname(fullPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log(`✓ Created directory: ${dbDir}`)
}

// Initialize database
// If a database file already exists, remove it so we start with a clean slate
if (fs.existsSync(fullPath)) {
  try {
    fs.unlinkSync(fullPath)
    console.log(`✓ Removed existing database file: ${fullPath}`)
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    console.warn(`⚠️ Failed to remove existing database file: ${e}`)
    console.warn("Attempting to reset the existing database in-place (dropping all tables). If this fails, stop the dev server and retry.")

    try {
      const dbExisting = new Database(fullPath)
      dbExisting.pragma("foreign_keys = OFF")
      const rows: Array<{ name: string }> = dbExisting
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()

      for (const r of rows) {
        dbExisting.exec(`DROP TABLE IF EXISTS ${r.name}`)
      }

      dbExisting.close()
      console.log("✓ Dropped existing tables in-place")
    } catch (err2) {
      console.error(`❌ Failed to reset existing database: ${err2}`)
      console.error("Please stop any process using the database (e.g., the dev server) and re-run `npm run db:init`.")
      process.exit(1)
    }
  }
}

const db = new Database(fullPath)
db.pragma("foreign_keys = ON")

console.log("Initializing database...")

// Read and execute schema
const schemaPath = path.join(process.cwd(), "scripts", "01-create-schema.sql")
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema file not found: ${schemaPath}`)
  process.exit(1)
}

const schema = fs.readFileSync(schemaPath, "utf8")
db.exec(schema)
console.log("✓ Schema created")

// Read and execute seed data
const seedPath = path.join(process.cwd(), "scripts", "02-seed-data.sql")
if (!fs.existsSync(seedPath)) {
  console.error(`❌ Seed file not found: ${seedPath}`)
  process.exit(1)
}

const seed = fs.readFileSync(seedPath, "utf8")
db.exec(seed)
console.log("✓ Data seeded")

db.close()
console.log("\n✅ Database initialized successfully!")
console.log(`📁 Database location: ${fullPath}`)
console.log("\nYou can now run: npm run dev")
