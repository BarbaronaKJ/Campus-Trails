require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();
const facilityRoutes = require("./routes/facilityRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/facilities", facilityRoutes);
// Connect DB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("Campus Trails API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
