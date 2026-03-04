// server.js (multi-store)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const storesRoutes = require("./routes/stores");
const productsRoutes = require("./routes/products");

const app = express();

/**
 * CORS
 * VITE_ORIGIN: admin domain ya da frontend domain (tek tek)
 * ayrıca allowedOrigins listesine Vercel storefront/admin domainlerini ekle
 */
const allowedOrigins = [
  process.env.VITE_ORIGIN,
  "https://dresserp-admin.vercel.app",
  "https://dresserp-frontend-unix.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true); // server-to-server / postman
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
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * MULTI STORE ROUTES
 * Base path: /api/s/:slug/...
 */
app.use("/api/s", storesRoutes);
app.use("/api/s", productsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "not_found" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
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

    res.json({status:"database_ready"});

  } catch (err) {
    console.error(err);
    res.json({error: err.message});
  }
});