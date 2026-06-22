"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map } from "leaflet";

import type { PickupMapBase, PickupMapPoint } from "./pickup-leaflet-map";

import "leaflet/dist/leaflet.css";

type Props = {
  base: PickupMapBase;
  points: PickupMapPoint[];
  routePolyline?: Array<[number, number]>;
};

function safeCoord(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

type LeafletModule = typeof import("leaflet");

function createIcons(L: LeafletModule) {
  const baseIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#1f7a4d;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const selectedIcon = L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#17643f;border:3px solid #cdebda;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const orderedIcon = (order: number) =>
    L.divIcon({
      className: "",
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:#0b2f24;color:white;font:700 11px/22px system-ui;text-align:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">${order}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

  return { baseIcon, selectedIcon, orderedIcon };
}

function renderMapLayers(
  L: LeafletModule,
  map: Map,
  layerGroup: LayerGroup,
  base: PickupMapBase,
  points: PickupMapPoint[],
  routePolyline?: Array<[number, number]>,
) {
  layerGroup.clearLayers();

  const centerLat = safeCoord(base.latitude, -7.2892);
  const centerLng = safeCoord(base.longitude, 112.7348);
  const center: [number, number] = [centerLat, centerLng];
  const icons = createIcons(L);

  L.marker(center, { icon: icons.baseIcon })
    .bindPopup(`<strong>${base.label}</strong><br/>Basis pengepul`)
    .addTo(layerGroup);

  const safePoints = points.map((point) => ({
    ...point,
    latitude: safeCoord(point.latitude, centerLat),
    longitude: safeCoord(point.longitude, centerLng),
  }));

  for (const point of safePoints) {
    const pos: [number, number] = [point.latitude, point.longitude];
    const icon =
      point.order != null
        ? icons.orderedIcon(point.order)
        : point.selected
          ? icons.selectedIcon
          : undefined;

    const popupParts = [`<strong>${point.title}</strong>`];
    if (point.subtitle) popupParts.push(point.subtitle);
    if (point.order != null) popupParts.push(`Urutan rute: #${point.order}`);

    L.marker(pos, icon ? { icon } : undefined)
      .bindPopup(popupParts.join("<br/>"))
      .bindTooltip(point.title, { direction: "top", offset: [0, -8] })
      .addTo(layerGroup);
  }

  if (routePolyline && routePolyline.length > 1) {
    L.polyline(routePolyline, { color: "#1f7a4d", weight: 4, opacity: 0.85 }).addTo(layerGroup);
  }

  const bounds = L.latLngBounds([center, ...safePoints.map((p) => [p.latitude, p.longitude] as [number, number])]);
  if (safePoints.length > 0) {
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
  } else {
    map.setView(center, 12);
  }
}

export function PickupLeafletMapInner({ base, points, routePolyline }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);

  useEffect(() => {
    let disposed = false;

    void (async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;

      const center: [number, number] = [
        safeCoord(base.latitude, -7.2892),
        safeCoord(base.longitude, 112.7348),
      ];

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(center, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = layerGroup;

      renderMapLayers(L, map, layerGroup, base, points, routePolyline);

      window.setTimeout(() => {
        map.invalidateSize();
      }, 100);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      leafletRef.current = null;
    };
    // Init map once on mount — layer updates handled in separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!L || !map || !layerGroup) return;

    renderMapLayers(L, map, layerGroup, base, points, routePolyline);
    window.setTimeout(() => {
      map.invalidateSize();
    }, 50);
  }, [base, points, routePolyline]);

  return <div ref={containerRef} className="h-full w-full min-h-[280px]" />;
}
