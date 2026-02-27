const express = require("express");
const router = express.Router();

// geçici in-memory db
let products = [];

// GET
router.get("/", (req, res) => {
  res.json(products);
});

// POST
router.post("/", (req, res) => {
  const { storeId, name, price, imageUrl } = req.body;

  const safeStoreId = storeId || "default-store";

  const newProduct = {
    id: Date.now().toString(),
    storeId: safeStoreId,
    name,
    price,
    imageUrl,
  };

  products.push(newProduct);
  res.json(newProduct);
});

// DELETE
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "bulunamadı" });
  }

  products.splice(index, 1);
  res.json({ ok: true });
});

module.exports = router;