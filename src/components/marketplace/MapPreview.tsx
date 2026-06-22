"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { DEMO_WASTE_MARKETPLACE } from "@/data/demo-marketplace";

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const markers = useMemo(
    () =>
      DEMO_WASTE_MARKETPLACE.filter(
        (item) => typeof item.latitude === "number" && typeof item.longitude === "number",
      )
        .slice(0, 8)
        .map((item) => ({
          lat: item.latitude as number,
          lng: item.longitude as number,
          label: `${item.title} · ${item.district ?? item.city ?? "Surabaya"}`,
        })),
    [],
  );

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
  }, [loaded, markers]);

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
          Preview · katalog demo Surabaya
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
        <div ref={mapRef} className="h-64 w-full bg-[var(--color-sage-50)] sm:h-80" />
      </div>
    </section>
  );
}
