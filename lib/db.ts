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
const db = new Database(dbPath)

// Enable foreign key constraints (important for referential integrity)
db.pragma("foreign_keys = ON")

// Export the database instance for use in API routes
export default db
