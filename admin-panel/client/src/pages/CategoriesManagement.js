import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';

function CategoriesManagement() {
  // Predefined categories (for reference, but actual categories come from pins)
  const [predefinedCategories] = useState([
    { name: 'Commercial Zone', color: '#007bff', icon: '🏪' },
    { name: 'Admin/Operation Zone', color: '#28a745', icon: '🏛️' },
    { name: 'Academic Core Zone', color: '#ffc107', icon: '📚' },
    { name: 'Auxiliary Services Zone', color: '#17a2b8', icon: '🔧' },
    { name: 'Dining', color: '#dc3545', icon: '🍽️' },
    { name: 'Comfort Rooms', color: '#6f42c1', icon: '🚻' },
    { name: 'Research Zones', color: '#e83e8c', icon: '🔬' },
    { name: 'Clinic', color: '#fd7e14', icon: '🏥' },
    { name: 'Parking', color: '#6c757d', icon: '🅿️' },
    { name: 'Security', color: '#343a40', icon: '🛡️' },
    { name: 'Amenities', color: '#20c997', icon: '🛋️' }
  ]);

  const [pins, setPins] = useState([]);
  const [filteredPins, setFilteredPins] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [actualCategories, setActualCategories] = useState([]); // Categories found in pins
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // all, visible, invisible
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or specific category name
  const [searchQuery, setSearchQuery] = useState(''); // Search by title/description

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pins, visibilityFilter, categoryFilter, searchQuery]);

  const applyFilters = () => {
    let filtered = [...pins];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pin =>
        pin.title?.toLowerCase().includes(query) ||
        pin.description?.toLowerCase().includes(query) ||
        (pin.category || '').toLowerCase().includes(query)
      );
    }

    // Filter by visibility
    if (visibilityFilter === 'visible') {
      filtered = filtered.filter(pin => pin.isVisible !== false);
    } else if (visibilityFilter === 'invisible') {
      filtered = filtered.filter(pin => pin.isVisible === false);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'Uncategorized') {
        filtered = filtered.filter(pin => !pin.category || pin.category === '');
      } else {
        filtered = filtered.filter(pin => pin.category === categoryFilter);
      }
    }

    setFilteredPins(filtered);
  };

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
      
      // Calculate stats and get all actual categories from pins
      const stats = {};
      const categorySet = new Set();
      
      allPins.forEach(pin => {
        const category = pin.category || 'Uncategorized';
        stats[category] = (stats[category] || 0) + 1;
        if (category !== 'Uncategorized') {
          categorySet.add(category);
        }
      });
      
      // Create category list with colors from predefined or defaults
      const categoriesList = Array.from(categorySet).map(catName => {
        const predefined = predefinedCategories.find(c => c.name === catName);
        if (predefined) {
          return predefined;
        }
        // Generate a color for categories not in predefined list
        const hash = catName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
        return {
          name: catName,
          color: colors[hash % colors.length],
          icon: '🏷️'
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      setActualCategories(categoriesList);
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

  const getCategoryInfo = (categoryName) => {
    if (!categoryName) {
      return { color: '#999', icon: '❓' };
    }
    const predefined = predefinedCategories.find(c => c.name === categoryName);
    if (predefined) {
      return { color: predefined.color, icon: predefined.icon };
    }
    const actual = actualCategories.find(c => c.name === categoryName);
    if (actual) {
      return { color: actual.color, icon: actual.icon };
    }
    // Default for unknown categories
    const hash = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
    return {
      color: colors[hash % colors.length],
      icon: '🏷️'
    };
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  // Get unique categories from pins for filter dropdown (including Uncategorized)
  const availableCategories = ['all', ...actualCategories.map(c => c.name), 'Uncategorized'];

  // Combine predefined and actual categories for display (remove duplicates)
  const allDisplayCategories = [...predefinedCategories, ...actualCategories.filter(ac => 
    !predefinedCategories.find(pc => pc.name === ac.name)
  )];

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
        <p>Showing all categories found in pins ({actualCategories.length + (categoryStats['Uncategorized'] ? 1 : 0)} total)</p>
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
            {/* Show actual categories from pins first */}
            {actualCategories.map((category) => (
              <tr key={category.name}>
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
            {/* Show Uncategorized if there are any */}
            {categoryStats['Uncategorized'] > 0 && (
              <tr>
                <td style={{ fontSize: '24px', textAlign: 'center' }}>❓</td>
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
            )}
            {actualCategories.length === 0 && (!categoryStats['Uncategorized'] || categoryStats['Uncategorized'] === 0) && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No categories found in pins
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filters */}
      <div className="card">
        <h2>Filters</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label>Search Pins</label>
            <input
              type="text"
              placeholder="Search by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-group input"
            />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label>Pin Visibility</label>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="form-group select"
            >
              <option value="all">All Pins</option>
              <option value="visible">Visible Pins Only</option>
              <option value="invisible">Invisible Pins (Waypoints) Only</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label>Category Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-group select"
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '200px', paddingTop: '25px' }}>
            <strong>Showing: {filteredPins.length} of {pins.length} pins</strong>
          </div>
        </div>
      </div>

      {/* Pins with Category Editing */}
      <div className="card">
        <h2>Edit Pin Categories</h2>
        <p>
          Click on a pin to change its category.
          {searchQuery && ` Search: "${searchQuery}"`}
          {visibilityFilter !== 'all' && ` | Visibility: ${visibilityFilter}`}
          {categoryFilter !== 'all' && ` | Category: ${categoryFilter}`}
        </p>
        {filteredPins.length === 0 ? (
          <p>No pins found matching the current filters.</p>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Pin Title</th>
                  <th>Visibility</th>
                  <th>Current Category</th>
                  <th>New Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPins.map(pin => {
                  const pinId = pin._id || pin.id;
                  const isEditing = editingPin === pinId;
                  const categoryInfo = getCategoryInfo(pin.category);
                  
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
                          background: pin.isVisible === false ? '#ff9800' : '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {pin.isVisible === false ? 'Waypoint' : 'Visible'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          background: categoryInfo.color,
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
                            {/* Show all actual categories plus predefined ones that might not be used yet */}
                            {[...actualCategories, ...predefinedCategories.filter(pc => 
                              !actualCategories.find(ac => ac.name === pc.name)
                            )].map(cat => (
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
