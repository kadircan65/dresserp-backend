require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ---- BASIC
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---- AUTH (Basit ve sağlam)
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  }
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ---- DB INIT (table yoksa kur)
app.post("/admin/init", requireAdmin, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(12,2) NOT NULL DEFAULT 0,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- READ (public)
app.get("/products", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- CREATE (admin)
app.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    const r = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1,$2,$3) RETURNING *",
      [name, price ?? 0, image ?? null]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- UPDATE (admin)
app.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, price, image } = req.body;

    const r = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           image = COALESCE($3, image)
       WHERE id = $4
       RETURNING *`,
      [name ?? null, price ?? null, image ?? null, id]
    );

    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- DELETE (admin)
app.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true, deleted: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- PORT (Railway)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("API running on port", PORT);
});