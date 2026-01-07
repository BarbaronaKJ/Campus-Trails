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

const saveFacilityBuilding16 = async () => {
  await connectDB();
  
  try {
    const building16Data = {
      name: "Gymnasium / DRER Memorial Hall",
      building: "16",
      floor: "Ground floor and upper levels",
      type: "Sports & Recreation Facility",
      imageUrl: "https://res.cloudinary.com/dabwaaxtm/image/upload/v1767767892/campus_trails/gym16.jpg",
      gallery: ["https://res.cloudinary.com/dabwaaxtm/image/upload/v1767767892/campus_trails/gym16.jpg"]
    };

    const facility = new Facility(building16Data);
    const savedFacility = await facility.save();
    
    console.log("\n✅ Building 16 saved to MongoDB!");
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

saveFacilityBuilding16();
