require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dresserp-frontend-production.up.railway.app"
  ]
}));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dresserp-frontend-production.up.railway.app"
  ],
  methods: ["GET","POST","DELETE","PUT","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("Backend çalışıyor ✅");
});

// Ürünleri listele
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC;");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /products hata:", err);
    res.status(500).json({ error: "Ürünler alınamadı" });
  }
});

// Ürün ekle
app.post("/products", async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || String(name).trim() === "" || price === undefined || price === null) {
      return res.status(400).json({ error: "name ve price zorunlu" });
    }

    const priceNum = Number(String(price).replace(",", "."));
    if (!Number.isFinite(priceNum)) {
      return res.status(400).json({ error: "price sayı olmalı" });
    }

    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *;",
      [String(name).trim(), priceNum]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /products hata:", err);
    res.status(500).json({ error: "Ürün eklenemedi" });
  }
});

// Ürün güncelle
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "name ve price zorunlu" });
    }

    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2 WHERE id=$3 RETURNING *;",
      [name, price, id]
    );

    const updated = result.rows[0];

    if (!updated) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.json(updated);

  } catch (err) {
    console.error("PUT hata:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Ürün sil
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id;",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    res.json({ message: "Ürün silindi", id: result.rows[0].id });
  } catch (err) {
    console.error("DELETE /products/:id hata:", err);
    res.status(500).json({ error: "Ürün silinemedi" });
  }
});

// Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});