require("dotenv").config();
const express = require("express");
const cors = require("cors");
const uploadRoutes = require("./routes/upload");
const app = express();

// Railway/Render gibi ortamlarda PORT buradan gelir
const PORT = process.env.PORT || 3000;

// CORS (istersen sonra sıkılaştırırız)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use("/api/upload", uploadRoutes);
// Health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Örnek in-memory ürün listesi (sen DB kullanıyorsan burası zaten değişecek)
let products = [];

// List
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Add
app.post("/api/products", (req, res) => {
  const { name, price, imageUrl } = req.body || {};
  if (!name || typeof price === "undefined") {
    return res.status(400).json({ error: "name ve price zorunlu" });
  }

  const id = Date.now().toString();
  const p = { id, name, price: Number(price), imageUrl: imageUrl || "" };
  products.push(p);
  res.status(201).json(p);
});

// Delete
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const before = products.length;
  products = products.filter((p) => p.id !== id);

  if (products.length === before) {
    return res.status(404).json({ error: "urun bulunamadi" });
  }
  res.json({ ok: true });
});

// Start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});