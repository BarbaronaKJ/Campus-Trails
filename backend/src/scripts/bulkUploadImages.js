require("dotenv").config();
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

// Configuration
const config = {
  imageFolder: path.join(__dirname, "../../../assets/BUILDING IMAGES"),
  pinsDataPath: path.join(__dirname, "../../../pinsData.js"),
  apiUrl: "http://localhost:5000/api/facilities/upload",
  delayBetweenUploads: 500, // milliseconds
  retryAttempts: 2,
  supportedFormats: [".jpg", ".jpeg", ".png"],
  defaultType: "Academic Building",
  defaultFloor: "Multiple floors"
};

// Parse pinsData.js to extract building information
function parsePinsData() {
  console.log("📖 Reading pinsData.js...\n");
  
  const pinsContent = fs.readFileSync(config.pinsDataPath, "utf-8");
  const buildingMap = {};
  
  // Regular expression to match building entries
  // Matches patterns like: id: 9, ... description: "BLDG 9 | Building Name"
  const buildingRegex = /{\s*id:\s*["']?(\w+)["']?\s*,[\s\S]*?description:\s*["']BLDG\s+(\w+)\s*\|\s*([^"']+)["']/g;
  
  let match;
  while ((match = buildingRegex.exec(pinsContent)) !== null) {
    const id = match[1];
    const buildingNumber = match[2];
    const buildingName = match[3].trim();
    
    buildingMap[buildingNumber] = {
      id: id,
      name: buildingName,
      building: buildingNumber
    };
  }
  
  // Add special cases for non-numbered buildings
  const specialCases = {
    "MC": { pattern: /id:\s*["']MC["'][\s\S]*?description:\s*["']([^"']+)["']/, key: "MC" },
    "OF": { pattern: /id:\s*["']OF["'][\s\S]*?description:\s*["']([^"']+)["']/, key: "OF" }
  };
  
  for (const [key, config] of Object.entries(specialCases)) {
    const match = pinsContent.match(config.pattern);
    if (match) {
      buildingMap[key] = {
        id: key,
        name: match[1].trim(),
        building: key
      };
    }
  }
  
  console.log(`✅ Found ${Object.keys(buildingMap).length} buildings in pinsData.js\n`);
  return buildingMap;
}

// Scan image folder and map to buildings
function scanImageFolder() {
  console.log("📁 Scanning image folder...\n");
  
  if (!fs.existsSync(config.imageFolder)) {
    console.error(`❌ Folder not found: ${config.imageFolder}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(config.imageFolder);
  const imageFiles = [];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (config.supportedFormats.includes(ext)) {
      const fullPath = path.join(config.imageFolder, file);
      
      // Extract building number/id from filename
      let buildingId = null;
      
      // Pattern: building1.jpg, building9.jpg, etc.
      const numberMatch = file.match(/building(\d+)/i);
      if (numberMatch) {
        buildingId = numberMatch[1];
      }
      
      // Special cases
      if (file.toLowerCase().includes("movableclassroom")) {
        buildingId = "MC";
      } else if (file.toLowerCase().includes("openfield")) {
        buildingId = "OF";
      }
      
      if (buildingId) {
        imageFiles.push({
          filename: file,
          path: fullPath,
          buildingId: buildingId
        });
      } else {
        console.log(`⚠️  Skipping ${file} - couldn't extract building ID`);
      }
    }
  }
  
  console.log(`✅ Found ${imageFiles.length} valid image files\n`);
  return imageFiles;
}

// Upload single image to API
async function uploadImage(imageFile, buildingData, attempt = 1) {
  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(imageFile.path));
    form.append("building", buildingData.building);
    form.append("name", buildingData.name);
    form.append("floor", config.defaultFloor);
    form.append("type", config.defaultType);
    
    const response = await fetch(config.apiUrl, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    if (attempt < config.retryAttempts) {
      console.log(`   ⚠️  Retry ${attempt}/${config.retryAttempts - 1}...`);
      await sleep(1000);
      return uploadImage(imageFile, buildingData, attempt + 1);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main bulk upload function
async function bulkUpload() {
  console.log("🚀 Starting bulk image upload...\n");
  console.log("=".repeat(60));
  console.log("\n");
  
  const startTime = Date.now();
  
  // Parse building data
  const buildingMap = parsePinsData();
  
  // Scan images
  const imageFiles = scanImageFolder();
  
  // Results tracking
  const results = {
    timestamp: new Date().toISOString(),
    total: imageFiles.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  console.log("📤 Starting uploads...\n");
  console.log("=".repeat(60));
  console.log("\n");
  
  // Upload each image
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const buildingData = buildingMap[imageFile.buildingId];
    
    console.log(`[${i + 1}/${imageFiles.length}] Building ${imageFile.buildingId} - ${imageFile.filename}`);
    
    if (!buildingData) {
      console.log(`   ❌ Not found in pinsData.js - SKIPPED\n`);
      results.skipped++;
      results.details.push({
        building: imageFile.buildingId,
        filename: imageFile.filename,
        status: "skipped",
        reason: "Not found in pinsData.js"
      });
      continue;
    }
    
    console.log(`   📝 Name: ${buildingData.name}`);
    console.log(`   📤 Uploading...`);
    
    const result = await uploadImage(imageFile, buildingData);
    
    if (result.success) {
      console.log(`   ✅ Success!`);
      console.log(`   🔗 URL: ${result.data.imageUrl}`);
      console.log(`   💾 ${result.data.message}\n`);
      
      results.successful++;
      results.details.push({
        building: imageFile.buildingId,
        filename: imageFile.filename,
        name: buildingData.name,
        status: "success",
        imageUrl: result.data.imageUrl,
        facilityId: result.data.facilityId
      });
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`);
      
      results.failed++;
      results.details.push({
        building: imageFile.buildingId,
        filename: imageFile.filename,
        name: buildingData.name,
        status: "failed",
        error: result.error
      });
    }
    
    // Delay between uploads
    if (i < imageFiles.length - 1) {
      await sleep(config.delayBetweenUploads);
    }
  }
  
  // Calculate duration
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Print summary
  console.log("\n");
  console.log("=".repeat(60));
  console.log("📊 UPLOAD SUMMARY");
  console.log("=".repeat(60));
  console.log(`\n✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📁 Total: ${results.total}`);
  console.log(`⏱️  Duration: ${duration} seconds\n`);
  
  if (results.failed > 0) {
    console.log("Failed uploads:");
    results.details
      .filter(d => d.status === "failed")
      .forEach(d => {
        console.log(`   - Building ${d.building}: ${d.error}`);
      });
    console.log("\n");
  }
  
  if (results.skipped > 0) {
    console.log("Skipped uploads:");
    results.details
      .filter(d => d.status === "skipped")
      .forEach(d => {
        console.log(`   - Building ${d.building}: ${d.reason}`);
      });
    console.log("\n");
  }
  
  // Save results to file
  const resultsPath = path.join(__dirname, "uploadResults.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`💾 Detailed results saved to: ${resultsPath}\n`);
  
  console.log("=".repeat(60));
  console.log("✨ Bulk upload complete!");
  console.log("=".repeat(60));
}

// Run the bulk upload
bulkUpload().catch(error => {
  console.error("\n❌ Fatal error:", error.message);
  console.error(error.stack);
  process.exit(1);
});
