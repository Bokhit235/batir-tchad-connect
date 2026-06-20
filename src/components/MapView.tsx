import { useEffect, useRef, useState } from "react";
import type { ReportSeverity } from "@/lib/constants";
import { getSeverity, getCategory } from "@/lib/constants";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  severity: ReportSeverity;
  category: string;
  status: string;
}

interface MapViewProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLatLng?: [number, number] | null;
  interactive?: boolean;
}

/**
 * Leaflet map. Client-only render (react-leaflet does not SSR).
 * Center: Tchad (~15.4°N, 18.7°E)
 */
export function MapView({
  points,
  center = [15.4, 18.7],
  zoom = 6,
  height = "100%",
  onMarkerClick,
  onMapClick,
  selectedLatLng,
  interactive = true,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [Mod, setMod] = useState<typeof import("react-leaflet") | null>(null);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, leaflet]) => {
      setMod(rl);
      setL(leaflet.default ?? leaflet);
    });
  }, []);

  if (!mounted || !Mod || !L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
        <div className="text-sm text-muted-foreground">Chargement de la carte…</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = Mod;

  function makeIcon(severity: ReportSeverity, selected = false) {
    const { hex } = getSeverity(severity);
    const size = selected ? 36 : 28;
    return L!.divIcon({
      className: "",
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${hex};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.5}px;
      ">📍</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onMapClick?.(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div style={{ height, width: "100%" }} className="overflow-hidden rounded-lg">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={interactive} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler />}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={makeIcon(p.severity)}
            eventHandlers={{
              click: () => onMarkerClick?.(p.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs opacity-70">{getCategory(p.category).label}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedLatLng && (
          <Marker position={selectedLatLng} icon={makeIcon("rouge", true)}>
            <Popup>Position sélectionnée</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
