require('dotenv').config();

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const { db, initDb } = require('./db');

const app = express();
const PORT = 3000;

// парсинг body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// сессии
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session_secret_123',
    resave: false,
    saveUninitialized: false,
  })
);

// инициализация БД/таблиц/сидов
initDb();

// раздаём фронт
app.use(express.static(path.join(__dirname, '../frontend')));

// страницы
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/main.html'))
);
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/login.html'))
);
app.get('/admin', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/admin.html'))
);

// ===================== AUTH API =====================

// регистрация юзера
app.post('/api/signup', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ error: 'login/password required' });
  }

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)`,
    [login, hash, 'user'],
    function (err) {
      if (err) {
        if (String(err).includes('UNIQUE')) {
          return res.status(409).json({ error: 'login already exists' });
        }
        return res.status(500).json({ error: 'db error' });
      }

      // сразу логиним
      req.session.user = { id: this.lastID, login, role: 'user' };
      res.json({ ok: true, role: 'user' });
    }
  );
});

// логин (и админ, и юзер)
app.post('/api/login', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ error: 'login/password required' });
  }

  db.get(`SELECT * FROM users WHERE login = ?`, [login], (err, user) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!user) return res.status(401).json({ error: 'wrong credentials' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'wrong credentials' });

    req.session.user = { id: user.id, login: user.login, role: user.role };
    res.json({ ok: true, role: user.role });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// ===================== PRODUCTS API =====================

// публично читать товары
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows);
  });
});

// товар по id (публично)
app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  });
});

// ===================== ADMIN GUARD =====================

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'not logged in' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

// ===================== ADMIN PRODUCTS CRUD =====================

// добавить товар (admin)
app.post('/api/products', requireAdmin, (req, res) => {
  const { title, price, image, category, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });

  db.run(
    `INSERT INTO products (title, price, image, category, description)
     VALUES (?, ?, ?, ?, ?)`,
    [title, Number(price || 0), image || '', category || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// обновить товар (admin) — это нужно для кнопки Save
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, price, image, category, description } = req.body || {};

  db.run(
    `UPDATE products
     SET title = ?, price = ?, image = ?, category = ?, description = ?
     WHERE id = ?`,
    [title || '', Number(price || 0), image || '', category || '', description || '', id],
    function (err) {
      if (err) return res.status(500).json({ error: 'db error' });
      if (this.changes === 0) return res.status(404).json({ error: 'not found' });
      res.json({ ok: true });
    }
  );
});

// удалить товар (admin) — нужно для Delete
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'db error' });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
