// ================================
// Railway + Express + Postgres
// CLEAN STABLE VERSION
// ================================

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// ================================
// Middleware
// ================================

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

// ================================
// Health check
// ================================

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date(),
  });
});
async function ensureAndMigrateTable() {
  try {
    // 1) base table (yoksa oluştur)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    
// ================================
// Database connection
// ================================

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.Postgres_DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env.Postgres_DATABASE_PUBLIC_URL;

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("Database connected");
} else {
  console.log("WARNING: DATABASE_URL not found");
}

// ================================
// Products routes
// ================================

// GET products
app.get("/products", async (req, res) => {
  try {
    if (!pool) return res.json([]);

    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
// ================================
// DATABASE SETUP + MIGRATION
// ================================

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function ensureAndMigrateTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        size TEXT,
        color TEXT,
        category TEXT,
        stock INT DEFAULT 1,
        deposit NUMERIC DEFAULT 0,
        image_url TEXT,
        is_rented BOOLEAN DEFAULT FALSE,
        rented_to TEXT,
        rented_phone TEXT,
        rent_start DATE,
        rent_end DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ products table ready");
  } catch (err) {
    console.error("❌ table error:", err.message);
  }
}

ensureAndMigrateTable();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST product
app.post("/products", async (req, res) => {
  try {
    if (!pool)
      return res.status(500).json({ error: "Database not ready" });

    const { name, price } = req.body;

    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1,$2) RETURNING *",
      [name, price]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});
// DELETE product
app.delete("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const result = await pool.query(
      "DELETE FROM products WHERE id=$1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "not found" });
    }

    res.json({ message: "deleted", id });
  } catch (err) {
    console.error("DELETE /products/:id error:", err.message);
    res.status(500).json({ error: "delete failed" });
  }
});
// ================================
// Start server (Railway compatible)
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});