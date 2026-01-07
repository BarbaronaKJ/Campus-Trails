require("dotenv").config();
const mongoose = require("mongoose");
const Facility = require("../models/Facility");

const checkFacilities = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected\n");
    
    const facilities = await Facility.find({ building: "9" });
    
    if (facilities.length === 0) {
      console.log("❌ No facilities found for Building 9");
    } else {
      console.log(`✅ Found ${facilities.length} facility record(s) for Building 9:\n`);
      facilities.forEach((facility, index) => {
        console.log(`Record ${index + 1}:`);
        console.log("  ID:", facility._id);
        console.log("  Name:", facility.name);
        console.log("  Building:", facility.building);
        console.log("  Image URL:", facility.imageUrl);
        console.log("  Gallery:", facility.gallery);
        console.log();
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

checkFacilities();
