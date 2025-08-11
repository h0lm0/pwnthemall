import React from "react";

type GeoPickerProps = {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: number;
  radiusKm?: number | null;
};

// Lightweight Leaflet loader via CDN to avoid bundling dependencies
export default function GeoPicker({ value, onChange, height = 320, radiusKm }: GeoPickerProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const leafletReadyRef = React.useRef(false);
  const instanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const ensureLeaflet = () =>
      new Promise<void>((resolve) => {
        if ((window as any).L) {
          resolve();
          return;
        }
        // CSS
        const cssId = "leaflet-css-cdn";
        if (!document.getElementById(cssId)) {
          const link = document.createElement("link");
          link.id = cssId;
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        // JS
        const jsId = "leaflet-js-cdn";
        if (!document.getElementById(jsId)) {
          const script = document.createElement("script");
          script.id = jsId;
          script.async = true;
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.body.appendChild(script);
        } else {
          // already present but not yet loaded
          const existing = document.getElementById(jsId) as HTMLScriptElement;
          if ((window as any).L) resolve();
          else existing.addEventListener("load", () => resolve());
        }
      });

    let destroyed = false;
    (async () => {
      await ensureLeaflet();
      if (destroyed || !mapRef.current) return;
      const L = (window as any).L;
      leafletReadyRef.current = true;

      const initial = value || { lat: 48.85837, lng: 2.294481 }; // Eiffel Tower default
      const map = L.map(mapRef.current).setView([initial.lat, initial.lng], 13);
      instanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      markerRef.current = L.marker([initial.lat, initial.lng], { draggable: true }).addTo(map);
      if (typeof radiusKm === 'number' && !Number.isNaN(radiusKm)) {
        circleRef.current = L.circle([initial.lat, initial.lng], { radius: radiusKm * 1000, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15 }).addTo(map);
      }
      markerRef.current.on("dragend", (e: any) => {
        const ll = e.target.getLatLng();
        onChange({ lat: ll.lat, lng: ll.lng });
        if (circleRef.current) circleRef.current.setLatLng([ll.lat, ll.lng]);
      });
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng || {};
        if (typeof lat === "number" && typeof lng === "number") {
          markerRef.current.setLatLng([lat, lng]);
          onChange({ lat, lng });
          if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
        }
      });
    })();

    return () => {
      destroyed = true;
      try {
        if (instanceRef.current) instanceRef.current.remove();
      } catch {}
    };
  }, []);

  // When value changes externally, move marker
  React.useEffect(() => {
    if (!leafletReadyRef.current || !value || !markerRef.current || !instanceRef.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    instanceRef.current.setView([value.lat, value.lng]);
    if (circleRef.current) circleRef.current.setLatLng([value.lat, value.lng]);
  }, [value]);

  React.useEffect(() => {
    if (!leafletReadyRef.current || !instanceRef.current || !markerRef.current) return;
    const L = (window as any).L;
    const pos = markerRef.current.getLatLng();
    if (typeof radiusKm === 'number' && !Number.isNaN(radiusKm)) {
      if (!circleRef.current) {
        circleRef.current = L.circle([pos.lat, pos.lng], { radius: radiusKm * 1000, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15 }).addTo(instanceRef.current);
      } else {
        circleRef.current.setRadius(radiusKm * 1000);
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, [radiusKm]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}
    />
  );
}


