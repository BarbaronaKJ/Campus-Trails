const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campus_trails",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

module.exports = multer({ storage });
