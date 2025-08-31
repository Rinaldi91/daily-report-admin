// types/leaflet.d.ts
import { LatLngExpression } from 'leaflet';

declare module 'leaflet' {
  namespace Icon {
    interface DefaultIconOptions {
      iconUrl: string;
      iconRetinaUrl: string;
      shadowUrl: string;
      iconSize?: [number, number];
      iconAnchor?: [number, number];
      popupAnchor?: [number, number];
      shadowSize?: [number, number];
    }
  }
}

export interface Location {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface MapProps {
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}