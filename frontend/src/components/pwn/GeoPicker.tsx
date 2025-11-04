import React from "react";
import { Input } from "@/components/ui/input";

type GeoPickerProps = {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: number | string;
  radiusKm?: number | null;
};

// Lightweight Leaflet loader via CDN to avoid bundling dependencies
export default function GeoPicker({ value, onChange, height = 320, radiusKm }: GeoPickerProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const leafletReadyRef = React.useRef(false);
  const instanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Array<{ place_id?: number | string; display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = React.useState(false);
  const debounceRef = React.useRef<any>(null);
  const ignoreSearchOnceRef = React.useRef(false);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

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
          link.integrity = "sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H";
          link.crossOrigin = "anonymous";
          document.head.appendChild(link);
        }
        // JS
        const jsId = "leaflet-js-cdn";
        if (!document.getElementById(jsId)) {
          const script = document.createElement("script");
          script.id = jsId;
          script.async = true;
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.integrity = "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH";
          script.crossOrigin = "anonymous";
          script.onload = () => resolve();
          script.onerror = () => {
            console.error("Failed to load Leaflet with integrity verification");
          };
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

      // Default to Deux-Verges (Cantal)
      const initial = value || { lat: 44.8067, lng: 3.0236 };
      const map = L.map(mapRef.current).setView([initial.lat, initial.lng], 13);
      instanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      // Add scale control for real-world distance reference
      try { L.control.scale({ metric: true, imperial: false }).addTo(map); } catch {}

      markerRef.current = L.marker([initial.lat, initial.lng], { draggable: true }).addTo(map);
      if (typeof radiusKm === 'number' && !Number.isNaN(radiusKm)) {
        circleRef.current = L.circle([initial.lat, initial.lng], { radius: radiusKm * 1000, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15 }).addTo(map);
        try { map.fitBounds(circleRef.current.getBounds(), { padding: [16, 16] }); } catch {}
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

      // Give the browser a tick to lay out the dialog/tabs, then fix map size
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 100);

      // Keep the map responsive: observe container resize and window events
      if (mapRef.current && 'ResizeObserver' in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          try { map.invalidateSize(); } catch {}
        });
        resizeObserverRef.current.observe(mapRef.current);
      }
      const handleResize = () => { try { map.invalidateSize(); } catch {} };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      // Store cleanup hooks on the map instance for later removal
      (map as any)._ptaCleanup = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (resizeObserverRef.current) {
          try { resizeObserverRef.current.disconnect(); } catch {}
          resizeObserverRef.current = null;
        }
      };
    })();

    return () => {
      destroyed = true;
      try {
        if (instanceRef.current && (instanceRef.current as any)._ptaCleanup) {
          try { (instanceRef.current as any)._ptaCleanup(); } catch {}
        }
        if (instanceRef.current) instanceRef.current.remove();
      } catch {}
    };
  }, []);

  // Debounced search using Nominatim
  React.useEffect(() => {
    if (ignoreSearchOnceRef.current) {
      // Skip one search cycle after selecting a suggestion programmatically
      ignoreSearchOnceRef.current = false;
      return;
    }
    if (!query || query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const params = new URLSearchParams({ q: query.trim(), format: "json", addressdetails: "0", limit: "8", dedupe: "1" });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { "Accept-Language": (typeof navigator !== 'undefined' ? navigator.language : 'en') as string },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const seenByName: Record<string, boolean> = {};
          const seenByRoundedCoords: Record<string, boolean> = {};
          const unique = [] as Array<{ place_id?: number | string; display_name: string; lat: string; lon: string }>;
          for (const r of data) {
            const nameKey = (r.display_name || '').toLowerCase();
            const latNum = parseFloat(r.lat);
            const lonNum = parseFloat(r.lon);
            const coordKey = `${isFinite(latNum) ? latNum.toFixed(3) : r.lat}|${isFinite(lonNum) ? lonNum.toFixed(3) : r.lon}`;
            if (seenByName[nameKey] || seenByRoundedCoords[coordKey]) continue;
            seenByName[nameKey] = true;
            seenByRoundedCoords[coordKey] = true;
            unique.push(r);
          }
          setResults(unique.slice(0, 5));
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const moveTo = (lat: number, lng: number) => {
    onChange({ lat, lng });
    try {
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
      if (instanceRef.current) instanceRef.current.setView([lat, lng]);
    } catch {}
  };

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
        try { instanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [16, 16] }); } catch {}
      } else {
        circleRef.current.setRadius(radiusKm * 1000);
        try { instanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [16, 16] }); } catch {}
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, [radiusKm]);

  return (
    <div
      style={{
        width: "100%",
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={"Search a place (min 3 chars)"}
          disabled={searching}
        />
        {results.length > 0 && (
          <div
            style={{
              position: "relative",
              zIndex: 10,
            }}
          >
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "6px 0 0 0",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--card)",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {results.map((r, i) => (
                <li
                  key={`${r.lat}-${r.lon}-${i}`}
                  style={{ padding: "8px 10px", cursor: "pointer" }}
                  onClick={() => {
                    const lat = parseFloat(r.lat);
                    const lon = parseFloat(r.lon);
                    moveTo(lat, lon);
                    // Set the input text but suppress the next search effect
                    ignoreSearchOnceRef.current = true;
                    setQuery(r.display_name);
                    setResults([]);
                  }}
                >
                  {r.display_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    <div
        ref={mapRef}
        style={{
      flex: 1,
      minHeight: 200,
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
          position: "relative",
          zIndex: 0, // isolate Leaflet panes under sibling overlays
        }}
      />
    </div>
  );
}


