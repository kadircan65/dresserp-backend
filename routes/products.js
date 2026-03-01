const express = require("express");
const router = express.Router();

const db = require("../db");

// Admin auth middleware
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];

  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  }

  if (!token) {
    return res.status(401).json({ error: "Missing x-admin-token" });
  }

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

// ✅ PUBLIC: GET all products
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, price, image_url FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /products db_error:", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ ADMIN: POST create product
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, price, image_url } = req.body;

    if (!name || String(name).trim().length < 1) {
      return res.status(400).json({ error: "name gerekli" });
    }

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ error: "price sayi olmali ve > 0" });
    }

    const img = image_url ? String(image_url).trim() : null;

    const { rows } = await db.query(
      "INSERT INTO products (name, price, image_url) VALUES ($1, $2, $3) RETURNING id, name, price, image_url",
      [String(name).trim(), p, img]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("POST /products db_error:", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ ADMIN: DELETE product by id (opsiyonel ama iyi olur)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "id gecersiz" });
    }

    await db.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /products db_error:", err);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;