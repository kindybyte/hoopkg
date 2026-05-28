"use client";

import { useEffect, useRef } from "react";
import { load } from "@2gis/mapgl";

type Marker = { destroy: () => void };
type MapInstance = { destroy: () => void };

export function CourtMap({
  lat,
  lng,
  name
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_2GIS_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let map: MapInstance | null = null;
    let marker: Marker | null = null;
    let cancelled = false;

    load()
      .then((mapgl) => {
        if (cancelled || !containerRef.current) return;
        map = new mapgl.Map(containerRef.current, {
          center: [lng, lat],
          zoom: 16,
          key: apiKey
        }) as unknown as MapInstance;
        marker = new mapgl.Marker(map as never, {
          coordinates: [lng, lat],
          label: { text: name, color: "#0B0F19", fontSize: 14 }
        }) as unknown as Marker;
      })
      .catch((err) => {
        console.error("[CourtMap] 2GIS load failed", err);
      });

    return () => {
      cancelled = true;
      try {
        marker?.destroy();
      } catch {}
      try {
        map?.destroy();
      } catch {}
    };
  }, [apiKey, lat, lng, name]);

  if (!apiKey) {
    return (
      <div className="card px-5 py-4 text-sm text-ink/60">
        Карта не настроена. Админ: добавь <code>NEXT_PUBLIC_2GIS_KEY</code> в Vercel env vars.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-xl2 border border-line bg-soft sm:h-80"
    />
  );
}
