/**
 * Debug script for Analytics (anonymous usage tracking)
 * Shows search and pathfinding route data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function debugAnalytics() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const command = process.argv[2] || 'show';

    switch (command) {
      case 'show':
        await showAnalytics();
        break;
      case 'routes':
        await showRoutes();
        break;
      case 'searches':
        await showSearches();
        break;
      case 'popular':
        await showPopular();
        break;
      case 'clear':
        await clearAnalytics();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function showAnalytics() {
  console.log('📊 Analytics Overview\n');
  console.log('='.repeat(60));

  const analytics = await Analytics.getOrCreate();

  console.log('\n📈 Summary:');
  console.log(`   Total Searches: ${analytics.searches.length}`);
  console.log(`   Total Pathfinding Routes: ${analytics.pathfindingRoutes.length}`);

  // Recent activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentSearches = analytics.searches.filter(s => new Date(s.timestamp) >= oneDayAgo);
  const recentRoutes = analytics.pathfindingRoutes.filter(r => new Date(r.timestamp) >= oneDayAgo);

  console.log(`\n🕐 Last 24 Hours:`);
  console.log(`   Searches: ${recentSearches.length}`);
  console.log(`   Pathfinding Routes: ${recentRoutes.length}`);

  // Popular searches
  const popularSearches = analytics.getPopularSearches(null, 5);
  if (popularSearches.length > 0) {
    console.log(`\n🔍 Top 5 Searches:`);
    popularSearches.forEach((search, index) => {
      console.log(`   ${index + 1}. "${search.query}" - ${search.count} times`);
    });
  }

  // Popular routes
  const popularRoutes = analytics.getPopularRoutes(null, 5);
  if (popularRoutes.length > 0) {
    console.log(`\n🗺️  Top 5 Routes:`);
    popularRoutes.forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.startPoint.title || route.startPoint.pinId} -> ${route.endPoint.title || route.endPoint.pinId} - ${route.count} times`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

async function showRoutes() {
  console.log('🗺️  Pathfinding Routes (Point A to B)\n');
  console.log('='.repeat(80));

  const analytics = await Analytics.getOrCreate();
  const limit = parseInt(process.argv[3]) || 20;
  const routes = analytics.pathfindingRoutes.slice(-limit).reverse();

  if (routes.length === 0) {
    console.log('No pathfinding routes tracked yet.');
    return;
  }

  console.log(`\nShowing last ${Math.min(limit, routes.length)} routes:\n`);
  console.log(`${'From'.padEnd(25)} | ${'To'.padEnd(25)} | ${'Steps'.padEnd(8)} | ${'Date'.padEnd(20)}`);
  console.log('-'.repeat(80));

  routes.forEach(route => {
    const from = (route.startPoint.title || route.startPoint.pinId || 'Unknown').substring(0, 24);
    const to = (route.endPoint.title || route.endPoint.pinId || 'Unknown').substring(0, 24);
    const steps = route.pathLength.toString().padEnd(8);
    const date = new Date(route.timestamp).toLocaleString().substring(0, 19);
    console.log(`${from.padEnd(25)} | ${to.padEnd(25)} | ${steps} | ${date}`);
  });

  console.log('\n' + '='.repeat(80));
}

async function showSearches() {
  console.log('🔍 Search Queries\n');
  console.log('='.repeat(60));

  const analytics = await Analytics.getOrCreate();
  const limit = parseInt(process.argv[3]) || 20;
  const searches = analytics.searches.slice(-limit).reverse();

  if (searches.length === 0) {
    console.log('No searches tracked yet.');
    return;
  }

  console.log(`\nShowing last ${Math.min(limit, searches.length)} searches:\n`);
  console.log(`${'Query'.padEnd(30)} | ${'Results'.padEnd(10)} | ${'Date'.padEnd(20)}`);
  console.log('-'.repeat(60));

  searches.forEach(search => {
    const query = search.query.substring(0, 29).padEnd(30);
    const results = search.resultCount.toString().padEnd(10);
    const date = new Date(search.timestamp).toLocaleString().substring(0, 19);
    console.log(`${query} | ${results} | ${date}`);
  });

  console.log('\n' + '='.repeat(60));
}

async function showPopular() {
  console.log('📊 Popular Routes and Searches\n');
  console.log('='.repeat(80));

  const analytics = await Analytics.getOrCreate();
  const limit = parseInt(process.argv[3]) || 10;

  // Popular routes
  const popularRoutes = analytics.getPopularRoutes(null, limit);
  console.log(`\n🗺️  Top ${popularRoutes.length} Most Used Routes:`);
  console.log('-'.repeat(80));
  popularRoutes.forEach((route, index) => {
    const from = route.startPoint.title || route.startPoint.pinId || 'Unknown';
    const to = route.endPoint.title || route.endPoint.pinId || 'Unknown';
    console.log(`   ${(index + 1).toString().padStart(2)}. ${from} -> ${to} (${route.count} times)`);
  });

  // Popular searches
  const popularSearches = analytics.getPopularSearches(null, limit);
  console.log(`\n🔍 Top ${popularSearches.length} Most Searched:`);
  console.log('-'.repeat(80));
  popularSearches.forEach((search, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. "${search.query}" (${search.count} times)`);
  });

  console.log('\n' + '='.repeat(80));
}

async function clearAnalytics() {
  console.log('🗑️  Clearing all analytics data...\n');

  const analytics = await Analytics.getOrCreate();
  analytics.searches = [];
  analytics.pathfindingRoutes = [];
  await analytics.save();

  console.log('✅ All analytics data cleared');
}

function showHelp() {
  console.log('📋 Analytics Debug Script\n');
  console.log('Usage: node backend/scripts/debugAnalytics.js [command] [options]\n');
  console.log('Commands:');
  console.log('  show                    Show analytics overview (default)');
  console.log('  routes [limit]          Show recent pathfinding routes (default: 20)');
  console.log('  searches [limit]         Show recent searches (default: 20)');
  console.log('  popular [limit]         Show popular routes and searches (default: 10)');
  console.log('  clear                   Clear all analytics data');
  console.log('  help                    Show this help message\n');
  console.log('Examples:');
  console.log('  node backend/scripts/debugAnalytics.js');
  console.log('  node backend/scripts/debugAnalytics.js routes 50');
  console.log('  node backend/scripts/debugAnalytics.js popular 20');
  console.log('  node backend/scripts/debugAnalytics.js clear');
}

// Run the script
if (require.main === module) {
  debugAnalytics();
}

module.exports = { debugAnalytics };
