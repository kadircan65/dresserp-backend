// index.js — Railway + Express + Postgres — STABLE VERSION

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();


// ========================
// MIDDLEWARE
// ========================

app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dresserp-frontend-production.up.railway.app"
  ],
  credentials: true
}));

app.options("*", cors());


// ========================
// HEALTH CHECK
// ========================

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "dresserp-backend" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "dresserp-backend" });
});


// ========================
// DATABASE CONNECTION
// ========================

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env["Postgres.DATABASE_URL"] ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env["Postgres.DATABASE_PUBLIC_URL"];

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


// ========================
// ENSURE TABLE EXISTS
// ========================

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("products table ready");
  } catch (err) {
    console.error("ensureTable error:", err.message);
  }
}

ensureTable();


// ========================
// GET PRODUCTS
// ========================

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {

    console.error("GET products error:", err.message);

    res.status(500).json({
      error: "database error"
    });

  }
});


// ========================
// ADD PRODUCT
// ========================

app.post("/products", async (req, res) => {

  try {

    const { name, price } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name required" });
    }

    if (price === undefined) {
      return res.status(400).json({ error: "price required" });
    }

    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("POST products error:", err.message);

    res.status(500).json({
      error: "insert failed"
    });

  }

});


// ========================
// DEBUG DB
// ========================

app.get("/debug/db", async (req, res) => {

  try {

    const db = await pool.query("select current_database()");
    const count = await pool.query("select count(*) from products");

    res.json({
      database: db.rows[0],
      productsCount: count.rows[0]
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ========================
// START SERVER
// ========================

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});