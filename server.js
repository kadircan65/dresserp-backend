require("dotenv").config();

const express = require("express");
const cors = require("cors");

const uploadRoutes = require("./routes/upload");
const storesRoutes = require("./routes/stores");

const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  })
);

// JSON
app.use(express.json({ limit: "2mb" }));

// ROUTES
app.use("/api/upload", uploadRoutes);
app.use("/api/stores", storesRoutes);

// HEALTH
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// PRODUCTS (temporary)
let products = [];

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, price, imageUrl } = req.body;

  const product = {
    id: Date.now().toString(),
    name,
    price,
    imageUrl,
  };

  products.push(product);

  res.json(product);
});

// SERVER START (EN SONDA OLACAK)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server started on port", PORT);
});