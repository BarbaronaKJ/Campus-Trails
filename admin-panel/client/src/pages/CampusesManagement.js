import React, { useState, useEffect } from 'react';
import { campusesAPI } from '../services/api';

function CampusesManagement() {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', mapImageUrl: '' });

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      const res = await campusesAPI.getAll();
      setCampuses(res.data.campuses);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (formData._id) {
        await campusesAPI.update(formData._id, formData);
      } else {
        await campusesAPI.create(formData);
      }
      setShowModal(false);
      fetchCampuses();
    } catch (error) {
      alert('Error saving campus');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Campuses Management</h1>
      <button onClick={() => { setFormData({ name: '', mapImageUrl: '' }); setShowModal(true); }} className="btn btn-primary">Create</button>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Map Image</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {campuses.map(c => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.mapImageUrl ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => { setFormData(c); setShowModal(true); }} className="btn btn-secondary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{formData._id ? 'Edit' : 'Create'} Campus</h2>
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input placeholder="Map Image URL" value={formData.mapImageUrl} onChange={e => setFormData({ ...formData, mapImageUrl: e.target.value })} />
            <button onClick={handleSave} className="btn btn-primary">Save</button>
            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampusesManagement;
