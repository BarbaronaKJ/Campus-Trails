const express = require("express");
const upload = require("../config/multer");
const Facility = require("../models/Facility");

const router = express.Router();

// Upload single image
router.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    try {
      res.json({
        imageUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
