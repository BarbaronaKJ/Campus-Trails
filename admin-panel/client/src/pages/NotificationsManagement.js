import React, { useState } from 'react';
import { notificationsAPI, usersAPI } from '../services/api';

function NotificationsManagement() {
  const [formData, setFormData] = useState({ title: '', body: '', targetAudience: 'all' });

  const handleSend = async () => {
    try {
      await notificationsAPI.send(formData);
      alert('Notification sent!');
      setFormData({ title: '', body: '', targetAudience: 'all' });
    } catch (error) {
      alert('Error sending notification');
    }
  };

  return (
    <div className="container">
      <h1>Send Notifications</h1>
      <div className="card">
        <div className="form-group">
          <label>Title</label>
          <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Body</label>
          <textarea value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Target Audience</label>
          <select value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}>
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="admins">Admins Only</option>
          </select>
        </div>
        <button onClick={handleSend} className="btn btn-primary">Send Notification</button>
      </div>
    </div>
  );
}

export default NotificationsManagement;
