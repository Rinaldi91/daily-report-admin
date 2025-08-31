import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useRef } from "react";

L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl: iconShadow,
});

interface Location {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  address: string;
}

const FlyToLocation = ({ locations }: { locations: Location[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      if (locations.length === 1) {
        const loc = locations[0];
        map.flyTo([loc.lat, loc.lng], 13);
      } else {
        const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [locations, map]);

  return null;
};

const MapComponent = ({
  locations,
  focusLocations,
}: {
  locations: Location[];
  focusLocations: Location[];
}) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (focusLocations.length === 1 && mapRef.current) {
      const { lat, lng, name, address } = focusLocations[0];
      const content = `
        <div style="padding: 8px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background: white; width: 220px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #2563eb;">${name}</h3>
          <p style="margin-top: 6px; font-size: 13px; color: #4b5563; display: flex; align-items: center;">
            📍 ${address}
          </p>
        </div>
      `;
      L.popup().setLatLng([lat, lng]).setContent(content).openOn(mapRef.current);
    }
  }, [focusLocations]);

  return (
    <MapContainer
      center={[-2.5, 118]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]}>
          <Popup>
            <div className="p-2 rounded-lg shadow-md bg-white text-gray-800 w-60">
              <h3 className="font-semibold text-lg text-blue-600">{loc.name}</h3>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <span className="mr-1">📍</span> {loc.address}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {focusLocations.map((loc) => (
        <Circle
          key={`circle-${loc.id}`}
          center={[loc.lat, loc.lng]}
          radius={1000}
          pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2 }}
        />
      ))}

      {focusLocations.length > 0 && (
        <FlyToLocation locations={focusLocations} />
      )}
    </MapContainer>
  );
};

export default MapComponent;
