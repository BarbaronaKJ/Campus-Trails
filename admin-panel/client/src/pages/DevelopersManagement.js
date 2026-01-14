import React, { useState, useEffect } from 'react';
import { developersAPI } from '../services/api';

function DevelopersManagement() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', photo: '', role: 'Developer' });

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const res = await developersAPI.getAll();
      setDevelopers(res.data.developers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (formData._id) {
        await developersAPI.update(formData._id, formData);
      } else {
        await developersAPI.create(formData);
      }
      setShowModal(false);
      fetchDevelopers();
    } catch (error) {
      alert('Error saving developer');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Developers Management</h1>
      <button onClick={() => { setFormData({ name: '', email: '', photo: '', role: 'Developer' }); setShowModal(true); }} className="btn btn-primary">Create</button>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {developers.map(d => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.email}</td>
                <td>{d.role}</td>
                <td>
                  <button onClick={() => { setFormData(d); setShowModal(true); }} className="btn btn-secondary">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{formData._id ? 'Edit' : 'Create'} Developer</h2>
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <input placeholder="Photo URL" value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} />
            <input placeholder="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
            <button onClick={handleSave} className="btn btn-primary">Save</button>
            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevelopersManagement;
