const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'roadside.db');
const db = new Database(dbPath);
const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
const info = db.prepare("SELECT id, user_id, status FROM service_requests WHERE status NOT IN ('completed','cancelled')").all();
console.log('Active requests to resolve:', info);
const stmt = db.prepare("UPDATE service_requests SET status = 'completed', completed_at = ? WHERE id = ?");
const tx = db.transaction((rows) => {
  for (const r of rows) stmt.run(now, r.id);
});
if (info.length) {
  tx(info);
  console.log('Marked active requests as completed.');
} else {
  console.log('No active requests found.');
}
db.close();
