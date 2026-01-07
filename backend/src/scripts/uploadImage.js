require("dotenv").config();
const cloudinary = require("../config/cloudinary");
const path = require("path");

const uploadImage = async (imagePath) => {
  try {
    console.log(`Uploading ${imagePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "campus_trails",
      use_filename: true,
      unique_filename: false,
    });

    console.log("\n✅ Upload successful!");
    console.log("URL:", result.secure_url);
    console.log("Public ID:", result.public_id);
    console.log("Format:", result.format);
    console.log("Size:", result.bytes, "bytes");
    
    return result;
  } catch (error) {
    console.error("❌ Upload failed:", error.message);
    process.exit(1);
  }
};

// Get image path from command line or use default
const imagePath = process.argv[2] || path.join(__dirname, "../../../assets/bldg9.jpg");
uploadImage(imagePath);
