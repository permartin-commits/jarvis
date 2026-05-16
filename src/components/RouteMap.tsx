"use client";

import { useEffect, useRef } from "react";

interface LeafletMap {
  remove(): void;
}

export function RouteMap({ encodedPolyline }: { encodedPolyline: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || !encodedPolyline) return;

    // Destroy previous instance on re-renders
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Dynamic imports — never run on the server
    Promise.all([
      import("leaflet"),
      import("@mapbox/polyline"),
    ]).then(([{ default: L }, { default: polylineLib }]) => {
      if (!containerRef.current) return;

      // Import Leaflet CSS
      const link = document.getElementById("leaflet-css");
      if (!link) {
        const el = document.createElement("link");
        el.id   = "leaflet-css";
        el.rel  = "stylesheet";
        el.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(el);
      }

      const positions = polylineLib.decode(encodedPolyline);
      if (positions.length < 2) return;

      const map = L.map(containerRef.current, {
        zoomControl:       false,
        attributionControl: false,
        dragging:          false,
        scrollWheelZoom:   false,
        doubleClickZoom:   false,
        touchZoom:         false,
        keyboard:          false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      const latLngs  = positions.map(([lat, lng]: [number, number]) => L.latLng(lat, lng));
      const routeLine = L.polyline(latLngs, {
        color:   "#3b82f6",
        weight:  3.5,
        opacity: 0.9,
      }).addTo(map);

      map.fitBounds(routeLine.getBounds(), { padding: [20, 20], animate: false });
      mapRef.current = map;
    }).catch(() => {/* silently ignore map errors */});

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [encodedPolyline]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
