require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let products = [];
let idCounter = 1;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "123456";

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN)
    return res.status(403).json({ error: "Unauthorized" });

  const { name, price, image } = req.body;

  const product = {
    id: idCounter++,
    name,
    price,
    image,
  };

  products.push(product);

  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN)
    return res.status(403).json({ error: "Unauthorized" });

  const id = Number(req.params.id);

  products = products.filter(p => p.id !== id);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});