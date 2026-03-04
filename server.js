// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Routes
const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");
const uploadRoutes = require("./routes/upload");

const app = express();

/**
 * CORS
 * - VITE_ORIGIN: admin panel domain (vercel) -> örn: https://dresserp-admin.vercel.app
 * - Storefront domain'i de ekliyoruz.
 * - Local dev için localhost ekliyoruz.
 */
const allowedOrigins = [
  process.env.VITE_ORIGIN,
  "https://dresserp-admin.vercel.app",
  "https://dresserp-frontend-uinx.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    // origin yoksa (server-to-server / postman) izin ver
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== HEALTH =====
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ===== ADMIN LOGIN (JWT) =====
app.post("/api/admin/login", (req, res) => {
  try {
    const { password } = req.body || {};

    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: "admin_password_missing" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "jwt_secret_missing" });
    }
    if (!password) {
      return res.status(400).json({ error: "password_required" });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "invalid_password" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token });
  } catch (e) {
    console.error("admin_login_error:", e);
    return res.status(500).json({ error: "server_error" });
  }
});

// ===== ROUTES =====
// ÖNEMLİ: /api/products route'u burada bağlanır.
// server.js içinde ayrıca app.get("/api/products"... YAZMA! Çakışır ve 500 üretir.
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/upload", uploadRoutes);

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error("server_error:", err);
  res.status(500).json({ error: "server_error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API listening on", PORT));