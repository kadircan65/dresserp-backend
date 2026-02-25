// index.js (FINAL)

import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();

/** CORS */
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/** Body parsers */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/** DB */
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing. Add it in Railway Variables.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

/** ROUTES */

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "dresserp-backend" });
});

// Debug DB
app.get("/debug/db", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    console.error("DB DEBUG ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get products
app.get("/products", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, price, image FROM products ORDER BY id DESC"
    );
    res.json(r.rows);
  } catch (err) {
    console.error("GET /products ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create product
app.post("/products", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name gerekli" });
    }
    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return res.status(400).json({ error: "price gerekli" });
    }

    const r = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1,$2,$3) RETURNING id, name, price, image",
      [name.trim(), Number(price), image ?? null]
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error("POST /products ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

/** START */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});