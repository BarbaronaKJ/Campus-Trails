import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { pinsAPI, usersAPI, campusesAPI, feedbacksAPI, suggestionsAndFeedbacksAPI } from '../services/api';
import { getApiBaseUrl } from '../utils/apiConfig';
import './Dashboard.css';

function Dashboard() {
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [campuses, setCampuses] = useState([]);
  const [stats, setStats] = useState({
    pins: 0,
    users: 0,
    campuses: 0,
    feedbacks: 0,
    suggestionsAndFeedbacks: 0,
    notifications: 0
  });
  const [popularLocations, setPopularLocations] = useState([]);
  const [feedbackTrends, setFeedbackTrends] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    mongodb: 'checking',
    express: 'checking'
  });
  const [loading, setLoading] = useState(true);

  const CAMPUS_TRAILS_GREEN = '#28a745';
  const CAMPUS_TRAILS_BLUE = '#007bff';
  const CAMPUS_TRAILS_RED = '#dc3545';
  const CAMPUS_TRAILS_YELLOW = '#ffc107';

  useEffect(() => {
    fetchData();
    checkSystemHealth();
    // Refresh system health every 30 seconds
    const healthInterval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(healthInterval);
  }, [selectedCampus]);

  const checkSystemHealth = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      
      // Check Express server
      try {
        const expressRes = await fetch(`${baseUrl}/health`, { timeout: 5000 });
        setSystemHealth(prev => ({ ...prev, express: expressRes.ok ? 'online' : 'offline' }));
      } catch {
        setSystemHealth(prev => ({ ...prev, express: 'offline' }));
      }

      // Check MongoDB (via API)
      try {
        const token = localStorage.getItem('adminToken');
        const mongoRes = await fetch(`${baseUrl}/api/admin/pins?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        setSystemHealth(prev => ({ ...prev, mongodb: mongoRes.ok ? 'online' : 'offline' }));
      } catch {
        setSystemHealth(prev => ({ ...prev, mongodb: 'offline' }));
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');
      
      // Fetch campuses
      const campusesRes = await campusesAPI.getAll();
      const campusesData = campusesRes.data?.campuses || campusesRes.data || [];
      setCampuses(campusesData);

      // Build query params
      const campusQuery = selectedCampus !== 'all' ? `&campusId=${selectedCampus}` : '';

      // Fetch all data
      const [pinsRes, usersRes, feedbacksRes, suggestionsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/pins?limit=1000&includeInvisible=true${campusQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        usersAPI.getAll({ limit: 1000 }),
        feedbacksAPI.getAll({ limit: 1000 }),
        suggestionsAndFeedbacksAPI.getAll({ limit: 1000 })
      ]);

      const pins = pinsRes.pins || pinsRes.data || [];
      const users = usersRes.data?.users || usersRes.data || [];
      const feedbacks = feedbacksRes.data?.feedbacks || feedbacksRes.data || [];
      const suggestions = suggestionsRes.data?.suggestions || suggestionsRes.data || [];

      // Calculate stats
      setStats({
        pins: pins.length,
        users: users.length,
        campuses: campusesData.length,
        feedbacks: feedbacks.filter(f => f.feedbackType === 'report').length,
        suggestionsAndFeedbacks: suggestions.length + feedbacks.filter(f => f.feedbackType === 'suggestion').length,
        notifications: 0 // Will be fetched separately if needed
      });

      // Calculate popular locations (by saved pins count)
      const pinSavedCounts = {};
      users.forEach(user => {
        if (user.activity?.savedPins) {
          user.activity.savedPins.forEach(savedPin => {
            const pinId = savedPin.id || savedPin.pinId || savedPin._id;
            if (pinId) {
              pinSavedCounts[pinId] = (pinSavedCounts[pinId] || 0) + 1;
            }
          });
        }
      });

      // Map to pin titles
      const popularData = pins
        .filter(pin => pin.isVisible !== false) // Only visible pins
        .map(pin => {
          const pinId = pin.id || pin._id;
          return {
            name: pin.title || 'Unknown',
            savedCount: pinSavedCounts[pinId] || 0,
            searchCount: 0, // Placeholder - would need search tracking
            pathfindingCount: 0 // Placeholder - would need pathfinding tracking
          };
        })
        .sort((a, b) => (b.savedCount + b.searchCount + b.pathfindingCount) - (a.savedCount + a.searchCount + a.pathfindingCount))
        .slice(0, 10);

      setPopularLocations(popularData);

      // Calculate feedback trends (last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const trendsData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const reports = feedbacks.filter(f => {
          const createdAt = new Date(f.createdAt);
          return f.feedbackType === 'report' && createdAt >= dayStart && createdAt <= dayEnd;
        }).length;
        
        const appFeedback = suggestions.filter(s => {
          const createdAt = new Date(s.createdAt);
          return createdAt >= dayStart && createdAt <= dayEnd;
        }).length;

        trendsData.push({
          date: dateStr,
          'Facility Reports': reports,
          'User App Feedback': appFeedback
        });
      }

      setFeedbackTrends(trendsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Engagement Analytics</h1>
        <div className="campus-selector">
          <label>Active Campus Overview:</label>
          <select 
            value={selectedCampus} 
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="campus-dropdown"
          >
            <option value="all">All Campuses</option>
            {campuses.map(campus => (
              <option key={campus._id} value={campus._id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* System Health */}
      <div className="dashboard-section">
        <h2>System Health</h2>
        <div className="system-health-grid">
          <div className={`health-card ${systemHealth.mongodb === 'online' ? 'online' : 'offline'}`}>
            <div className="health-indicator"></div>
            <div>
              <h3>MongoDB Atlas</h3>
              <p>{systemHealth.mongodb === 'online' ? '✓ Online' : '✗ Offline'}</p>
            </div>
          </div>
          <div className={`health-card ${systemHealth.express === 'online' ? 'online' : 'offline'}`}>
            <div className="health-indicator"></div>
            <div>
              <h3>Express Server</h3>
              <p>{systemHealth.express === 'online' ? '✓ Online' : '✗ Offline'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-section">
        <h2>Quick Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card" style={{ borderTop: `4px solid ${CAMPUS_TRAILS_BLUE}` }}>
            <h3>Total Pins</h3>
            <p className="stat-number">{stats.pins}</p>
          </div>
          <div className="stat-card" style={{ borderTop: `4px solid ${CAMPUS_TRAILS_GREEN}` }}>
            <h3>Total Users</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
          <div className="stat-card" style={{ borderTop: `4px solid ${CAMPUS_TRAILS_YELLOW}` }}>
            <h3>Campuses</h3>
            <p className="stat-number">{stats.campuses}</p>
          </div>
          <div className="stat-card" style={{ borderTop: `4px solid ${CAMPUS_TRAILS_RED}` }}>
            <h3>Facility Reports</h3>
            <p className="stat-number">{stats.feedbacks}</p>
          </div>
          <div className="stat-card" style={{ borderTop: `4px solid #6f42c1` }}>
            <h3>Suggestions & Feedback</h3>
            <p className="stat-number">{stats.suggestionsAndFeedbacks}</p>
          </div>
        </div>
      </div>

      {/* Most Popular Locations */}
      <div className="dashboard-section">
        <h2>Most Popular Locations</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={popularLocations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="savedCount" fill={CAMPUS_TRAILS_GREEN} name="Saved Pins" />
              <Bar dataKey="searchCount" fill={CAMPUS_TRAILS_BLUE} name="Searched" />
              <Bar dataKey="pathfindingCount" fill={CAMPUS_TRAILS_YELLOW} name="Pathfinding Routes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">
          * Search and Pathfinding counts are placeholders. Enable tracking in app to see real data.
        </p>
      </div>

      {/* Feedback Trends */}
      <div className="dashboard-section">
        <h2>Feedback Trends (Last 7 Days)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={feedbackTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Facility Reports" 
                stroke={CAMPUS_TRAILS_RED} 
                strokeWidth={2}
                dot={{ fill: CAMPUS_TRAILS_RED, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="User App Feedback" 
                stroke={CAMPUS_TRAILS_BLUE} 
                strokeWidth={2}
                dot={{ fill: CAMPUS_TRAILS_BLUE, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
