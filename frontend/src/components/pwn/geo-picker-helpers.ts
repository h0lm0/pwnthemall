// Helper functions for GeoPicker to reduce nesting depth

export interface NominatimResult {
  place_id?: number | string;
  display_name: string;
  lat: string;
  lon: string;
}

export async function loadLeafletLibrary(): Promise<void> {
  if (typeof window === "undefined") return;
  if ((window as any).L) return;

  // Load CSS
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

  // Load JS
  await new Promise<void>((resolve) => {
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
        resolve();
      };
      document.body.appendChild(script);
    } else {
      const existing = document.getElementById(jsId) as HTMLScriptElement;
      if ((window as any).L) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve());
      }
    }
  });
}

export function setupMapEventHandlers(
  map: any,
  marker: any,
  circle: any,
  onChange: (coords: { lat: number; lng: number }) => void
): void {
  marker.on("dragend", (e: any) => {
    const ll = e.target.getLatLng();
    onChange({ lat: ll.lat, lng: ll.lng });
    if (circle) circle.setLatLng([ll.lat, ll.lng]);
  });

  map.on("click", (e: any) => {
    const { lat, lng } = e.latlng || {};
    if (typeof lat === "number" && typeof lng === "number") {
      marker.setLatLng([lat, lng]);
      onChange({ lat, lng });
      if (circle) circle.setLatLng([lat, lng]);
    }
  });
}

export function setupMapResizeHandlers(
  map: any,
  containerElement: HTMLElement | null
): () => void {
  const handleResize = () => {
    try {
      map.invalidateSize();
    } catch {}
  };

  let resizeObserver: ResizeObserver | null = null;

  if (containerElement && 'ResizeObserver' in globalThis.window) {
    resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {}
    });
    resizeObserver.observe(containerElement);
  }

  globalThis.window.addEventListener('resize', handleResize);
  globalThis.window.addEventListener('orientationchange', handleResize);

  // Return cleanup function
  return () => {
    globalThis.window.removeEventListener('resize', handleResize);
    globalThis.window.removeEventListener('orientationchange', handleResize);
    if (resizeObserver) {
      try {
        resizeObserver.disconnect();
      } catch {}
    }
  };
}

export function deduplicateNominatimResults(
  data: NominatimResult[]
): NominatimResult[] {
  const seenByName: Record<string, boolean> = {};
  const seenByRoundedCoords: Record<string, boolean> = {};
  const unique: NominatimResult[] = [];

  for (const r of data) {
    const nameKey = (r.display_name || '').toLowerCase();
    const latNum = Number.parseFloat(r.lat);
    const lonNum = Number.parseFloat(r.lon);
    const coordKey = `${isFinite(latNum) ? latNum.toFixed(3) : r.lat}|${isFinite(lonNum) ? lonNum.toFixed(3) : r.lon}`;
    
    if (seenByName[nameKey] || seenByRoundedCoords[coordKey]) continue;
    
    seenByName[nameKey] = true;
    seenByRoundedCoords[coordKey] = true;
    unique.push(r);
  }

  return unique.slice(0, 5);
}

export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    addressdetails: "0",
    limit: "8",
    dedupe: "1"
  });

  const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "Accept-Language": language },
  });

  const data = await res.json();
  return Array.isArray(data) ? deduplicateNominatimResults(data) : [];
}
