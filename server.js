// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// ====== CORS (Authorization + x-admin-token serbest) ======
const corsOptions = {
  origin: "*", // istersen burada sadece kendi domainlerini yaz
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight garantisi

// ====== Body parser ======
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ====== ROUTES ======
const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");
const uploadRoutes = require("./routes/upload");

// ====== HEALTH ======
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ====== MOUNT ROUTES ======
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/upload", uploadRoutes);

// ====== 404 ======
app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

// ====== ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error("SERVER_ERROR:", err);
  res.status(500).json({ error: "server_error" });
});

// ====== START ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("BOOT OK");
  console.log(`Listening on ${PORT}`);
});