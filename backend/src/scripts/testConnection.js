require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
  console.log("Testing MongoDB connection...");
  console.log("URI:", process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log("\n✅ MongoDB Connected Successfully!");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    console.log("Ready State:", conn.connection.readyState);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\nCollections:", collections.map(c => c.name).join(", ") || "None");
    
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed successfully");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ MongoDB Connection Failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("ENOTFOUND")) {
      console.error("\n💡 DNS resolution failed - check network connection");
    } else if (error.message.includes("Authentication failed")) {
      console.error("\n💡 Check username/password in MONGO_URI");
    } else if (error.message.includes("timed out")) {
      console.error("\n💡 Connection timeout - check firewall/network settings");
    }
    
    process.exit(1);
  }
};

testConnection();
