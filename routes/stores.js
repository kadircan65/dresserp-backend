const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();

function getSlug(req) {
  return String(req.params.slug || "").trim().toLowerCase();
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

// MAĞAZA OLUŞTUR
router.post("/create", async (req, res) => {
  try {
    const masterKey = req.headers["x-master-key"] || "";
    if (!process.env.MASTER_KEY) {
      return res.status(500).json({ error: "master_key_missing" });
    }
    if (masterKey !== process.env.MASTER_KEY) {
      return res.status(401).json({ error: "invalid_master_key" });
    }

    const slug = String(req.body?.slug || "").trim().toLowerCase();
    const store_name = String(req.body?.store_name || "").trim();
    const whatsapp_number = String(req.body?.whatsapp_number || "").trim();
    const admin_password = String(req.body?.admin_password || "");

    if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug)) {
      return res.status(400).json({ error: "slug_invalid" });
    }
    if (!store_name) {
      return res.status(400).json({ error: "store_name_required" });
    }
    if (admin_password.length < 6) {
      return res.status(400).json({ error: "password_too_short" });
    }

    const hash = await bcrypt.hash(admin_password, 10);

    const { rows } = await db.query(
      `INSERT INTO stores (slug, store_name, whatsapp_number, admin_password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, slug, store_name, whatsapp_number`,
      [slug, store_name, whatsapp_number, hash]
    );

    res.json({ ok: true, store: rows[0] });
  } catch (err) {
    if (String(err.message || "").includes("duplicate key")) {
      return res.status(409).json({ error: "slug_taken" });
    }
    console.error("store_create_error:", err);
    res.status(500).json({ error: "store_create_failed" });
  }
});

// STORE BİLGİSİ
router.get("/:slug/store", async (req, res) => {
  try {
    const slug = getSlug(req);

    const { rows } = await db.query(
      `SELECT id, slug, store_name, whatsapp_number
       FROM stores
       WHERE slug = $1`,
      [slug]
    );

    if (!rows[0]) return res.status(404).json({ error: "store_not_found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("store_get_error:", err);
    res.status(500).json({ error: "store_get_failed" });
  }
});

// ADMIN LOGIN
router.post("/:slug/admin/login", async (req, res) => {
  try {
    const slug = getSlug(req);
    const password = String(req.body?.password || "");

    if (!password) return res.status(400).json({ error: "password_required" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "jwt_secret_missing" });

    const { rows } = await db.query(
      `SELECT id, slug, admin_password_hash
       FROM stores
       WHERE slug = $1`,
      [slug]
    );

    if (!rows[0]) return res.status(404).json({ error: "store_not_found" });

    const ok = await bcrypt.compare(password, rows[0].admin_password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_password" });

    const token = jwt.sign(
      {
        role: "admin",
        storeId: rows[0].id,
        slug: rows[0].slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("admin_login_error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// STORE AYAR GÜNCELLE
router.put("/:slug/store", requireAdmin, async (req, res) => {
  try {
    const slug = getSlug(req);
    if (req.admin.slug !== slug) {
      return res.status(403).json({ error: "store_mismatch" });
    }

    const store_name = String(req.body?.store_name || "").trim();
    const whatsapp_number = String(req.body?.whatsapp_number || "").trim();

    const { rows } = await db.query(
      `UPDATE stores
       SET store_name = $1,
           whatsapp_number = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, slug, store_name, whatsapp_number`,
      [store_name || "Store", whatsapp_number, req.admin.storeId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("store_put_error:", err);
    res.status(500).json({ error: "store_put_failed" });
  }
});

module.exports = router;