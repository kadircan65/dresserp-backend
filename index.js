import express from "express";
import cors from "cors";

const app = express();

// Railway için PORT
const PORT = process.env.PORT || 5173;

// JSON middleware
app.use(express.json());

/*
CORS — FINAL SAFE CONFIG
*/
const allowedOrigins = [
  "http://localhost:5173",
  "https://dresserp-frontend.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {

    // Postman / direct browser access
    if (!origin) {
      return callback(null, true);
    }

    // allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Vercel preview support
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// PRODUCTS ROUTE TEST
app.get("/products", (req, res) => {
  res.json([
    { id: 1, name: "Test Ürün", price: 100 }
  ]);
});

// SERVER START — EN ÖNEMLİ KISIM
app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});