const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/**
 * Admin auth middleware
 * - Reads token from: "x-admin-token"  (primary)
 * - Also accepts: Authorization: Bearer <token>
 */
function requireAdmin(req, res, next) {
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_TOKEN missing on server" });
  }

  let token = (req.headers["x-admin-token"] || "").toString().trim();

  if (!token) {
    const auth = (req.headers["authorization"] || "").toString().trim();
    if (auth.toLowerCase().startsWith("bearer ")) {
      token = auth.slice(7).trim();
    }
  }

  if (!token) return res.status(401).json({ error: "Missing admin token" });

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // güvenli dosya adı
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";

    return {
      folder: "dresserp",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `p_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
      format: safeExt,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ POST /api/uploads  (server.js -> app.use("/api/uploads", uploadRoutes))
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        error: "No file uploaded. Use form-data key: image",
      });
    }

    return res.json({
      ok: true,
      url: req.file.path,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: error?.message || String(error),
    });
  }
});

module.exports = router;