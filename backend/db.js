const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
  db.serialize(() => {
    // PRODUCTS
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        price INTEGER NOT NULL,
        image TEXT,
        category TEXT,
        description TEXT
      )
    `);

    // USERS (только для админа)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // seed products (если пусто)
    db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
      if (err) return console.error(err);
      if (row && row.count > 0) return;

      const stmt = db.prepare(`
        INSERT INTO products (title, price, image, category, description)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run('Oak Table', 450, 'images/p1.jpg', 'Tables', 'Solid oak table.');
      stmt.run('Modern Sofa', 900, 'images/p2.jpg', 'Sofas', 'Comfortable modern sofa.');
      stmt.run('Dining Chair', 120, 'images/p3.jpg', 'Chairs', 'Minimal chair for dining.');
      stmt.finalize();
      console.log('✅ Seed products inserted');
    });

    // seed admin (если его нет)
    const adminLogin = process.env.ADMIN_LOGIN || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

    db.get(`SELECT id FROM users WHERE login = ?`, [adminLogin], (err, row) => {
      if (err) return console.error(err);
      if (row) return;

      const hash = bcrypt.hashSync(adminPassword, 10);
      db.run(
        `INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)`,
        [adminLogin, hash, 'admin'],
        (e) => {
          if (e) return console.error(e);
          console.log(`✅ Admin created: ${adminLogin} / ${adminPassword}`);
        }
      );
    });
  });
}

module.exports = { db, initDb };
