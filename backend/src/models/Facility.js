const mongoose = require("mongoose");

const FacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  building: String,
  floor: String,
  type: String, // classroom, office, restroom, etc
  isOpen: { type: Boolean, default: true }
});

module.exports = mongoose.model("Facility", FacilitySchema);
