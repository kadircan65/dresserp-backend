// routes/products.js
const express = require("express");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

/**
 * Admin auth middleware
 * - Reads token from header: "x-admin-token"
 * - Also accepts: "Authorization: Bearer <token>"
 * - Compares securely with process.env.ADMIN_TOKEN
 */
function requireAdmin(req, res, next) {
  const expected = (process.env.ADMIN_TOKEN || "").trim();

  if (!expected) {
    return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  }

  let token = (req.headers["x-admin-token"] || "").toString().trim();

  if (!token) {
    const auth = (req.headers["authorization"] || "").toString().trim();
    if (auth.toLowerCase().startsWith("bearer ")) {
      token = auth.slice(7).trim();
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Missing x-admin-token" });
  }

  // constant-time compare
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

// ✅ PUBLIC: list products
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, price FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ ADMIN: add product
router.post("/", requireAdmin, async (req, res) => {
  try {
    const name = (req.body?.name || "").toString().trim();
    const priceRaw = req.body?.price;

    // Accept number or numeric string
    const price = typeof priceRaw === "string" ? Number(priceRaw.trim()) : Number(priceRaw);

    if (!name) {
      return res.status(400).json({ error: "name gerekli" });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "price sayi olmali ve 0'dan buyuk olmali" });
    }

    const { rows } = await db.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING id, name, price",
      [name, price]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ ADMIN: update product (opsiyonel, kullanmasan da sorun değil)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "gecersiz id" });
    }

    const name = (req.body?.name ?? "").toString().trim();
    const priceRaw = req.body?.price;
    const price = typeof priceRaw === "string" ? Number(priceRaw.trim()) : Number(priceRaw);

    if (!name) {
      return res.status(400).json({ error: "name gerekli" });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "price sayi olmali ve 0'dan buyuk olmali" });
    }

    const { rows } = await db.query(
      "UPDATE products SET name=$1, price=$2 WHERE id=$3 RETURNING id, name, price",
      [name, price, id]
    );

    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ ADMIN: delete product (opsiyonel)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "gecersiz id" });
    }

    const { rows } = await db.query(
      "DELETE FROM products WHERE id=$1 RETURNING id",
      [id]
    );

    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;