const express = require("express");
const router = express.Router();

let stores = [];

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const store = {
    id: Date.now().toString(),
    name,
    email,
    password,
  };

  stores.push(store);

  res.json(store);
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const store = stores.find(
    s => s.email === email && s.password === password
  );

  if (!store) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json(store);
});

module.exports = router;