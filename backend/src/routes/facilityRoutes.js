const express = require("express");
const upload = require("../config/multer");
const Facility = require("../models/Facility");

const router = express.Router();

// Get all facilities
router.get("/", async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get facility by building number
router.get("/:building", async (req, res) => {
  try {
    const facility = await Facility.findOne({ building: req.params.building });
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }
    res.json(facility);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload single image and save facility to MongoDB
router.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, building, floor, type, isGalleryImage } = req.body;
      
      // If this is a gallery image for an existing facility
      if (isGalleryImage && building) {
        const facility = await Facility.findOne({ building });
        if (facility) {
          facility.gallery.push(req.file.path);
          await facility.save();
          return res.json({
            imageUrl: req.file.path,
            facilityId: facility._id,
            message: "Image added to gallery"
          });
        }
      }
      
      // Create new facility or update existing one
      if (building) {
        let facility = await Facility.findOne({ building });
        
        if (facility) {
          // Update existing facility
          if (name) facility.name = name;
          if (floor) facility.floor = floor;
          if (type) facility.type = type;
          facility.imageUrl = req.file.path;
          if (!facility.gallery.includes(req.file.path)) {
            facility.gallery.push(req.file.path);
          }
          await facility.save();
          
          return res.json({
            imageUrl: req.file.path,
            facilityId: facility._id,
            message: "Facility updated"
          });
        } else {
          // Create new facility
          facility = new Facility({
            name: name || `Building ${building}`,
            building,
            floor: floor || "Not specified",
            type: type || "General",
            imageUrl: req.file.path,
            gallery: [req.file.path]
          });
          await facility.save();
          
          return res.json({
            imageUrl: req.file.path,
            facilityId: facility._id,
            message: "New facility created"
          });
        }
      }
      
      // If no building provided, just return the URL
      res.json({
        imageUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete facility by ID
router.delete("/:id", async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }
    res.json({ message: "Facility deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
