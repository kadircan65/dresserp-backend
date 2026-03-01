const express = require("express");
const db = require("../db");

const router = express.Router();

// ✅ Admin auth middleware (JWT)
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return res.status(401).json({ error: "missing_token" });
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "jwt_secret_missing" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

// ✅ GET all products (PUBLIC)
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, price, image_url FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

// ✅ POST product (ADMIN)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, price, image_url } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name_required" });
    }
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ error: "price_invalid" });
    }

    const { rows } = await db.query(
      "INSERT INTO products (name, price, image_url) VALUES ($1, $2, $3) RETURNING id, name, price, image_url",
      [name.trim(), p, image_url || null]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("db_error", err);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;