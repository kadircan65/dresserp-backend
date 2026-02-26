console.log("BOOT OK ✅ 2026-02-27 STORES-FIX v1");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");

const app = express();

// CORS
app.use(cors());

// JSON
app.use(express.json({ limit: "2mb" }));

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ROUTES — BURASI KRİTİK
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.get("/__version", (req, res) => {
  res.json({ ok: true, version: "2026-02-27 STORES-FIX v1" });
});
// ROOT TEST
app.get("/", (req, res) => {
  res.send("OmurApp backend running");
});

// SERVER START
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server started on port", PORT);
});