const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

function getSlug(req) {
  return (req.params.slug || "").trim().toLowerCase();
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return res.status(401).json({ error: "missing_token" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: "jwt_secret_missing" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== "admin" || !payload.storeId) {
      return res.status(403).json({ error: "forbidden" });
    }
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

/**
 * PUBLIC: ürünleri getir
 * GET /api/s/:slug/products
 */
router.get("/:slug/products", async (req, res) => {
  try {
    const slug = getSlug(req);

    const storeRes = await db.query("SELECT id FROM stores WHERE slug = $1", [slug]);
    if (!storeRes.rows[0]) return res.status(404).json({ error: "store_not_found" });

    const storeId = storeRes.rows[0].id;

    const { rows } = await db.query(
      `SELECT id, name, price, image_url, created_at
       FROM products
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [storeId]
    );

    res.json(rows);
  } catch (err) {
    console.error("products_get_error", err);
    res.status(500).json({ error: "products_fetch_failed" });
  }
});

/**
 * ADMIN: ürün ekle
 * POST /api/s/:slug/products
 * body: { name, price, image_url }
 */
router.post("/:slug/products", requireAdmin, async (req, res) => {
  try {
    const slug = getSlug(req);
    if (req.admin.slug !== slug) return res.status(403).json({ error: "store_mismatch" });

    const name = String(req.body?.name || "").trim();
    const price = Number(req.body?.price);
    const image_url = req.body?.image_url ? String(req.body.image_url).trim() : null;

    if (!name) return res.status(400).json({ error: "name_required" });
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "price_invalid" });

    const { rows } = await db.query(
      `INSERT INTO products (store_id, name, price, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, price, image_url, created_at`,
      [req.admin.storeId, name, price, image_url || null]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("products_post_error", err);
    res.status(500).json({ error: "product_create_failed" });
  }
});

module.exports = router;