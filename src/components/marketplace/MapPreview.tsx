"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const markers = [
  { lat: -7.3241, lng: 112.7378, label: "Botol PET bening · Rungkut" },
  { lat: -7.2973, lng: 112.7386, label: "Kardus kering · Wonokromo" },
  { lat: -7.2788, lng: 112.7511, label: "Kaleng aluminium · Gubeng" },
  { lat: -7.2943, lng: 112.7859, label: "Botol kaca · Sukolilo" },
  { lat: -7.4533, lng: 112.7183, label: "PET Flake Grade A · Sidoarjo" },
  { lat: -7.1618, lng: 112.6533, label: "Aluminium press · Gresik" },
];

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || loaded) return;

    let cancelled = false;

    async function initMap() {
      try {
        const L = await import("leaflet");

        if (cancelled || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          center: [-7.3, 112.73],
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#2e9e63;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
          className: "",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        for (const m of markers) {
          L.marker([m.lat, m.lng], { icon })
            .bindPopup(`<b style="font-size:12px">${m.label}</b>`)
            .addTo(map);
        }

        setLoaded(true);
      } catch {
        setHasError(true);
      }
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, [loaded]);

  if (hasError) {
    return (
      <section className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-sage-50)] p-8 text-center">
        <MapPin className="mx-auto size-8 text-[var(--color-ink-500)]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-forest-900)]">Peta tidak tersedia</p>
        <p className="mt-1 text-xs text-[var(--color-ink-500)]">Memerlukan koneksi internet untuk memuat tile peta.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="map-title">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-leaf-700)]">
            Sebaran Listing
          </p>
          <h2 id="map-title" className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)]">
            Titik material di sekitar Anda
          </h2>
        </div>
        <span className="hidden rounded-full border border-[var(--color-line)] bg-[var(--color-sage-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-500)] sm:inline-flex">
          Preview · klik untuk expand
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
        <div ref={mapRef} className="h-64 w-full bg-[var(--color-sage-50)] sm:h-80" />
      </div>
    </section>
  );
}
