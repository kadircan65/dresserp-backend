const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

function getSlug(req) {
  return String(req.params.slug || "").trim().toLowerCase();
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "jwt_secret_missing" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || payload.role !== "admin" || !payload.storeId) {
      return res.status(403).json({ error: "forbidden" });
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

// STORE'A GÖRE ÜRÜNLERİ GETİR
router.get("/:slug/products", async (req, res) => {
  try {
    const slug = getSlug(req);

    const storeResult = await db.query(
      `SELECT id FROM stores WHERE slug = $1`,
      [slug]
    );

    if (!storeResult.rows[0]) {
      return res.status(404).json({ error: "store_not_found" });
    }

    const storeId = storeResult.rows[0].id;

    const result = await db.query(
      `SELECT id, name, price, image_url, created_at, store_id
       FROM products
       WHERE store_id = $1
       ORDER BY id DESC`,
      [storeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("store_products_error:", err);
    res.status(500).json({ error: "products_fetch_failed" });
  }
});

// STORE'A ÜRÜN EKLE
router.post("/:slug/products", requireAdmin, async (req, res) => {
  try {
    const slug = getSlug(req);

    if (req.admin.slug !== slug) {
      return res.status(403).json({ error: "store_mismatch" });
    }

    const name = String(req.body?.name || "").trim();
    const image_url = String(req.body?.image_url || "").trim();
    const price = Number(req.body?.price);

    if (!name) {
      return res.status(400).json({ error: "name_required" });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "price_invalid" });
    }

    const result = await db.query(
      `INSERT INTO products (name, price, image_url, store_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, price, image_url, created_at, store_id`,
      [
        name,
        price,
        image_url || null,
        req.admin.storeId
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("product_create_error:", err);
    res.status(500).json({ error: "product_create_failed" });
  }
});

// STORE'DAN ÜRÜN SİL
router.delete("/:slug/products/:id", requireAdmin, async (req, res) => {
  try {
    const slug = getSlug(req);
    const id = Number(req.params.id);

    if (req.admin.slug !== slug) {
      return res.status(403).json({ error: "store_mismatch" });
    }

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_product_id" });
    }

    const result = await db.query(
      `DELETE FROM products
       WHERE id = $1 AND store_id = $2
       RETURNING id`,
      [id, req.admin.storeId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "product_not_found" });
    }

    res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("product_delete_error:", err);
    res.status(500).json({ error: "product_delete_failed" });
  }
});

module.exports = router;