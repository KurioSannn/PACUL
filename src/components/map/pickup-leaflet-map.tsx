"use client";

import dynamic from "next/dynamic";

export type PickupMapPoint = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  selected?: boolean;
  order?: number;
};

export type PickupMapBase = {
  latitude: number;
  longitude: number;
  label: string;
};

type PickupLeafletMapProps = {
  base: PickupMapBase;
  points: PickupMapPoint[];
  routePolyline?: Array<[number, number]>;
  className?: string;
  height?: number;
};

const PickupLeafletMapInner = dynamic(
  () => import("./pickup-leaflet-map-inner").then((m) => m.PickupLeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-[var(--color-sage-50)] text-sm text-[var(--color-ink-500)]">
        Memuat peta OpenStreetMap...
      </div>
    ),
  },
);

export function PickupLeafletMap(props: PickupLeafletMapProps) {
  const { height = 360, className = "" } = props;

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--color-line)] ${className}`} style={{ height }}>
      <PickupLeafletMapInner {...props} />
    </div>
  );
}
