export const config = {
  sessionSecret: process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
  databasePath: process.env.DATABASE_PATH || "./data/roadside.db",
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  adminEmail: process.env.ADMIN_EMAIL || "admin@roadside.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  debug: process.env.DEBUG === "true",
}
