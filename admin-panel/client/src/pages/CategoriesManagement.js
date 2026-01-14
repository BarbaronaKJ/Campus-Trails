import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';

function CategoriesManagement() {
  const [categories, setCategories] = useState([
    { name: 'Commercial Zone', color: '#007bff', icon: '🏪' },
    { name: 'Admin/Operation Zone', color: '#28a745', icon: '🏛️' },
    { name: 'Academic Core Zone', color: '#ffc107', icon: '📚' },
    { name: 'Auxiliary Services Zone', color: '#17a2b8', icon: '🔧' },
    { name: 'Dining', color: '#dc3545', icon: '🍽️' },
    { name: 'Comfort Rooms', color: '#6f42c1', icon: '🚻' },
    { name: 'Research Zones', color: '#e83e8c', icon: '🔬' },
    { name: 'Clinic', color: '#fd7e14', icon: '🏥' },
    { name: 'Parking', color: '#6c757d', icon: '🅿️' },
    { name: 'Security', color: '#343a40', icon: '🛡️' }
  ]);
  const [pins, setPins] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${baseUrl}/api/admin/pins?limit=1000&includeInvisible=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const allPins = data.pins || data.data || [];
      setPins(allPins);
      
      const stats = {};
      allPins.forEach(pin => {
        const category = pin.category || 'Uncategorized';
        stats[category] = (stats[category] || 0) + 1;
      });
      
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePinCategory = async (pinId, newCategory) => {
    try {
      setError('');
      setSuccess('');
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${baseUrl}/api/admin/pins/${pinId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: newCategory })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      setSuccess('Category updated successfully!');
      setEditingPin(null);
      await fetchCategoryStats();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating pin category:', err);
      setError(err.message || 'Failed to update category');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Categories Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <p>Manage the tags used for filtering facilities on the map. Click on a pin to edit its category.</p>
      </div>

      {/* Categories Overview */}
      <div className="card">
        <h2>Categories Overview</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Category Name</th>
              <th>Color</th>
              <th>Pins Count</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, idx) => (
              <tr key={idx}>
                <td style={{ fontSize: '24px', textAlign: 'center' }}>{category.icon}</td>
                <td><strong>{category.name}</strong></td>
                <td>
                  <div style={{ 
                    display: 'inline-block', 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: category.color,
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}></div>
                  <span style={{ marginLeft: '10px' }}>{category.color}</span>
                </td>
                <td>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: category.color
                  }}>
                    {categoryStats[category.name] || 0}
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td></td>
              <td><strong>Uncategorized</strong></td>
              <td>
                <div style={{ 
                  display: 'inline-block', 
                  width: '30px', 
                  height: '30px', 
                  backgroundColor: '#999',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}></div>
                <span style={{ marginLeft: '10px' }}>#999999</span>
              </td>
              <td>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#999'
                }}>
                  {categoryStats['Uncategorized'] || 0}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pins with Category Editing */}
      <div className="card">
        <h2>Edit Pin Categories</h2>
        <p>Click on a pin to change its category.</p>
        {pins.length === 0 ? (
          <p>No pins found.</p>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Pin Title</th>
                  <th>Current Category</th>
                  <th>New Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pins.map(pin => {
                  const pinId = pin._id || pin.id;
                  const isEditing = editingPin === pinId;
                  
                  return (
                    <tr key={pinId}>
                      <td>
                        <strong>{pin.title}</strong>
                        {pin.description && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {pin.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          background: categories.find(c => c.name === pin.category)?.color || '#999',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {pin.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            defaultValue={pin.category || 'Uncategorized'}
                            onChange={(e) => {
                              handleUpdatePinCategory(pinId, e.target.value);
                            }}
                            className="form-group select"
                            style={{ width: '100%', margin: 0 }}
                          >
                            <option value="">Uncategorized</option>
                            {categories.map(cat => (
                              <option key={cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingPin(pinId)}
                            className="btn btn-primary"
                          >
                            Edit Category
                          </button>
                        )}
                      </td>
                      <td>
                        {isEditing && (
                          <button
                            onClick={() => setEditingPin(null)}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesManagement;
