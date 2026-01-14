import React, { useState, useEffect } from 'react';
import { pinsAPI, usersAPI, campusesAPI, feedbacksAPI, notificationsAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    pins: 0,
    users: 0,
    campuses: 0,
    feedbacks: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [pinsRes, usersRes, campusesRes, feedbacksRes, notificationsRes] = await Promise.all([
        pinsAPI.getAll({ limit: 1 }),
        usersAPI.getAll({ limit: 1 }),
        campusesAPI.getAll(),
        feedbacksAPI.getAll({ limit: 1 }),
        notificationsAPI.getAll({ limit: 1 })
      ]);

      setStats({
        pins: pinsRes.data.pagination?.total || 0,
        users: usersRes.data.pagination?.total || 0,
        campuses: campusesRes.data.campuses?.length || 0,
        feedbacks: feedbacksRes.data.pagination?.total || 0,
        notifications: notificationsRes.data.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Total Pins</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.pins}</p>
        </div>
        <div className="card">
          <h3>Total Users</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.users}</p>
        </div>
        <div className="card">
          <h3>Campuses</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.campuses}</p>
        </div>
        <div className="card">
          <h3>Feedbacks</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.feedbacks}</p>
        </div>
        <div className="card">
          <h3>Notifications</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>{stats.notifications}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
