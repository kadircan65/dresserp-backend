// server.js
console.log("BOOT OK ✅ 2026-02-27 FULL SERVER.js");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// ✅ ROUTES
const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");
const uploadRoutes = require("./routes/upload");

const app = express();

// ✅ Body parsers (MUTLAKA login route'tan önce)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token", "X-Admin-Token"],
  })
);

// ✅ Admin login route (Body parser'dan sonra!)
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "admin_password_missing" });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "jwt_secret_missing" });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "invalid_password" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.json({ token });
});

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