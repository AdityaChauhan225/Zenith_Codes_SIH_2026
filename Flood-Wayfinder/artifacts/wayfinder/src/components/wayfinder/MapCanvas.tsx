import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Minus, Plus } from 'lucide-react';
import type { Coordinate, DownloadedRegion, RoadSegment, SafeZone, SafetyRoute } from '@/services/wayfinder';
import 'leaflet/dist/leaflet.css';

type MapCanvasProps = {
  center: Coordinate | null;
  currentPosition: Coordinate | null;
  regions: DownloadedRegion[];
  nearbyZones: SafeZone[];
  route: SafetyRoute | null;
  coverageRadiusKm?: number;
};

const markerIcon = (kind: 'user' | 'zone' | 'route') =>
  L.divIcon({
    className: `wf-marker wf-marker-${kind}`,
    html: kind === 'user' ? '<span></span>' : kind === 'route' ? '<b>→</b>' : '<b>+</b>',
    iconSize: kind === 'zone' ? [30, 30] : [24, 24],
    iconAnchor: kind === 'zone' ? [15, 15] : [12, 12],
  });

function Recenter({ center }: { center: Coordinate | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 12), { duration: 0.65 });
  }, [center, map]);
  return null;
}

function ZoomButtons() {
  const map = useMap();
  return (
    <div className="wf-zoom-controls">
      <button type="button" onClick={() => map.zoomIn()} data-testid="button-map-zoom-in" aria-label="Zoom in"><Plus size={17} /></button>
      <button type="button" onClick={() => map.zoomOut()} data-testid="button-map-zoom-out" aria-label="Zoom out"><Minus size={17} /></button>
    </div>
  );
}

function regionRoads(regions: DownloadedRegion[]): RoadSegment[] {
  const byId = new Map<string, RoadSegment>();
  regions.forEach((region) => region.roads.forEach((road) => byId.set(road.id, road)));
  return Array.from(byId.values());
}

export function MapCanvas({ center, currentPosition, regions, nearbyZones, route, coverageRadiusKm }: MapCanvasProps) {
  const mapCenter = center ?? regions[0]?.center ?? { lat: 0, lng: 0 };
  const roads = regionRoads(regions);
  const zones = nearbyZones.length ? nearbyZones : regions.flatMap((region) => region.safeZones);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e8eee1]">
      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={center || regions.length ? 13 : 3} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        <ZoomButtons />
        {roads.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: road.floodRisk ? '#b6432f' : '#166b58', weight: road.floodRisk ? 3 : 2, opacity: road.floodRisk ? .8 : .48, dashArray: road.floodRisk ? '8 7' : undefined }}
          />
        ))}
        {zones.map((zone) => (
          <Marker key={zone.id} position={[zone.position.lat, zone.position.lng]} icon={markerIcon(zone.type === 'high ground' ? 'route' : 'zone')} />
        ))}
        {currentPosition && (
          <>
            <Circle center={[currentPosition.lat, currentPosition.lng]} radius={35} pathOptions={{ color: '#eaa825', fillColor: '#f4c348', fillOpacity: .18, weight: 2 }} />
            <Marker position={[currentPosition.lat, currentPosition.lng]} icon={markerIcon('user')} />
          </>
        )}
        {coverageRadiusKm && center && (
          <Circle center={[center.lat, center.lng]} radius={coverageRadiusKm * 1000} pathOptions={{ color: '#eaa825', fillColor: '#f4c348', fillOpacity: .08, weight: 2, dashArray: '5 8' }} />
        )}
        {route && (
          <Polyline
            positions={route.coordinates.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: '#b6432f', weight: 6, opacity: .92, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-[#d7dece] bg-[#faf8f1]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#536154] shadow-sm backdrop-blur">
        OSM map · {regions.length ? 'offline coverage available' : 'online tiles'}
      </div>
      <div className="wf-map-legend absolute bottom-4 left-4 hidden gap-3 rounded-2xl border border-[#d7dece] bg-[#faf8f1]/90 px-3 py-2 text-[10px] text-[#536154] shadow-sm backdrop-blur sm:flex">
        <span><i className="legend-line legend-line-safe" /> mapped road</span>
        <span><i className="legend-line legend-line-risk" /> flood risk</span>
      </div>
    </div>
  );
}