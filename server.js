// server.js
import express from "express";
import cors from "cors";

const app = express();

// Railway / Render / Heroku vb. için port
const PORT = process.env.PORT || 3000;

// CORS (gerekirse origin'i daraltırız)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token", "x-admin"],
  })
);

app.use(express.json());

// ---- Basit in-memory "DB" ----
// NOT: Sunucu restart olunca sıfırlanır.
// Kalıcı olsun istiyorsan DB (Postgres/SQLite) bağlarız.
let products = [
  // örnek:
  // { id: 1, name: "Deneme", price: 1500, imageUrl: "" }
];

function nextId() {
  const maxId = products.reduce((m, p) => (p.id > m ? p.id : m), 0);
  return maxId + 1;
}

// ---- Health ----
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "dresserp-backend", time: new Date().toISOString() });
});

// ---- Products API ----

// Listele
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Ekle
app.post("/api/products", (req, res) => {
  const { name, price, imageUrl } = req.body || {};

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name zorunlu" });
  }

  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: "price geçersiz" });
  }

  const product = {
    id: nextId(),
    name: name.trim(),
    price: numPrice,
    imageUrl: (imageUrl || "").toString().trim(),
  };

  products.push(product);
  res.status(201).json(product);
});

// Sil (SENDE EKSİK OLAN ENDPOINT)
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Ürün bulunamadı" });
  }

  const deleted = products.splice(index, 1)[0];
  res.json({ success: true, deleted });
});

// (Opsiyonel) Güncelle
app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Ürün bulunamadı" });
  }

  const { name, price, imageUrl } = req.body || {};
  if (name !== undefined) products[index].name = String(name).trim();
  if (price !== undefined) {
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: "price geçersiz" });
    }
    products[index].price = numPrice;
  }
  if (imageUrl !== undefined) products[index].imageUrl = String(imageUrl).trim();

  res.json(products[index]);
});

// ---- 404 fallback ----
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`✅ dresserp-backend running on port ${PORT}`);
});