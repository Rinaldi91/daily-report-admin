"use client";

import { useEffect, useState, useRef } from "react";
import MultiSelectPopover from "./ui/MultiSelectPopover";
import type * as Leaflet from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import {
  XCircle,
  MapPin,
  Building,
  Package,
  MonitorSmartphone,
} from "lucide-react";
import ReactDOMServer from "react-dom/server";

interface MedicalDevice {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  category: string;
}

interface Location {
  id: number;
  name: string;
  city: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  total_devices: number;
  medical_devices: MedicalDevice[];
}

const INITIAL_CENTER: [number, number] = [-2.5, 118];
const INITIAL_ZOOM = 5;

// Function to get status color
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "baik":
      return "text-green-600 bg-green-50 border-green-200";
    case "rusak":
      return "text-red-600 bg-red-50 border-red-200";
    case "maintenance":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

// Function to get facility type color
const getFacilityTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case "rumah sakit":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "puskesmas":
      return "text-green-600 bg-green-50 border-green-200";
    case "laboratorium klinik":
      return "text-purple-600 bg-purple-50 border-purple-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

// Enhanced Popup Content Component
const PopupContent = ({ location }: { location: Location }) => (
  <div className="max-w-md w-full">
    {/* Header Section */}
    <div className="border-b border-gray-200 pb-3 mb-3">
      <span
        className={`px-2 py-2 rounded-full text-xs font-medium border ${getFacilityTypeColor(
          location.type
        )}`}
      >
        {location.type}
      </span>
      <div className="flex items-start justify-between gap-2 mb-2 mt-3">
        <h3 className="font-bold text-lg text-gray-900 leading-tight">
          {location.name}
        </h3>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <Building className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">{location.city}</span>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {location.address || "Alamat tidak tersedia"}
        </span>
      </div>
    </div>

    {/* Devices Summary */}
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-gray-800">
          Total Medical Device: {location.total_devices}
        </span>
      </div>
    </div>

    {/* Medical Devices List */}
    {location.medical_devices && location.medical_devices.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MonitorSmartphone className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-800">
            List Medical Devices:
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2">
          {location.medical_devices.map((device, index) => (
            <div
              key={device.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {device.brand} {device.model}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    S/N: {device.serial_number}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(
                    device.status
                  )}`}
                >
                  {device.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-200">
                  {device.category}
                </span>
                <span className="text-xs text-gray-500">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Auto zoom component
const FlyAndReset = ({
  locations,
  L,
}: {
  locations: Location[];
  L: typeof Leaflet;
}) => {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      if (locations.length === 1) {
        const loc = locations[0];
        map.flyTo([loc.lat, loc.lng], 13);
      } else {
        const bounds = L.latLngBounds(
          locations.map((l) => [l.lat, l.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      map.flyTo(INITIAL_CENTER, INITIAL_ZOOM);
    }
  }, [locations, map, L]);

  return null;
};

// Component untuk handle popup berdasarkan selection
const PopupHandler = ({
  focusLocations,
  L,
}: {
  focusLocations: Location[];
  L: typeof Leaflet;
}) => {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  const popupRefs = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!map || !L) return;

    // Clear semua popup yang ada
    map.closePopup();
    popupRefs.current.forEach((popup) => {
      map.removeLayer(popup);
    });
    popupRefs.current.clear();

    // Jika tidak ada selection, tidak perlu buka popup
    if (focusLocations.length === 0) {
      return;
    }

    // Jika hanya satu lokasi, buka popup seperti biasa
    if (focusLocations.length === 1) {
      const location = focusLocations[0];
      const popupHtml = ReactDOMServer.renderToString(
        <PopupContent location={location} />
      );

      const popup = L.popup()
        .setLatLng([location.lat, location.lng])
        .setContent(popupHtml)
        .openOn(map);

      popupRefs.current.set(location.id, popup);
    } else {
      // Jika lebih dari satu lokasi, buka popup untuk semua lokasi yang dipilih
      focusLocations.forEach((location, index) => {
        const popupHtml = ReactDOMServer.renderToString(
          <PopupContent location={location} />
        );

        const popup = L.popup()
          .setLatLng([location.lat, location.lng])
          .setContent(popupHtml);

        // Tambahkan popup ke map tapi jangan langsung buka
        popup.addTo(map);

        // Buka popup dengan delay untuk menghindari konflik
        setTimeout(() => {
          popup.openOn(map);
        }, index * 100);

        popupRefs.current.set(location.id, popup);
      });
    }

    // Cleanup function
    return () => {
      popupRefs.current.forEach((popup) => {
        if (map.hasLayer(popup)) {
          map.removeLayer(popup);
        }
      });
      popupRefs.current.clear();
    };
  }, [focusLocations, map, L]);

  return null;
};

const IndonesiaMap: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<
    { value: string | number; label: string }[]
  >([]);
  const [showFilter, setShowFilter] = useState(false);

  const [cityOptions, setCityOptions] = useState<
    { value: string | number; label: string }[]
  >([]);
  const [selectedCities, setSelectedCities] = useState<
    { value: string | number; label: string }[]
  >([]);

  // Debug states untuk troubleshooting
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);

  const fetchCities = async () => {
    try {
      setCityLoading(true);
      setCityError(null);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_API;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_BASE_URL_API is not defined in .env");
      }

      const res = await fetch(`${baseUrl}/api/health-facility/city`);
      if (!res.ok) {
        throw new Error(`Failed fetch cities: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      console.log("Cities API response:", json);

      const rawData = json.data || json; // fallback kalau API tidak ada json.status
      if (Array.isArray(rawData)) {
        const validCities = rawData
          .map((item: { city: string }) => item.city)
          .filter((city: string) => city && city.trim() !== "" && city !== "-")
          .sort();

        setCityOptions(
          validCities.map((city) => ({ value: city, label: city }))
        );
      } else {
        throw new Error("Invalid response format: data is not an array");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Failed to fetch city list:", errorMessage, err);
      setCityError(errorMessage);
    } finally {
      setCityLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const filteredByCity =
    selectedCities.length > 0
      ? locations.filter((l) => selectedCities.some((s) => s.value === l.city))
      : locations;

  const handleSelectChange = (
    newSelected: { value: string | number; label: string }[]
  ) => {
    setSelected(newSelected);
    if (newSelected.length > 0) {
      setShowFilter(false);
    }
  };

  const [isClient, setIsClient] = useState(false);
  const [leafletComponents, setLeafletComponents] = useState<
    null | typeof import("react-leaflet")
  >(null);
  const [L, setL] = useState<null | typeof Leaflet>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import Leaflet only on client side
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        try {
          const [leafletModule, reactLeafletModule] = await Promise.all([
            import("leaflet"),
            import("react-leaflet"),
          ]);

          // Import CSS
          await import("leaflet/dist/leaflet.css" as string);

          // Fix icon loading
          const iconUrl = new URL(
            "leaflet/dist/images/marker-icon.png",
            import.meta.url
          ).toString();
          const iconRetinaUrl = new URL(
            "leaflet/dist/images/marker-icon-2x.png",
            import.meta.url
          ).toString();
          const shadowUrl = new URL(
            "leaflet/dist/images/marker-shadow.png",
            import.meta.url
          ).toString();

          leafletModule.Icon.Default.mergeOptions({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
          });

          setL(leafletModule);
          setLeafletComponents(reactLeafletModule);
        } catch (error) {
          console.error("Error loading Leaflet:", error);
        }
      }
    };

    loadLeaflet();
    fetchHealthFacilities();
  }, []);

  const fetchHealthFacilities = async () => {
    try {
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_API;
      const res = await fetch(`${baseUrl}/api/health-facility-location`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      console.log("API Response:", json);
      console.log("Total facilities from API:", json.data?.length || 0);

      if (!json.data || !Array.isArray(json.data)) {
        throw new Error("Invalid response format: data is not an array");
      }

      const transformed: Location[] = json.data
        .filter((f: any) => {
          const hasValidCoords =
            f.lat &&
            f.lng &&
            !isNaN(parseFloat(f.lat)) &&
            !isNaN(parseFloat(f.lng));
          if (!hasValidCoords) {
            console.warn(
              "Skipping facility with invalid coordinates:",
              f.name,
              f.lat,
              f.lng
            );
          }
          return hasValidCoords;
        })
        .map(
          (f: {
            id: number;
            name: string;
            city: string;
            type: string;
            lat: string;
            lng: string;
            address?: string;
            total_devices: number;
            medical_devices: MedicalDevice[];
          }) => ({
            id: f.id,
            name: f.name,
            city: f.city || "Unknown City",
            type: f.type || "Unknown Type",
            lat: parseFloat(f.lat),
            lng: parseFloat(f.lng),
            address: f.address,
            total_devices: f.total_devices || 0,
            medical_devices: f.medical_devices || [],
          })
        );

      console.log("Total facilities after transformation:", transformed.length);
      console.log(
        "Filtered out facilities:",
        json.data.length - transformed.length
      );

      setLocations(transformed);
    } catch (err) {
      console.error("Failed fetch health facilities", err);
    } finally {
      setIsLoading(false);
    }
  };

  const options = locations.map((l) => ({
    label: `${l.name} (${l.city})`,
    value: l.id,
  }));

  const focusLocations = filteredByCity.filter((l) =>
    selected.some((s) => s.value === l.id)
  );

  const displayLocations =
    selected.length > 0 ? focusLocations : filteredByCity;

  // Auto zoom ketika memilih kota
  const FlyToCities = ({
    locations,
    L,
  }: {
    locations: Location[];
    L: typeof Leaflet;
  }) => {
    const { useMap } = require("react-leaflet");
    const map = useMap();

    useEffect(() => {
      if (locations.length > 0) {
        if (locations.length === 1) {
          const loc = locations[0];
          map.flyTo([loc.lat, loc.lng], 11); // zoom in lebih dekat
        } else {
          const bounds = L.latLngBounds(
            locations.map((l) => [l.lat, l.lng] as [number, number])
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, [locations, map, L]);

    return null;
  };

  // Show loading while components are loading
  if (!isClient || !leafletComponents || !L) {
    return (
      <div className="h-full w-full relative flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading map...</p>
          <p className="text-gray-500 text-sm mt-1">
            Preparing health facility locations
          </p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle } = leafletComponents;

  // Debug info untuk city options
  console.log("Current city options state:", cityOptions);
  console.log("City loading state:", cityLoading);
  console.log("City error state:", cityError);

  return (
    <div className="h-full w-full relative">
      {/* Enhanced Control Panel */}
      <div className="absolute top-4 right-4 z-[1000] w-full max-w-[700px]">
        {!showFilter ? (
          <div className="absolute top-4 right-4 z-[1000] w-full max-w-[700px]">
            <div className="flex justify-end">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFilter(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h18M3 10h18M3 16h18"
                    />
                  </svg>
                  Select Facility
                </button>

                {/* Tombol Full Map */}
                <button
                  onClick={() => window.open("/dashboard/full-map", "_blank")}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-18h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3"
                    />
                  </svg>
                  Open Full Map
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-[700px]">
            <div className="flex gap-3 items-center">
              {/* Health Facility Selector */}
              <div className="w-[500px]">
                <MultiSelectPopover
                  options={options}
                  selected={selected}
                  onChange={handleSelectChange}
                  placeholder={`Select Health Facility${
                    locations.length > 0
                      ? ` (${locations.length} available)`
                      : ""
                  }`}
                />
              </div>

              {/* City Selector */}
              <div className="w-[200px]">
                <MultiSelectPopover
                  options={cityOptions}
                  selected={selectedCities}
                  onChange={setSelectedCities}
                  placeholder={
                    cityLoading
                      ? "Loading cities..."
                      : cityError
                      ? "Error loading cities"
                      : `Filter by City${
                          cityOptions.length > 0
                            ? ` (${cityOptions.length} cities)`
                            : ""
                        }`
                  }
                />
              </div>

              {/* Clear button */}
              <button
                onClick={() => {
                  setSelected([]);
                  setShowFilter(false);
                  setSelectedCities([]);
                }}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-800 px-4 py-2.5 rounded-lg shadow-sm text-sm text-white flex items-center gap-2 cursor-pointer"
                disabled={selected.length === 0 && selectedCities.length === 0}
              >
                <XCircle className="w-4 h-4" />
                Clear
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200 text-cyan-700 px-3 py-1.5 rounded-lg shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-cyan-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v4a1 1 0 001 1h3v9h8v-9h3a1 1 0 001-1V7l-8-4-8 4z"
                    />
                  </svg>
                  <span className="font-medium">
                    Showing:{" "}
                    <span className="font-bold text-cyan-700">
                      {displayLocations.length}
                    </span>
                    /{locations.length} facilities
                  </span>
                </div>

                {(isLoading || cityLoading) && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </span>
                )}

                {cityError && (
                  <span className="text-red-600 text-xs">
                    City filter unavailable
                  </span>
                )}
              </div>

              {(selected.length > 0 || selectedCities.length > 0) && (
                <div className="flex gap-2">
                  {selected.length > 0 && (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                      Selected:{" "}
                      <span className="font-semibold text-blue-600">
                        {selected.length}
                      </span>
                    </span>
                  )}
                  {selectedCities.length > 0 && (
                    <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm">
                      Cities:{" "}
                      <span className="font-semibold text-green-600">
                        {selectedCities.length}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Display filtered markers based on selection */}
        {displayLocations.map((location) => (
          <Marker key={location.id} position={[location.lat, location.lng]}>
            <Popup maxWidth={400} className="custom-popup">
              <PopupContent location={location} />
            </Popup>
          </Marker>
        ))}

        {/* Enhanced circles for selected locations */}
        {focusLocations.map((location) => (
          <Circle
            key={`circle-${location.id}`}
            center={[location.lat, location.lng]}
            radius={1500}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "5, 5",
            }}
          />
        ))}

        <FlyAndReset locations={focusLocations} L={L} />
        <PopupHandler focusLocations={focusLocations} L={L} />
      </MapContainer>

      {/* Custom CSS for popup styling */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 16px;
          line-height: 1.4;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: none;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default IndonesiaMap;
