require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const { db, initDb } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// BODY
// =========================
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =========================
// SESSIONS
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true, // включишь когда будет https
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
    },
  })
);

// =========================
// INIT DB
// =========================
initDb();

// =========================
// UPLOADS FOLDER
// =========================
const UPLOAD_DIR = path.join(__dirname, "../frontend/uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// =========================
// STATIC FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "../frontend/uploads")));

// =========================
// SWAGGER
// =========================
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "DMD Studios API Docs",
  })
);

// =========================
// PAGES
// =========================
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/main.html"))
);
app.get("/catalog", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/catalog.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/admin.html"))
);
app.get("/about", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/about.html"))
);
app.get("/contact", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/contact.html"))
);
app.get("/cart", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/cart.html"))
);
app.get("/checkout", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/checkout.html"))
);

// =========================
// HELPERS
// =========================
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "not logged in" });
  if (req.session.user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// =========================
// MULTER CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
    cb(null, `p_${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
    if (!ok) return cb(new Error("Only png/jpg/webp"));
    cb(null, true);
  },
});

// =========================
// AUTH API (Swagger JSDoc)
// =========================

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current session user
 *     responses:
 *       200:
 *         description: Session user or null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   oneOf:
 *                     - $ref: "#/components/schemas/User"
 *                     - type: "null"
 */
app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

/**
 * @swagger
 * /api/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create user and login (session)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login: { type: string, example: "user1" }
 *               password: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: Created + logged in
 *       409:
 *         description: Login already exists
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
app.post("/api/signup", (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password)
    return res.status(400).json({ error: "login/password required" });

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)`,
    [login, hash, "user"],
    function (err) {
      if (err) {
        if (String(err).includes("UNIQUE"))
          return res.status(409).json({ error: "login already exists" });
        return res.status(500).json({ error: "db error" });
      }
      req.session.user = { id: this.lastID, login, role: "user" };
      res.json({ ok: true, role: "user" });
    }
  );
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (session cookie)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login, password]
 *             properties:
 *               login: { type: string, example: "admin" }
 *               password: { type: string, example: "admin" }
 *     responses:
 *       200:
 *         description: Logged in
 *       401:
 *         description: Wrong credentials
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
app.post("/api/login", (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password)
    return res.status(400).json({ error: "login/password required" });

  db.get(`SELECT * FROM users WHERE login = ?`, [login], (err, user) => {
    if (err) return res.status(500).json({ error: "db error" });
    if (!user) return res.status(401).json({ error: "wrong credentials" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "wrong credentials" });

    req.session.user = { id: user.id, login: user.login, role: user.role };
    res.json({ ok: true, role: user.role });
  });
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (destroy session)
 *     responses:
 *       200:
 *         description: ok
 */
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// =========================
// PRODUCTS API
// =========================

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products (public)
 *     responses:
 *       200:
 *         description: Array of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Product" }
 */
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "db error" });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by id (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "db error" });
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create product (admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               price: { type: number }
 *               image: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Created
 */
app.post("/api/products", requireAdmin, (req, res) => {
  const { title, price, image, category, description } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });

  db.run(
    `INSERT INTO products (title, price, image, category, description)
     VALUES (?, ?, ?, ?, ?)`,
    [title, Number(price || 0), image || "", category || "", description || ""],
    function (err) {
      if (err) return res.status(500).json({ error: "db error" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               price: { type: number }
 *               image: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
app.put("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, price, image, category, description } = req.body || {};

  db.run(
    `UPDATE products
     SET title = ?, price = ?, image = ?, category = ?, description = ?
     WHERE id = ?`,
    [title || "", Number(price || 0), image || "", category || "", description || "", id],
    function (err) {
      if (err) return res.status(500).json({ error: "db error" });
      if (this.changes === 0) return res.status(404).json({ error: "not found" });
      res.json({ ok: true });
    }
  );
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: "db error" });
    if (this.changes === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  });
});

// =========================
// UPLOAD API
// =========================

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload product image (admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 path: { type: string, example: "uploads/p_1766063.webp" }
 */
app.post("/api/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  const rel = `uploads/${req.file.filename}`;
  res.json({ ok: true, path: rel });
});

// =========================
// ORDERS API
// =========================

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order (logged in)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, address, items]
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               comment: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, title, price, qty]
 *                   properties:
 *                     id: { type: integer }
 *                     title: { type: string }
 *                     price: { type: number }
 *                     qty: { type: integer }
 *                     image: { type: string }
 *     responses:
 *       200:
 *         description: Order created
 *       401:
 *         description: Unauthorized
 */
app.post("/api/orders", requireLogin, (req, res) => {
  const user = req.session.user;
  const { fullName, phone, address, comment, items } = req.body || {};

  if (!fullName || !phone || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const total = items.reduce(
    (s, x) => s + Number(x.price || 0) * Number(x.qty || 1),
    0
  );

  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO orders (user_login, full_name, phone, address, comment, total, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.login, fullName, phone, address, comment || "", total, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error (orders)" });

      const orderId = this.lastID;

      const stmt = db.prepare(
        `INSERT INTO order_items (order_id, product_id, title, price, qty, image)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const it of items) {
        stmt.run([
          orderId,
          Number(it.id || 0),
          String(it.title || "Product"),
          Number(it.price || 0),
          Number(it.qty || 1),
          String(it.image || ""),
        ]);
      }

      stmt.finalize((e2) => {
        if (e2) return res.status(500).json({ error: "DB error (order_items)" });
        res.json({ ok: true, orderId });
      });
    }
  );
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders with items (admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Order" }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get("/api/orders", requireAdmin, (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, (err, orders) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!orders.length) return res.json([]);

    const ids = orders.map((o) => o.id);
    const placeholders = ids.map(() => "?").join(",");

    db.all(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id DESC`,
      ids,
      (err2, items) => {
        if (err2) return res.status(500).json({ error: "DB error" });

        const grouped = {};
        for (const it of items) (grouped[it.order_id] ||= []).push(it);

        const result = orders.map((o) => ({
          ...o,
          items: grouped[o.id] || [],
        }));

        res.json(result);
      }
    );
  });
});

// =========================
// MULTER ERROR HANDLER (чтобы не падал сервер)
// =========================
app.use((err, req, res, next) => {
  if (err && err.message && String(err.message).includes("Only png/jpg/webp")) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 4MB)" });
  }
  next(err);
});

// =========================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`✅ Swagger JSON: http://localhost:${PORT}/api-docs.json`);
});
