import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

/*
====================================
DATABASE CONNECTION
====================================
*/

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/*
====================================
HEALTH CHECK
====================================
*/

app.get("/health", (req, res) => {
  res.send("OK");
});

/*
====================================
DEBUG DATABASE
====================================
*/

app.get("/debug/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/*
====================================
GET PRODUCTS
====================================
*/

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/*
====================================
ADD PRODUCT
====================================
*/

app.post("/products", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    const result = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1, $2, $3) RETURNING *",
      [name, price, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/*
====================================
START SERVER
====================================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});