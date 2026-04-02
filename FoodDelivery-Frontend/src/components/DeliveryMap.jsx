import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryPersonIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const DeliveryMap = ({ 
  restaurantLocation, 
  deliveryPersonLocation, 
  customerLocation,
  height = '400px',
  zoom = 13
}) => {
  // Determine center point (prioritize delivery person, then restaurant, then customer)
  const center = deliveryPersonLocation || restaurantLocation || customerLocation || [40.7128, -74.0060];

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={[center[0], center[1]]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {restaurantLocation && (
          <Marker position={restaurantLocation} icon={restaurantIcon}>
            <Popup>
              <strong>Restaurant</strong><br />
              Pick-up Location
            </Popup>
          </Marker>
        )}
        
        {deliveryPersonLocation && (
          <Marker position={deliveryPersonLocation} icon={deliveryPersonIcon}>
            <Popup>
              <strong>Delivery Person</strong><br />
              Current Location
            </Popup>
          </Marker>
        )}
        
        {customerLocation && (
          <Marker position={customerLocation} icon={customerIcon}>
            <Popup>
              <strong>Delivery Address</strong><br />
              Your Location
            </Popup>
          </Marker>
        )}
        
        {deliveryPersonLocation && (
          <RecenterMap lat={deliveryPersonLocation[0]} lng={deliveryPersonLocation[1]} />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
