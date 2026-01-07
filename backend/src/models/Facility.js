const mongoose = require("mongoose");

const FacilitySchema = new mongoose.Schema({
  name: String,
  building: String,
  floor: String,
  type: String,

  imageUrl: String,      // thumbnail
  gallery: [String],     // multiple images
});

module.exports = mongoose.model("Facility", FacilitySchema);
