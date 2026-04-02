import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const AddressPicker = ({ onLocationSelect, initialPosition = null }) => {
  const [position, setPosition] = useState(initialPosition || [40.7128, -74.0060]);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (position) {
      // Reverse geocoding (you can use a free service like Nominatim)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`)
        .then(res => res.json())
        .then(data => {
          setAddress(data.display_name);
          onLocationSelect({
            latitude: position[0],
            longitude: position[1],
            address: data.display_name,
            city: data.address?.city || data.address?.town || '',
            state: data.address?.state || '',
            postalCode: data.address?.postcode || '',
            country: data.address?.country || ''
          });
        })
        .catch(err => console.error('Geocoding error:', err));
    }
  }, [position]);

  return (
    <div>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '8px', marginBottom: '10px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      {address && (
        <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected Address:</strong><br />
          {address}
        </div>
      )}
    </div>
  );
};

export default AddressPicker;
