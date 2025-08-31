import * as L from "leaflet";

declare global {
  interface Window {
    _leaflet_map?: L.Map;
  }
}
