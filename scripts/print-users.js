const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'roadside.db');
const db = new Database(dbPath, { readonly: true });
const users = db.prepare('SELECT id, email, phone, password, name, role FROM users').all();
console.log('Users in DB:');
console.table(users);
db.close();
