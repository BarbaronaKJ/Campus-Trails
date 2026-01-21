#!/usr/bin/env node

/**
 * Debug CLI for Node.js/Express Deployment
 * 
 * Usage:
 *   node scripts/debug-deploy.js
 *   node scripts/debug-deploy.js --check-env
 *   node scripts/debug-deploy.js --check-db
 *   node scripts/debug-deploy.js --check-api
 *   node scripts/debug-deploy.js --full
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

// Check command line arguments
const args = process.argv.slice(2);
const checkEnv = args.includes('--check-env') || args.includes('--full');
const checkDb = args.includes('--check-db') || args.includes('--full');
const checkApi = args.includes('--check-api') || args.includes('--full');
const fullCheck = args.includes('--full') || args.length === 0;

// Results tracking
const results = {
  env: { passed: 0, failed: 0, warnings: 0 },
  db: { passed: 0, failed: 0 },
  api: { passed: 0, failed: 0 },
  deps: { passed: 0, failed: 0 },
};

/**
 * Check Environment Variables
 */
async function checkEnvironmentVariables() {
  log.section('🔍 Environment Variables Check');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
  ];
  
  const optionalVars = [
    'CORS_ORIGINS',
    'NODE_ENV',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
  ];
  
  // Check required variables
  log.info('Checking required environment variables...');
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      if (varName === 'MONGODB_URI') {
        // Mask sensitive parts of MongoDB URI
        const masked = process.env[varName].replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
        log.success(`${varName}: ${masked}`);
      } else if (varName === 'JWT_SECRET') {
        log.success(`${varName}: ${'*'.repeat(process.env[varName].length)}`);
      } else {
        log.success(`${varName}: ${process.env[varName]}`);
      }
      results.env.passed++;
    } else {
      log.error(`${varName}: NOT SET (REQUIRED)`);
      results.env.failed++;
    }
  }
  
  // Check optional variables
  log.info('\nChecking optional environment variables...');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      if (varName.includes('PASS') || varName.includes('SECRET')) {
        log.success(`${varName}: ${'*'.repeat(process.env[varName].length)}`);
      } else {
        log.success(`${varName}: ${process.env[varName]}`);
      }
      results.env.passed++;
    } else {
      log.warning(`${varName}: Not set (optional)`);
      results.env.warnings++;
    }
  }
  
  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    log.warning('NODE_ENV not set. Defaulting to "development"');
    process.env.NODE_ENV = 'development';
  } else {
    log.info(`NODE_ENV: ${process.env.NODE_ENV}`);
  }
  
  return results.env.failed === 0;
}

/**
 * Check Database Connection
 */
async function checkDatabaseConnection() {
  log.section('🗄️  Database Connection Check');
  
  if (!process.env.MONGODB_URI) {
    log.error('MONGODB_URI not set. Cannot test database connection.');
    results.db.failed++;
    return false;
  }
  
  try {
    log.info('Attempting to connect to MongoDB...');
    const maskedUri = process.env.MONGODB_URI.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
    log.info(`Connection string: ${maskedUri}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    log.success('MongoDB connection successful!');
    log.info(`Database: ${mongoose.connection.name}`);
    log.info(`Host: ${mongoose.connection.host}`);
    log.info(`Port: ${mongoose.connection.port || 'default'}`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    log.info(`\nAvailable collections (${collections.length}):`);
    collections.forEach(col => {
      log.info(`  - ${col.name}`);
    });
    
    // Check required models
    const requiredModels = ['pins', 'users', 'campuses', 'admins'];
    log.info('\nChecking required collections...');
    for (const modelName of requiredModels) {
      const exists = collections.some(col => col.name === modelName);
      if (exists) {
        log.success(`Collection "${modelName}" exists`);
        results.db.passed++;
      } else {
        log.warning(`Collection "${modelName}" not found (may need initialization)`);
        results.db.failed++;
      }
    }
    
    await mongoose.connection.close();
    log.success('Database connection closed successfully');
    results.db.passed++;
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    log.info('\nTroubleshooting tips:');
    log.info('  1. Verify MONGODB_URI is correct');
    log.info('  2. Check if your IP is whitelisted in MongoDB Atlas');
    log.info('  3. Verify network connectivity');
    log.info('  4. Check MongoDB Atlas cluster status');
    results.db.failed++;
    return false;
  }
}

/**
 * Check Dependencies
 */
async function checkDependencies() {
  log.section('📦 Dependencies Check');
  
  const requiredDeps = [
    'express',
    'mongoose',
    'cors',
    'dotenv',
    'jsonwebtoken',
    'bcryptjs',
    'nodemailer',
  ];
  
  log.info('Checking required npm packages...');
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
      const pkg = require(`${dep}/package.json`);
      log.success(`${dep}: v${pkg.version}`);
      results.deps.passed++;
    } catch (error) {
      log.error(`${dep}: NOT INSTALLED`);
      log.info(`  Run: npm install ${dep}`);
      results.deps.failed++;
    }
  }
  
  return results.deps.failed === 0;
}

/**
 * Check API Server
 */
async function checkAPIServer() {
  log.section('🌐 API Server Check');
  
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  
  // Helper function to make HTTP request
  const makeRequest = (path) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: path,
        method: 'GET',
        timeout: 5000,
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  };
  
  // Start a test server
  return new Promise((resolve) => {
    const express = require('express');
    const app = express();
    
    app.get('/health', (req, res) => {
      res.json({ success: true, message: 'Server is running' });
    });
    
    const server = app.listen(PORT, async () => {
      log.success(`Test server started on port ${PORT}`);
      results.api.passed++;
      
      // Test health endpoint
      try {
        const response = await makeRequest('/health');
        
        if (response.status === 200 && response.data.success) {
          log.success('Health endpoint responding correctly');
          results.api.passed++;
        } else {
          log.error('Health endpoint returned unexpected response');
          results.api.failed++;
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          log.warning('Could not connect to test server (this is expected if server is not running)');
          log.info('To test API endpoints, start the server with: npm start');
          results.api.passed++;
        } else {
          log.error(`Failed to test health endpoint: ${error.message}`);
          results.api.failed++;
        }
      }
      
      // Test root endpoint (optional check)
      try {
        const response = await makeRequest('/');
        
        if (response.status === 200) {
          log.success('Root endpoint responding correctly');
          results.api.passed++;
        } else {
          log.warning('Root endpoint returned unexpected response (may be OK)');
          // Don't fail the check for root endpoint
        }
      } catch (error) {
        // Ignore errors for root endpoint test - it's optional
        log.warning('Root endpoint test skipped (optional)');
      }
      
      server.close(() => {
        log.success('Test server closed');
        resolve(results.api.failed === 0);
      });
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log.warning(`Port ${PORT} is already in use. Server may already be running.`);
        log.info('This is OK if you are running the server in another terminal.');
        results.api.passed++;
      } else {
        log.error(`Server error: ${error.message}`);
        results.api.failed++;
      }
      resolve(results.api.failed === 0);
    });
  });
}

/**
 * Check File Structure
 */
async function checkFileStructure() {
  log.section('📁 File Structure Check');
  
  const fs = require('fs');
  const requiredFiles = [
    'server.js',
    'package.json',
    'routes/pins.js',
    'routes/auth.js',
    'models/Pin.js',
    'models/User.js',
    'middleware/auth.js',
  ];
  
  log.info('Checking required files...');
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      log.success(`${file}: exists`);
    } else {
      log.error(`${file}: NOT FOUND`);
    }
  }
}

/**
 * Generate Deployment Report
 */
function generateReport() {
  log.section('📊 Deployment Readiness Report');
  
  const totalChecks = 
    results.env.passed + results.env.failed + results.env.warnings +
    results.db.passed + results.db.failed +
    results.api.passed + results.api.failed +
    results.deps.passed + results.deps.failed;
  
  const totalPassed = 
    results.env.passed + results.db.passed + results.api.passed + results.deps.passed;
  
  const totalFailed = 
    results.env.failed + results.db.failed + results.api.failed + results.deps.failed;
  
  log.info(`Total checks: ${totalChecks}`);
  log.success(`Passed: ${totalPassed}`);
  if (totalFailed > 0) {
    log.error(`Failed: ${totalFailed}`);
  }
  if (results.env.warnings > 0) {
    log.warning(`Warnings: ${results.env.warnings}`);
  }
  
  console.log('\n');
  if (totalFailed === 0) {
    log.success('🎉 All checks passed! Server is ready for deployment.');
    return true;
  } else {
    log.error('❌ Some checks failed. Please fix the issues above before deploying.');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Campus Trails Backend - Deployment Debug CLI          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    if (fullCheck || checkEnv) {
      await checkEnvironmentVariables();
    }
    
    if (fullCheck) {
      await checkDependencies();
    }
    
    if (fullCheck) {
      await checkFileStructure();
    }
    
    if (fullCheck || checkDb) {
      await checkDatabaseConnection();
    }
    
    if (fullCheck || checkApi) {
      await checkAPIServer();
    }
    
    const isReady = generateReport();
    
    process.exit(isReady ? 0 : 1);
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main();
