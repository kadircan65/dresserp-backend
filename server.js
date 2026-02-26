require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Body
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS (basit, sorunsuz)
app.use(cors());

// ROUTES
const productsRoutes = require("./routes/products");
const storesRoutes = require("./routes/stores");

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Mount
app.use("/api/products", productsRoutes);
app.use("/api/stores", storesRoutes);

// Debug: route görünüyor mu? (KALICI KALABİLİR)
app.get("/api", (req, res) => {
  res.json({
    ok: true,
    routes: ["/health", "/api/products", "/api/stores"],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Server started on port", PORT));