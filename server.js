// server.js (multi-store)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const storesRoutes = require("./routes/stores");
const productsRoutes = require("./routes/products");

const app = express();

/**
 * CORS
 */
const allowedOrigins = [
  process.env.VITE_ORIGIN,
  "https://dresserp-admin.vercel.app",
  "https://dresserp-frontend-uinx.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// HEALTH
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// DB SETUP
app.get("/setup-db", async (req, res) => {
  const db = require("./db");

  try {
    // 1) stores tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        store_name TEXT NOT NULL DEFAULT 'Store',
        whatsapp_number TEXT NOT NULL DEFAULT '',
        admin_password_hash TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2) products tablosu (yoksa oluştur)
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        store_id INT
      );
    `);

    // 3) Eski products tablosunda eksik kolonları ekle
    await db.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    await db.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS store_id INT;
    `);

    // 4) Varsayılan mağaza oluştur (eski ürünleri buna bağlamak için)
    await db.query(`
      INSERT INTO stores (id, slug, store_name, whatsapp_number, admin_password_hash)
      VALUES (1, 'main', 'Main Store', '', '')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5) Eski ürünlerde store_id boşsa 1 yap
    await db.query(`
      UPDATE products
      SET store_id = 1
      WHERE store_id IS NULL;
    `);

    // 6) Foreign key yoksa ekle
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'products_store_id_fkey'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT products_store_id_fkey
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    // 7) Indexler
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_products_store_id
      ON products(store_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_products_created_at
      ON products(created_at);
    `);

    res.json({ status: "database_ready" });
  } catch (err) {
    console.error("setup_db_error:", err);
    res.status(500).json({ error: err.message });
  }
});