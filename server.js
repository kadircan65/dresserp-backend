// server.js
console.log("BOOT OK ✅ 2026-02-27 FULL SERVER.js");

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ✅ ROUTES
const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");
const uploadRoutes = require("./routes/upload");

const app = express();

// ✅ CORS
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-token",
    "X-Admin-Token",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight garantisi

// ✅ Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ✅ Routes
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/upload", uploadRoutes);

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "server_error", message: err.message });
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});