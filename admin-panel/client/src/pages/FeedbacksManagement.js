import React, { useState, useEffect } from 'react';
import { feedbacksAPI } from '../services/api';

function FeedbacksManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await feedbacksAPI.getAll({ limit: 100 });
      setFeedbacks(res.data.feedbacks);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Feedbacks Management</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>User</th><th>Type</th><th>Comment</th><th>Date</th></tr>
          </thead>
          <tbody>
            {feedbacks.map(f => (
              <tr key={f._id}>
                <td>{f.userId?.email || 'N/A'}</td>
                <td>{f.feedbackType}</td>
                <td>{f.comment}</td>
                <td>{new Date(f.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FeedbacksManagement;
