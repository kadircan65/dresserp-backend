// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// --- HEALTH ---
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("select 1 as ok");
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- PUBLIC: PRODUCTS ---
app.get("/products", async (req, res) => {
  try {
    const r = await pool.query("select id, name, price, image from products order by id desc");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query("select id, name, price, image from products where id=$1", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ADMIN AUTH (TOKEN) ---
function requireAdmin(req, res, next) {
  const token = req.header("x-admin-token");
  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  }
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// --- ADMIN: CRUD ---
app.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    if (!name || price == null) return res.status(400).json({ error: "name & price required" });

    const r = await pool.query(
      "insert into products (name, price, image) values ($1,$2,$3) returning id, name, price, image",
      [name, price, image || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, price, image } = req.body;

    const r = await pool.query(
      "update products set name=$1, price=$2, image=$3 where id=$4 returning id, name, price, image",
      [name, price, image || null, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await pool.query("delete from products where id=$1 returning id", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    res.json({ ok: true, deletedId: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("API running on port", PORT);
});