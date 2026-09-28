import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React workflow
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const createCustomIcon = (type, label) => {
  if (type === 'sos') {
    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="flex flex-col items-center justify-center -ml-10 -mt-8 w-24">
            <div class="w-5 h-5 bg-red-500 rounded-full border border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
            <span class="mt-2 bg-slate-900/90 backdrop-blur-md text-xs font-semibold px-2 py-1 rounded-md shadow-lg text-red-400 border border-slate-800 whitespace-nowrap">${label || 'SOS'}</span>
        </div>
      `,
      iconSize: [0, 0]
    });
  } else if (type === 'ndrf') {
    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="flex flex-col items-center justify-center hover:-translate-y-1 transition-transform -ml-10 -mt-8 w-24">
            <div class="w-4 h-4 bg-cyan-400 rounded-full border border-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
            <span class="mt-2 bg-slate-900/90 backdrop-blur-md text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg text-cyan-400 border border-slate-800 whitespace-nowrap">${label || 'NDRF Unit'}</span>
        </div>
      `,
      iconSize: [0, 0]
    });
  }
  return new L.Icon.Default();
};

// Custom map controls to replace default Leaflet controls with Shadcn styling
function MapControls({ center }) {
  const map = useMap();

  // Automatically fly to new center when coordinates update (e.g. geolocation finishes)
  useEffect(() => {
    if (center && center.length === 2 && center[0] !== 0) {
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [center, map]);

  return (
    <div className="absolute bottom-6 right-6 flex flex-col z-[400]">
       <button 
         onClick={(e) => { e.preventDefault(); map.flyTo(center, 15); }} 
         className="w-10 h-10 mb-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl flex items-center justify-center text-cyan-400 hover:bg-slate-800 transition-all hover:scale-105"
         title="Go to my location"
       >
          <LocateFixed size={20} />
       </button>

       <div className="flex flex-col shadow-xl rounded-lg overflow-hidden">
         <button 
           onClick={(e) => { e.preventDefault(); map.zoomIn(); }} 
           className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
         >
            <Plus size={20} />
         </button>
         <button 
           onClick={(e) => { e.preventDefault(); map.zoomOut(); }} 
           className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 border-t-0 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
         >
            <Minus size={20} />
         </button>
       </div>
    </div>
  );
}

export function InteractiveMap({ 
  center = [28.6139, 77.2090], // Default coordinates
  zoom = 12, 
  markers = [], 
  radius = 0,
  downloadedAreas = [],
}) {
  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
      {/* 
        Using CartoDB Voyager basemap for a clean, minimalistic SaaS aesthetic 
        which perfectly matches our dashboard theme.
      */}
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false} // We can build custom zoom controls if needed, or use default
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0, background: "#0f172a" }}
        className="[&_.leaflet-tile-pane]:invert [&_.leaflet-tile-pane]:hue-rotate-180 [&_.leaflet-tile-pane]:brightness-90 [&_.leaflet-tile-pane]:contrast-125"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render provided markers */}
        {markers.map((marker, idx) => {
          const icon = marker.type ? createCustomIcon(marker.type, marker.label) : new L.Icon.Default();
          return (
            <Marker key={idx} position={marker.position} icon={icon}>
              {marker.popup && (
                <Popup>
                  <div className="font-sans">
                    {marker.popup}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {/* If a radius is provided (e.g. for offline map download area), draw a circle */}
        {radius > 0 && (
          <Circle 
            center={center} 
            pathOptions={{ 
              fillColor: '#06b6d4', // neon cyan
              color: '#22d3ee', 
              fillOpacity: 0.2, 
              weight: 2 
            }} 
            radius={radius * 1000} // Radius passed in km, Leaflet expects meters
          />
        )}

        {/* Render downloaded offline map areas */}
        {downloadedAreas.map((area, idx) => {
          if (area.lat && area.lon && area.radiusNum) {
            return (
              <Circle 
                key={area.id || idx}
                center={[area.lat, area.lon]} 
                pathOptions={{ 
                  fillColor: '#3b82f6', // blue-500
                  color: '#60a5fa', 
                  fillOpacity: 0.1, 
                  weight: 1,
                  dashArray: '4 4'
                }} 
                radius={area.radiusNum * 1000}
              />
            );
          }
          return null;
        })}
        
        {/* Custom Shadcn Map Controls */}
        <MapControls center={center} />
      </MapContainer>
    </div>
  );
}
