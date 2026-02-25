// index.js (Railway + Postgres + Express) - CLEAN VERSION

// dotenv sadece local için; Railway'de gerek yok ama sorun da çıkarmaz
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();

/**
// CORS - temiz ve sorunsuz
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dresserp-frontend-production.up.railway.app"
  ],
  credentials: true
}));
app.options("*", cors());
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "v2-debug" });
});
app.get("/health", (req, res) => res.status(200).send("ok"));
/**
 * PostgreSQL Pool
 * - Railway Postgres için SSL genelde gerekir.
 */
// --- SAFE DATABASE SETUP (crash etmez) ---
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env["Postgres.DATABASE_URL"] ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env["Postgres.DATABASE_PUBLIC_URL"];

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log("✅ Postgres connected");
} else {
  console.log("❌ DATABASE_URL not found");
}

    // DB denemesi: hata olsa bile server'ı düşürmez
    pool
      .query("SELECT 1;")
      .then(() => console.log("✅ Database reachable"))
      .catch((err) => console.error("❌ DB reachable değil:", err.message));
  } catch (err) {
    console.error("❌ Pool oluşturulamadı:", err.message);
    pool = null;
  }
}
// --- /SAFE DATABASE SETUP ---

// Başlangıçta DB bağlantısını dene (crash etmesin, sadece log yazsın)
pool
  .connect()
  .then((client) => {
    client.release();
    console.log("✅ Database connected");
  })
  .catch((err) => {
    console.error("❌ Database connect error:", err.message);
  });

/**
 * Health / Root
 */
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).send("ok"));

/**
 * (Opsiyonel) tablo yoksa otomatik oluştur
 * products: id SERIAL, name TEXT, price INTEGER
 */
async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL
      );
    `);
    console.log("✅ products table ready");
  } catch (err) {
    console.error("❌ ensureTable error:", err.message);
  }
}
ensureTable();

/**
 * CRUD: /products
 */

// Listele
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC;");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Ürünler alınamadı" });
  }
});
app.get("/debug/db", async (req, res) => {
  try {
    const db = await pool.query("select current_database() as db, current_user as user");
    const cnt = await pool.query("select count(*)::int as count from products");
    res.json({ database: db.rows[0], productsCount: cnt.rows[0].count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
// Ekle
app.post("/products", async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ error: "name zorunlu" });
    }
    if (price === undefined || price === null || String(price).trim() === "") {
      return res.status(400).json({ error: "price zorunlu" });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum)) {
      return res.status(400).json({ error: "price sayı olmalı" });
    }

    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *;",
      [String(name).trim(), priceNum]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Ürün eklenemedi" });
  }
});

// Güncelle
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (!name || String(name).trim() === "") {
      return res.status(400).json({ error: "name zorunlu" });
    }
    if (price === undefined || price === null || String(price).trim() === "") {
      return res.status(400).json({ error: "price zorunlu" });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum)) {
      return res.status(400).json({ error: "price sayı olmalı" });
    }

    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2 WHERE id=$3 RETURNING *;",
      [String(name).trim(), priceNum, Number(id)]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Bulunamadı" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /products/:id error:", err);
    res.status(500).json({ error: "Ürün güncellenemedi" });
  }
});

// Sil
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM products WHERE id=$1;", [Number(id)]);
    res.json({ message: "Ürün silindi" });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: "Ürün silinemedi" });
  }
});

/**
 * Railway PORT
 */
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server listening on port", PORT);
});