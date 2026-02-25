// index.js (Railway + Postgres + Express) - STABLE

// dotenv sadece local için (Railway'de env zaten var)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// ---------- middleware ----------
app.use(express.json());

// CORS: kendi domainlerini burada tut
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://dresserp-frontend-production.up.railway.app",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---------- health ----------
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// ---------- DB pool ----------
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.Postgres_DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env.Postgres_DATABASE_PUBLIC_URL;

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Railway Postgres çoğu zaman ssl ister
    ssl: { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err);
  });
} else {
  console.warn("⚠️ DATABASE_URL not set. DB routes will return safe errors.");
}

// ---------- debug db ----------
app.get("/debug/db", async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: "DB not configured" });
    const r = await pool.query("SELECT 1 AS ok");
    return res.json({ ok: true, result: r.rows[0] });
  } catch (err) {
    console.error("GET /debug/db error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- ensure table ----------
async function ensureTable() {
  if (!pool) return;

  // tablo yoksa oluştur (crash etmeden)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC DEFAULT 0,
      size TEXT,
      color TEXT,
      category TEXT,
      stock INTEGER DEFAULT 0,
      deposit NUMERIC DEFAULT 0,
      image_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// ---------- products ----------
app.get("/products", async (req, res) => {
  try {
    if (!pool) return res.json([]);
    const result = await pool.query(`SELECT * FROM products ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.json([]);
  }
});

app.post("/products", async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: "DB not configured" });

    const {
      name,
      price = 0,
      size = null,
      color = null,
      category = null,
      stock = 0,
      deposit = 0,
      image_url = null,
      notes = null,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const result = await pool.query(
      `INSERT INTO products
      (name, price, size, color, category, stock, deposit, image_url, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [String(name).trim(), Number(price), size, color, category, Number(stock), Number(deposit), image_url, notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: "DB not configured" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- boot ----------
const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    await ensureTable();
    app.listen(PORT, "0.0.0.0", () => {
      console.log("✅ Server listening on port", PORT);
      console.log("✅ NODE_ENV:", process.env.NODE_ENV);
      console.log("✅ DB configured:", !!DATABASE_URL);
    });
  } catch (err) {
    console.error("❌ Boot error:", err);
    // Railway crash log'a düşsün diye:
    process.exit(1);
  }
})();