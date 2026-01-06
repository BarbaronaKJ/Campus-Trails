const express = require("express");
const Facility = require("../models/Facility");

const router = express.Router();

// GET all facilities
router.get("/", async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new facility
router.post("/", async (req, res) => {
  try {
    const facility = new Facility(req.body);
    const saved = await facility.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
