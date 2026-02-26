const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "dresserp",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    res.json({
      url: req.file.path,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Upload failed",
    });
  }
});

module.exports = router;