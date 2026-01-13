/**
 * Vercel Serverless Function - Health Check
 */

module.exports = async (req, res) => {
  return res.json({
    success: true,
    message: 'Campus Trails API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
};
