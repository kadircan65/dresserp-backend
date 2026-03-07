// server.js (multi-store)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const storesRoutes = require("./routes/stores");
const productsRoutes = require("./routes/products");

const app = express();

/**
 * CORS
 */
const allowedOrigins = [
  process.env.VITE_ORIGIN,
  "https://dresserp-admin.vercel.app",
  "https://dresserp-frontend-uinx.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// HEALTH
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// DB SETUP
app.get("/setup-db", async (req, res) => {
  const db = require("./db");

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        store_name TEXT NOT NULL DEFAULT 'Store',
        whatsapp_number TEXT NOT NULL DEFAULT '',
        admin_password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_products_store_id
      ON products(store_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_products_created_at
      ON products(created_at);
    `);

    res.json({ status: "database_ready" });
  } catch (err) {
    console.error("setup_db_error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * MULTI STORE ROUTES
 * /api/s/:slug/store
 * /api/s/:slug/products
 * /api/s/create
 * /api/s/:slug/admin/login
 */
app.use("/api/s", storesRoutes);
app.use("/api/s", productsRoutes);

// ESKİ storefront'un bozulmaması için geçici public test route
app.get("/api/products", async (req, res) => {
  try {
    const db = require("./db");
    const { rows } = await db.query(
      "SELECT id, name, price, image_url, created_at FROM products ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("products_fetch_error:", err);
    res.status(500).json({ error: "products_fetch_failed" });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});