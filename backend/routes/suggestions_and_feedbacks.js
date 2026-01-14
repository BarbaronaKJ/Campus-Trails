const express = require('express');
const router = express.Router();
const SuggestionsAndFeedback = require('../models/SuggestionsAndFeedback');

/**
 * GET /api/suggestions_and_feedbacks
 * Get suggestions and feedbacks (filtered by campusId, type, status)
 * Query Parameters:
 *   - campusId: (optional) Filter by campus ID
 *   - type: (optional) Filter by type ('suggestion' or 'feedback')
 *   - status: (optional) Filter by status
 */
router.get('/', async (req, res) => {
  try {
    const { campusId, type, status } = req.query;
    const query = {};
    
    if (campusId) query.campusId = campusId;
    if (type) query.type = type;
    if (status) query.status = status;
    
    const suggestions = await SuggestionsAndFeedback.find(query)
      .populate('userId', 'username email displayName profilePicture')
      .populate('campusId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching suggestions and feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions and feedbacks',
      error: error.message
    });
  }
});

/**
 * POST /api/suggestions_and_feedbacks
 * Create a new suggestion or feedback (requires authentication)
 * Request Body: { campusId, message, type (optional) }
 */
router.post('/', async (req, res) => {
  try {
    const { campusId, message, type } = req.body;
    
    // Get userId from token or body
    const userId = req.body.userId || req.headers['x-user-id'];
    
    // Validate required fields
    if (!userId || !campusId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, campusId, message'
      });
    }
    
    // Validate message length
    if (message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters'
      });
    }
    
    // Validate type
    const validType = type || 'suggestion';
    if (!['suggestion', 'feedback'].includes(validType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "suggestion" or "feedback"'
      });
    }
    
    const suggestionData = {
      userId,
      campusId,
      message: message.trim(),
      type: validType,
      status: 'new'
    };
    
    const suggestion = new SuggestionsAndFeedback(suggestionData);
    await suggestion.save();
    
    const populatedSuggestion = await SuggestionsAndFeedback.findById(suggestion._id)
      .populate('userId', 'username email displayName profilePicture')
      .populate('campusId', 'name')
      .lean();
    
    res.status(201).json({
      success: true,
      message: 'Suggestion/feedback submitted successfully',
      data: populatedSuggestion
    });
  } catch (error) {
    console.error('Error creating suggestion/feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating suggestion/feedback',
      error: error.message
    });
  }
});

module.exports = router;
