/**
 * Feedback utility functions
 * Used for transforming and processing feedback data
 */

/**
 * Transform feedback data from database format to display format
 * Handles proper pin title extraction and formatting
 * @param {Array} feedbackHistoryFromDB - Feedback array from database
 * @param {Array} pins - Array of all pins for lookup
 * @returns {Array} Transformed feedback array
 */
export const transformFeedbackData = (feedbackHistoryFromDB, pins = []) => {
  if (!feedbackHistoryFromDB || !Array.isArray(feedbackHistoryFromDB)) {
    return [];
  }
  
  return feedbackHistoryFromDB.map(feedback => {
    // pinId is populated from backend with id, title, category
    let pinTitle = feedback.pinId?.title || feedback.pinTitle || 'Unknown Building';
    let pinId = feedback.pinId?._id || feedback.pinId?.id || feedback.pinId;
    
    // If title looks like just a number, try to find the actual building name
    if (pinTitle && !isNaN(pinTitle)) {
      const localPin = pins.find(p => p.id == pinTitle || p._id == pinId || p.id == pinId);
      if (localPin && localPin.description) {
        pinTitle = localPin.description;
      } else if (localPin && localPin.title) {
        pinTitle = localPin.title;
      } else {
        pinTitle = `Building #${pinTitle}`;
      }
    }
    
    return {
      id: feedback.id || feedback._id,
      pinId: pinId,
      pinTitle: pinTitle,
      rating: feedback.rating || 5,
      comment: feedback.comment,
      date: feedback.date || feedback.createdAt || new Date().toISOString(),
    };
  });
};
