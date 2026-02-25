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

// ================================
// Start server (Railway compatible)
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server started on port", PORT);
});