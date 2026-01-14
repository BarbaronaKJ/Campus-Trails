import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { getApiBaseUrl } from '../utils/apiConfig';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch users (students)
      const usersRes = await usersAPI.getAll({ limit: 1000 });
      const allUsers = usersRes.data?.users || usersRes.data || [];
      
      // Separate users and admins
      const students = allUsers.filter(u => u.role === 'student' || !u.role);
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      
      setUsers(students);
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isAdmin = false) => {
    const type = isAdmin ? 'admin' : 'user';
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');
      
      // Delete from appropriate collection
      const endpoint = isAdmin 
        ? `${baseUrl}/api/admin/admins/${id}`
        : `${baseUrl}/api/admin/users/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      setError(`Failed to delete ${type}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRoleChange = async (id, currentRole, newRole) => {
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>User Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #28a745', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'users' ? '#28a745' : 'transparent',
              color: activeTab === 'users' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal',
              borderBottom: activeTab === 'users' ? '3px solid #28a745' : '3px solid transparent'
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'admins' ? '#28a745' : 'transparent',
              color: activeTab === 'admins' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'admins' ? 'bold' : 'normal',
              borderBottom: activeTab === 'admins' ? '3px solid #28a745' : '3px solid transparent'
            }}
          >
            Admins ({admins.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <h2>Students/Users</h2>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>{user.username || 'N/A'}</td>
                      <td>
                        <select
                          value={user.role || 'student'}
                          onChange={(e) => handleRoleChange(user._id, user.role, e.target.value)}
                          className="form-group select"
                          style={{ width: 'auto', margin: 0 }}
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(user._id, false)} 
                          className="btn btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="card">
            <h2>Administrators</h2>
            {admins.length === 0 ? (
              <p>No admins found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin._id}>
                      <td>{admin.email}</td>
                      <td>{admin.username || 'N/A'}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: '#28a745', 
                          color: 'white', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {admin.role}
                        </span>
                      </td>
                      <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(admin._id, true)} 
                          className="btn btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersManagement;
