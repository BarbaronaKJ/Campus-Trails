import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import { campusesAPI } from '../services/api';
import './FloorPlans.css';

function FloorPlans() {
  const [pins, setPins] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFloor, setEditingFloor] = useState(null); // { pinId, floorIndex }
  const [editingRoom, setEditingRoom] = useState(null); // { pinId, floorIndex, roomIndex }

  useEffect(() => {
    fetchData();
  }, [selectedCampus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Please log in to access this page.');
        setLoading(false);
        return;
      }

      const [pinsResponse, campusesResponse] = await Promise.all([
        fetch(`${baseUrl}/api/admin/pins?limit=1000&includeInvisible=false`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        campusesAPI.getAll()
      ]);

      if (!pinsResponse.ok) {
        throw new Error('Failed to fetch pins');
      }

      const pinsData = await pinsResponse.json();
      let allPins = pinsData.pins || pinsData.data || [];
      
      // Filter by campus if selected
      if (selectedCampus !== 'all') {
        allPins = allPins.filter(pin => 
          pin.campusId?._id === selectedCampus || 
          pin.campusId === selectedCampus ||
          (typeof pin.campusId === 'object' && pin.campusId._id === selectedCampus)
        );
      }

      // Filter by search query
      if (searchQuery) {
        allPins = allPins.filter(pin =>
          pin.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pin.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setPins(allPins);

      const campusesData = campusesResponse.data?.campuses || campusesResponse.data || [];
      setCampuses(campusesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFloor = (pinId) => {
    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin) return;

    const newFloor = {
      level: pin.floors?.length || 0,
      floorPlan: '',
      rooms: []
    };

    updatePinFloors(pinId, [...(pin.floors || []), newFloor]);
  };

  const handleUpdateFloor = (pinId, floorIndex, updatedFloor) => {
    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin) return;

    const updatedFloors = [...(pin.floors || [])];
    updatedFloors[floorIndex] = { ...updatedFloors[floorIndex], ...updatedFloor };
    updatePinFloors(pinId, updatedFloors);
  };

  const handleDeleteFloor = (pinId, floorIndex) => {
    if (!window.confirm('Are you sure you want to delete this floor? All rooms in this floor will also be deleted.')) {
      return;
    }

    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin) return;

    const updatedFloors = [...(pin.floors || [])];
    updatedFloors.splice(floorIndex, 1);
    updatePinFloors(pinId, updatedFloors);
  };

  const handleAddRoom = (pinId, floorIndex) => {
    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin || !pin.floors || !pin.floors[floorIndex]) return;

    const newRoom = {
      name: '',
      image: '',
      description: ''
    };

    const updatedFloors = [...pin.floors];
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      rooms: [...(updatedFloors[floorIndex].rooms || []), newRoom]
    };

    updatePinFloors(pinId, updatedFloors);
  };

  const handleUpdateRoom = (pinId, floorIndex, roomIndex, updatedRoom) => {
    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin || !pin.floors || !pin.floors[floorIndex]) return;

    const updatedFloors = [...pin.floors];
    const updatedRooms = [...(updatedFloors[floorIndex].rooms || [])];
    updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], ...updatedRoom };
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      rooms: updatedRooms
    };

    updatePinFloors(pinId, updatedFloors);
  };

  const handleDeleteRoom = (pinId, floorIndex, roomIndex) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    const pin = pins.find(p => (p._id || p.id) === pinId);
    if (!pin || !pin.floors || !pin.floors[floorIndex]) return;

    const updatedFloors = [...pin.floors];
    const updatedRooms = [...(updatedFloors[floorIndex].rooms || [])];
    updatedRooms.splice(roomIndex, 1);
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      rooms: updatedRooms
    };

    updatePinFloors(pinId, updatedFloors);
  };

  const updatePinFloors = async (pinId, floors) => {
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
        body: JSON.stringify({ floors })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update pin');
      }

      setSuccess('Floor/room details updated successfully!');
      setEditingFloor(null);
      setEditingRoom(null);
      await fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating pin:', err);
      setError(err.message || 'Failed to update pin');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getFloorName = (level) => {
    if (level === 0) return 'Ground Floor';
    const floorNumber = level + 1;
    const lastDigit = floorNumber % 10;
    const lastTwoDigits = floorNumber % 100;
    let suffix = 'th';
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      suffix = 'th';
    } else if (lastDigit === 1) {
      suffix = 'st';
    } else if (lastDigit === 2) {
      suffix = 'nd';
    } else if (lastDigit === 3) {
      suffix = 'rd';
    }
    return `${floorNumber}${suffix} Floor`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading floor plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Floor Plans Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label>Campus</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="form-group select"
            >
              <option value="all">All Campuses</option>
              {campuses.map(campus => (
                <option key={campus._id} value={campus._id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <label>Search Pins</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-group input"
            />
          </div>
        </div>
      </div>

      {/* Pins List */}
      <div className="card">
        <h2>Visible Pins ({pins.length})</h2>
        {pins.length === 0 ? (
          <p>No visible pins found.</p>
        ) : (
          <div className="pins-list">
            {pins.map(pin => {
              const pinId = pin._id || pin.id;
              const floors = pin.floors || [];
              
              return (
                <div key={pinId} className="pin-card">
                  <div className="pin-header">
                    <div>
                      <h3>{pin.title}</h3>
                      <p className="pin-description">{pin.description}</p>
                      <p className="pin-meta">
                        Campus: {pin.campusId?.name || 'Unknown'} | 
                        Floors: {floors.length} | 
                        Total Rooms: {floors.reduce((sum, floor) => sum + (floor.rooms?.length || 0), 0)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPin(selectedPin === pinId ? null : pinId)}
                      className="btn btn-primary"
                    >
                      {selectedPin === pinId ? 'Hide Details' : 'Manage Floors'}
                    </button>
                  </div>

                  {selectedPin === pinId && (
                    <div className="floors-section">
                      <div className="floors-header">
                        <h4>Floors & Rooms</h4>
                        <button
                          onClick={() => handleAddFloor(pinId)}
                          className="btn btn-success"
                        >
                          + Add Floor
                        </button>
                      </div>

                      {floors.length === 0 ? (
                        <p className="no-floors">No floors defined. Click "Add Floor" to get started.</p>
                      ) : (
                        floors.map((floor, floorIndex) => (
                          <div key={floorIndex} className="floor-card">
                            <div className="floor-header">
                              <h5>{getFloorName(floor.level)}</h5>
                              <div>
                                <button
                                  onClick={() => setEditingFloor(editingFloor?.pinId === pinId && editingFloor?.floorIndex === floorIndex ? null : { pinId, floorIndex })}
                                  className="btn btn-secondary"
                                >
                                  {editingFloor?.pinId === pinId && editingFloor?.floorIndex === floorIndex ? 'Cancel' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => handleDeleteFloor(pinId, floorIndex)}
                                  className="btn btn-danger"
                                  style={{ marginLeft: '10px' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {editingFloor?.pinId === pinId && editingFloor?.floorIndex === floorIndex ? (
                              <div className="floor-edit-form">
                                <div className="form-group">
                                  <label>Floor Level</label>
                                  <input
                                    type="number"
                                    value={floor.level}
                                    onChange={(e) => handleUpdateFloor(pinId, floorIndex, { level: parseInt(e.target.value) || 0 })}
                                    className="form-group input"
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Floor Plan Image URL</label>
                                  <input
                                    type="text"
                                    value={floor.floorPlan || ''}
                                    onChange={(e) => handleUpdateFloor(pinId, floorIndex, { floorPlan: e.target.value })}
                                    placeholder="https://..."
                                    className="form-group input"
                                  />
                                  {floor.floorPlan && (
                                    <img
                                      src={floor.floorPlan}
                                      alt={`Floor ${floor.level} plan`}
                                      className="floor-plan-preview"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  )}
                                </div>
                                <button
                                  onClick={() => setEditingFloor(null)}
                                  className="btn btn-primary"
                                >
                                  Save Changes
                                </button>
                              </div>
                            ) : (
                              <>
                                {floor.floorPlan && (
                                  <div className="floor-plan-display">
                                    <img
                                      src={floor.floorPlan}
                                      alt={`Floor ${floor.level} plan`}
                                      className="floor-plan-image"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  </div>
                                )}
                                <div className="rooms-section">
                                  <div className="rooms-header">
                                    <h6>Rooms ({floor.rooms?.length || 0})</h6>
                                    <button
                                      onClick={() => handleAddRoom(pinId, floorIndex)}
                                      className="btn btn-success"
                                    >
                                      + Add Room
                                    </button>
                                  </div>
                                  {floor.rooms && floor.rooms.length > 0 ? (
                                    <div className="rooms-list">
                                      {floor.rooms.map((room, roomIndex) => (
                                        <div key={roomIndex} className="room-card">
                                          {editingRoom?.pinId === pinId && 
                                           editingRoom?.floorIndex === floorIndex && 
                                           editingRoom?.roomIndex === roomIndex ? (
                                            <div className="room-edit-form">
                                              <div className="form-group">
                                                <label>Room Name *</label>
                                                <input
                                                  type="text"
                                                  value={room.name}
                                                  onChange={(e) => handleUpdateRoom(pinId, floorIndex, roomIndex, { name: e.target.value })}
                                                  className="form-group input"
                                                  required
                                                />
                                              </div>
                                              <div className="form-group">
                                                <label>Room Image URL</label>
                                                <input
                                                  type="text"
                                                  value={room.image || ''}
                                                  onChange={(e) => handleUpdateRoom(pinId, floorIndex, roomIndex, { image: e.target.value })}
                                                  placeholder="https://..."
                                                  className="form-group input"
                                                />
                                                {room.image && (
                                                  <img
                                                    src={room.image}
                                                    alt={room.name}
                                                    className="room-image-preview"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                  />
                                                )}
                                              </div>
                                              <div className="form-group">
                                                <label>Description</label>
                                                <textarea
                                                  value={room.description || ''}
                                                  onChange={(e) => handleUpdateRoom(pinId, floorIndex, roomIndex, { description: e.target.value })}
                                                  className="form-group textarea"
                                                  rows="3"
                                                />
                                              </div>
                                              <div>
                                                <button
                                                  onClick={() => setEditingRoom(null)}
                                                  className="btn btn-primary"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteRoom(pinId, floorIndex, roomIndex)}
                                                  className="btn btn-danger"
                                                  style={{ marginLeft: '10px' }}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="room-content">
                                                {room.image && (
                                                  <img
                                                    src={room.image}
                                                    alt={room.name}
                                                    className="room-image"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                  />
                                                )}
                                                <div className="room-info">
                                                  <h6>{room.name}</h6>
                                                  {room.description && <p>{room.description}</p>}
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => setEditingRoom({ pinId, floorIndex, roomIndex })}
                                                className="btn btn-secondary"
                                              >
                                                Edit
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-rooms">No rooms defined for this floor.</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FloorPlans;
