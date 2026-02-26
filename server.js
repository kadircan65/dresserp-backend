import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET PRODUCTS
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD PRODUCT
app.post("/admin/products", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, price, image } = req.body;

    const result = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1,$2,$3) RETURNING *",
      [name, price, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE PRODUCT
app.delete("/admin/products/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await pool.query("DELETE FROM products WHERE id=$1", [
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API running on port", PORT);
});