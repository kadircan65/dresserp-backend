require("dotenv").config();

const express = require("express");
const cors = require("cors");

const storesRoutes = require("./routes/stores");
const productsRoutes = require("./routes/products");

const app = express();

/*
--------------------------------
CORS AYARI
--------------------------------
*/

const allowedOrigins = [
  "https://dresserp.app",
  "https://www.dresserp.app",
  "https://dresserp-admin.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    try {

      const hostname = new URL(origin).hostname;

      if (hostname.endsWith(".dresserp.app")) {
        return callback(null, true);
      }

    } catch (err) {}

    return callback(new Error("CORS blocked: " + origin));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-master-key"
  ],

  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/*
--------------------------------
MIDDLEWARE
--------------------------------
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
--------------------------------
HEALTH CHECK
--------------------------------
*/

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/*
--------------------------------
API ROUTES
--------------------------------
*/

app.use("/api/s", storesRoutes);
app.use("/api/s", productsRoutes);

/*
--------------------------------
404
--------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    error: "not_found",
  });
});

/*
--------------------------------
SERVER START
--------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});