const express = require("express");
const router = express.Router();

let stores = [];

// REGISTER
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

  res.status(201).json({
    id: store.id,
    name: store.name,
    email: store.email,
    whatsapp: store.whatsapp,
  });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const store = stores.find(
    (s) => s.email === email && s.password === password
  );

  if (!store) {
    return res.status(401).json({ error: "Email veya şifre hatalı" });
  }

  res.json({
    id: store.id,
    name: store.name,
    email: store.email,
    whatsapp: store.whatsapp,
  });
});

module.exports = router;