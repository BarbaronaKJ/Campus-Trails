import React, { useState, useEffect } from 'react';
import { pinsAPI } from '../services/api';
import { getApiBaseUrl } from '../utils/apiConfig';

function MediaLibrary() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, buildings, rooms

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${baseUrl}/api/admin/pins?limit=1000&includeInvisible=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPins(data.pins || data.data || []);
    } catch (error) {
      console.error('Error fetching pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractImages = () => {
    const images = [];
    pins.forEach(pin => {
      // Main pin image
      if (pin.image && typeof pin.image === 'string' && pin.image.startsWith('http')) {
        images.push({
          url: pin.image,
          type: 'pin',
          title: pin.title,
          pinId: pin._id || pin.id
        });
      }
      
      // Floor plan images
      if (pin.floors && Array.isArray(pin.floors)) {
        pin.floors.forEach((floor, idx) => {
          if (floor.floorPlan && floor.floorPlan.startsWith('http')) {
            images.push({
              url: floor.floorPlan,
              type: 'floor',
              title: `${pin.title} - Floor ${floor.level === 0 ? 'Ground' : floor.level}`,
              pinId: pin._id || pin.id,
              floorIndex: idx
            });
          }
          
          // Room images
          if (floor.rooms && Array.isArray(floor.rooms)) {
            floor.rooms.forEach((room, roomIdx) => {
              if (room.image && room.image.startsWith('http')) {
                images.push({
                  url: room.image,
                  type: 'room',
                  title: `${pin.title} - ${room.name || 'Room'}`,
                  pinId: pin._id || pin.id,
                  floorIndex: idx,
                  roomIndex: roomIdx
                });
              }
            });
          }
        });
      }
    });
    return images;
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  const allImages = extractImages();
  const filteredImages = filter === 'all' 
    ? allImages 
    : allImages.filter(img => img.type === filter);

  return (
    <div className="container">
      <h1>Media Library</h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p>Centralized view of all building and room photos hosted on Cloudinary.</p>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="form-group select"
            style={{ width: 'auto', margin: 0 }}
          >
            <option value="all">All Images</option>
            <option value="pin">Building Images</option>
            <option value="floor">Floor Plans</option>
            <option value="room">Room Images</option>
          </select>
        </div>
        <p><strong>Total Images:</strong> {allImages.length} | <strong>Showing:</strong> {filteredImages.length}</p>
      </div>
      <div className="card">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredImages.map((img, idx) => (
            <div key={idx} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={img.url} 
                alt={img.title}
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/250x200?text=Image+Not+Found';
                }}
              />
              <div style={{ padding: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px' }}>
                  {img.title}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Type: {img.type}
                </p>
                <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: '10px', display: 'inline-block', fontSize: '12px', padding: '5px 10px' }}
                >
                  View Full Size
                </a>
              </div>
            </div>
          ))}
        </div>
        {filteredImages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No images found for the selected filter.
          </p>
        )}
      </div>
    </div>
  );
}

export default MediaLibrary;
