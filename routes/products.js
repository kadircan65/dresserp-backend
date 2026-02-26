const express = require("express");
const router = express.Router();

// geçici in-memory db
let products = [];

// GET /api/products?storeId=xxx
router.get("/", (req, res) => {
  const { storeId } = req.query;

  if (!storeId) {
    return res.status(400).json({ error: "storeId gerekli" });
  }

  const filtered = products.filter(p => p.storeId === storeId);
  res.json(filtered);
});

// POST /api/products
router.post("/", (req, res) => {
  const { storeId, name, price, imageUrl } = req.body;

  if (!storeId) {
    return res.status(400).json({ error: "storeId gerekli" });
  }

  const product = {
    id: Date.now().toString(),
    storeId,
    name,
    price,
    imageUrl,
  };

  products.push(product);

  res.json(product);
});

// DELETE
router.delete("/:id", (req, res) => {

  const { storeId } = req.query;
  const { id } = req.params;

  const index = products.findIndex(
    p => p.id === id && p.storeId === storeId
  );

  if (index === -1) {
    return res.status(404).json({ error: "bulunamadı" });
  }

  products.splice(index, 1);

  res.json({ ok: true });
});

module.exports = router;