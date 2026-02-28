const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all products
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, price FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
});

// POST product
router.post("/", async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name) return res.status(400).json({ error: "name gerekli" });
    if (typeof price !== "number")
      return res.status(400).json({ error: "price sayı olmalı" });

    const { rows } = await db.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM products WHERE id = $1", [id]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
});

module.exports = router;