import express from "express";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// Railway domainlerini + kendi admin domainini izinli yap
const allowedOrigins = [
  /^https:\/\/.*\.up\.railway\.app$/,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
      return cb(ok ? null : new Error("CORS blocked"), ok);
    },
    credentials: false,
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  const token = req.header("x-admin-token");
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// --- Demo in-memory store (DB yoksa) ---
let products = [
  { id: 1, name: "Örnek Ürün", price: 1500, imageUrl: "" },
];

// LIST
app.get("/api/products", (req, res) => {
  res.json(products);
});

// CREATE
app.post("/api/products", requireAdmin, (req, res) => {
  const { name, price, imageUrl } = req.body || {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const p = {
    id: Date.now(),
    name: name.trim(),
    price: Number(price || 0),
    imageUrl: (imageUrl || "").trim(),
  };
  products.unshift(p);
  res.status(201).json(p);
});

// DELETE
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const before = products.length;
  products = products.filter((p) => String(p.id) !== id);
  if (products.length === before) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});