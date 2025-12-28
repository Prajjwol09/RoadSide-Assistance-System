const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'roadside.db');
const db = new Database(dbPath, { readonly: true });
const rows = db.prepare(`SELECT sr.id, sr.user_id, u.email as user_email, sr.helper_id, sr.status, sr.issue_description, sr.created_at, sr.completed_at FROM service_requests sr LEFT JOIN users u ON sr.user_id = u.id`).all();
console.log('Service requests:');
console.table(rows);
db.close();
