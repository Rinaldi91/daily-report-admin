'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default center position (Jakarta)
const position: LatLngExpression = [-6.2, 106.8];

export default function Map() {
  return (
    <div className="h-full w-full">
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>Lokasi Anda</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
