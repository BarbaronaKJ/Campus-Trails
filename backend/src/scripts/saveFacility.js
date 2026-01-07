require("dotenv").config();
const mongoose = require("mongoose");
const Facility = require("../models/Facility");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const saveFacility = async (facilityData) => {
  await connectDB();
  
  try {
    const facility = new Facility(facilityData);
    const savedFacility = await facility.save();
    
    console.log("\n✅ Facility saved to MongoDB!");
    console.log("ID:", savedFacility._id);
    console.log("Name:", savedFacility.name);
    console.log("Building:", savedFacility.building);
    console.log("Image URL:", savedFacility.imageUrl);
    
    return savedFacility;
  } catch (error) {
    console.error("❌ Save failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
};

// Building 9 facility data
const building9Data = {
  name: "Information Communication Technology (ICT) Building",
  building: "9",
  floor: "Multiple floors",
  type: "Academic Building",
  imageUrl: "https://res.cloudinary.com/dabwaaxtm/image/upload/v1767765724/campus_trails/bldg9.jpg",
  gallery: ["https://res.cloudinary.com/dabwaaxtm/image/upload/v1767765724/campus_trails/bldg9.jpg"]
};

saveFacility(building9Data);
