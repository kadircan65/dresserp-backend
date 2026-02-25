const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://dresserp-frontend.vercel.app"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (origin.endsWith(".vercel.app")) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));

app.get("/", (req, res) => res.status(200).send("Backend is running 🚀"));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));
app.get("/products", (req, res) => res.status(200).json([{ id: 1, name: "Test Ürün", price: 100 }]));

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});