// utils/mapHelpers.ts
import { LatLngExpression } from 'leaflet';

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const INDONESIA_BOUNDS: Bounds = {
  north: 6,
  south: -11,
  east: 141,
  west: 95
};

export const isWithinIndonesia = (lat: number, lng: number): boolean => {
  return (
    lat >= INDONESIA_BOUNDS.south &&
    lat <= INDONESIA_BOUNDS.north &&
    lng >= INDONESIA_BOUNDS.west &&
    lng <= INDONESIA_BOUNDS.east
  );
};

export const formatCoordinate = (coord: number, precision: number = 6): string => {
  return coord.toFixed(precision);
};

export const parseCoordinate = (coord: string): number | null => {
  const parsed = parseFloat(coord);
  return isNaN(parsed) ? null : parsed;
};

export const validateCoordinates = (lat: string, lng: string): {
  isValid: boolean;
  lat?: number;
  lng?: number;
  error?: string;
} => {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);

  if (parsedLat === null || parsedLng === null) {
    return {
      isValid: false,
      error: 'Koordinat harus berupa angka yang valid'
    };
  }

  if (parsedLat < -90 || parsedLat > 90) {
    return {
      isValid: false,
      error: 'Latitude harus antara -90 dan 90'
    };
  }

  if (parsedLng < -180 || parsedLng > 180) {
    return {
      isValid: false,
      error: 'Longitude harus antara -180 dan 180'
    };
  }

  return {
    isValid: true,
    lat: parsedLat,
    lng: parsedLng
  };
};