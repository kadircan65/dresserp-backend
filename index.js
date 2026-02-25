import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());

/*
====================================
CORS FINAL CONFIG (VERCEL + LOCAL)
====================================
*/
const allowedOrigins = [
  "https://dresserp-frontend.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {

    // Postman, server-to-server, curl vs için izin
    if (!origin) return callback(null, true);

    // allowedOrigins listesinde varsa izin ver
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Vercel preview deployları için izin
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // diğer her şeyi blokla
    return callback(new Error("CORS blocked: " + origin));

  },
  credentials: true
}));

// preflight için gerekli
app.options("*", cors());

/*
====================================
ROUTES BURADAN SONRA GELİR
====================================
*/

// örnek health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/*
====================================
SERVER START
====================================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});