const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json());

// DB Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://dresserp-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Postman/Server-to-server gibi origin olmayan istekler
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  })
);

// Root + health
app.get("/", (req, res) => res.status(200).send("Backend is running 🚀"));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// GET products (DB)
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");

    // ✅ cache kapat (304'ü azaltır, her seferinde taze veri)
    res.set("Cache-Control", "no-store");

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST products (DB)  <-- DB kolon adı: image
app.post("/products", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "name ve price zorunlu" });
    }

    const result = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1, $2, $3) RETURNING *",
      [name, price, image || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});