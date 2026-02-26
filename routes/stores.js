const express = require("express");
const router = express.Router();

let stores = []; // in-memory (şimdilik)

router.get("/", (req, res) => {
  // GET /api/stores
  return res.json(
    stores.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      whatsapp: s.whatsapp,
      createdAt: s.createdAt,
    }))
  );
});

router.post("/register", (req, res) => {
  const { name, email, password, whatsapp } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password zorunlu" });
  }

  const exists = stores.find((s) => s.email === email);
  if (exists) {
    return res.status(409).json({ error: "Bu email zaten kayıtlı" });
  }

  const store = {
    id: Date.now().toString(),
    name,
    email,
    password,
    whatsapp: whatsapp || "",
    createdAt: new Date().toISOString(),
  };

  stores.push(store);

  return res.status(201).json({
    id: store.id,
    name: store.name,
    email: store.email,
    whatsapp: store.whatsapp,
    createdAt: store.createdAt,
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const store = stores.find((s) => s.email === email && s.password === password);
  if (!store) {
    return res.status(401).json({ error: "Email veya şifre hatalı" });
  }

  return res.json({
    id: store.id,
    name: store.name,
    email: store.email,
    whatsapp: store.whatsapp,
    createdAt: store.createdAt,
  });
});

module.exports = router;