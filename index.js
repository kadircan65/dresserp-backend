const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: "ADMIN_TOKEN not set" });
  }
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
// Body parser
app.use(express.json());

// DB Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://dresserp-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Postman/Server-to-server gibi origin olmayan istekler
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  })
);
app.get("/admin/products", verifyAdmin, async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM products ORDER BY id DESC");
    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/admin/products", verifyAdmin, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "name and price required" });
    }

    const result = await db.run(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [name, price]
    );

    res.json({
      id: result.lastID,
      name,
      price
    });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


app.delete("/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.run("DELETE FROM products WHERE id = ?", [id]);

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: ürün güncelle
app.put("/admin/products/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, price, image_url } = req.body;

  const result = await pool.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         price = COALESCE($2, price),
         image_url = COALESCE($3, image_url)
     WHERE id = $4
     RETURNING *`,
    [name ?? null, (typeof price === "number" ? price : null), image_url ?? null, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Ürün bulunamadı" });
  }

  res.json(result.rows[0]);
});
// POST products (DB)  <-- DB kolon adı: image
app.post("/products", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "name ve price zorunlu" });
    }

    const result = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1, $2, $3) RETURNING *",
      [name, price, image || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});