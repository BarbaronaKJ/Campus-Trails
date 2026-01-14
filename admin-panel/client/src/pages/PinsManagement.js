import React, { useState, useEffect } from 'react';
import { pinsAPI, campusesAPI } from '../services/api';

function PinsManagement() {
  const [pins, setPins] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [formData, setFormData] = useState({
    campusId: '',
    id: '',
    x: 0,
    y: 0,
    title: '',
    description: '',
    category: 'Other',
    pinType: 'facility',
    isVisible: true,
    qrCode: '',
    image: ''
  });
  const [filters, setFilters] = useState({ campusId: '', pinType: '', search: '' });

  useEffect(() => {
    fetchCampuses();
    fetchPins();
  }, [filters]);

  const fetchCampuses = async () => {
    try {
      const res = await campusesAPI.getAll();
      setCampuses(res.data.campuses);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchPins = async () => {
    try {
      const params = { page: 1, limit: 100 };
      if (filters.campusId) params.campusId = filters.campusId;
      if (filters.pinType) params.pinType = filters.pinType;
      if (filters.search) params.search = filters.search;

      const res = await pinsAPI.getAll(params);
      setPins(res.data.pins);
    } catch (error) {
      console.error('Error fetching pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pin) => {
    setEditingPin(pin);
    setFormData({
      campusId: pin.campusId?._id || pin.campusId || '',
      id: pin.id,
      x: pin.x,
      y: pin.y,
      title: pin.title,
      description: pin.description || '',
      category: pin.category || 'Other',
      pinType: pin.pinType || 'facility',
      isVisible: pin.isVisible !== false,
      qrCode: pin.qrCode || '',
      image: pin.image || ''
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPin(null);
    setFormData({
      campusId: '',
      id: '',
      x: 0,
      y: 0,
      title: '',
      description: '',
      category: 'Other',
      pinType: 'facility',
      isVisible: true,
      qrCode: '',
      image: ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPin) {
        await pinsAPI.update(editingPin._id, formData);
      } else {
        await pinsAPI.create(formData);
      }
      setShowModal(false);
      fetchPins();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving pin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pin?')) return;
    try {
      await pinsAPI.delete(id);
      fetchPins();
    } catch (error) {
      alert('Error deleting pin');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Pins Management</h1>
        <button onClick={handleCreate} className="btn btn-primary">Create Pin</button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label>Campus</label>
            <select
              value={filters.campusId}
              onChange={(e) => setFilters({ ...filters, campusId: e.target.value })}
            >
              <option value="">All</option>
              {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              value={filters.pinType}
              onChange={(e) => setFilters({ ...filters, pinType: e.target.value })}
            >
              <option value="">All</option>
              <option value="facility">Facility</option>
              <option value="waypoint">Waypoint</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search pins..."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Campus</th>
              <th>Type</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pins.map(pin => (
              <tr key={pin._id}>
                <td>{pin.id}</td>
                <td>{pin.title}</td>
                <td>{pin.campusId?.name || 'N/A'}</td>
                <td>{pin.pinType}</td>
                <td>{pin.isVisible ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleEdit(pin)} className="btn btn-secondary" style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDelete(pin._id)} className="btn btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPin ? 'Edit Pin' : 'Create Pin'}</h2>
              <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            </div>
            <div className="form-group">
              <label>Campus *</label>
              <select
                value={formData.campusId}
                onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                required
              >
                <option value="">Select Campus</option>
                {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Pin ID *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>X Coordinate</label>
              <input
                type="number"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Y Coordinate</label>
              <input
                type="number"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.pinType}
                onChange={(e) => setFormData({ ...formData, pinType: e.target.value })}
              >
                <option value="facility">Facility</option>
                <option value="waypoint">Waypoint</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                /> Visible
              </label>
            </div>
            <div className="form-group">
              <label>QR Code</label>
              <input
                type="text"
                value={formData.qrCode}
                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleSave} className="btn btn-primary">Save</button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PinsManagement;
