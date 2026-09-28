import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { InteractiveMap } from '../../components/dashboard/InteractiveMap';

const initialAlerts = [
  {
    id: "#4092-B",
    type: "SOS ACTIVE",
    typeColor: "bg-red-600 text-white",
    borderColor: "border-l-red-600",
    title: "Trapped in Flooded House",
    location: "Sector 4, Chamoli Village",
    time: "2m ago",
    individuals: "4 (1 Child)",
    contact: "+91 9876543210",
    battery: "14%",
    waterLevel: "~1.5m (Rising)",
    message: '"Water entered the ground floor, we are on the roof. Need rescue boat immediately."',
    status: "active",
    expanded: true
  },
  {
    id: "#4091-A",
    type: "MEDICAL",
    typeColor: "bg-orange-50 text-orange-600 border border-orange-100",
    borderColor: "border-l-transparent",
    title: "Elderly patient needs evac",
    location: "Route B Checkpoint",
    time: "15m ago",
    message: "Requires immediate medical supplies for diabetic patient.",
    status: "active",
    expanded: false
  },
  {
    id: "#4088-C",
    type: "RESOLVED",
    typeColor: "bg-green-50 text-green-600 border border-green-100",
    borderColor: "border-l-transparent",
    title: "Evacuation Bus Stuck",
    time: "1h ago",
    status: "resolved",
    expanded: false
  }
];

const AuthoritiesHome = () => {
  const [location, setLocation] = useState([30.3165, 78.0322]); // Default
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation failed", err);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const [alerts, setAlerts] = useState(initialAlerts);

  const handleAction = (id, action) => {
    setAlerts(alerts.map(a => {
      if (a.id === id) {
        if (action === 'dispatch') return { ...a, status: 'dispatched', type: 'DISPATCHED', typeColor: 'bg-[#145C8C] text-white', borderColor: 'border-l-[#145C8C]' };
        if (action === 'resolve') return { ...a, status: 'resolved', type: 'RESOLVED', typeColor: 'bg-green-50 text-green-600 border border-green-100', borderColor: 'border-l-transparent' };
      }
      return a;
    }));
  };

  const handleExpand = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, expanded: !a.expanded } : { ...a, expanded: false }));
  };

  // Generate some realistic offsets for the tactical markers based on live location
  const tacticalMarkers = [
    { position: [location[0] + 0.003, location[1] - 0.004], type: 'sos', label: 'SOS #4092-B', popup: 'Trapped in Flooded House' },
    { position: [location[0] - 0.002, location[1] + 0.006], type: 'ndrf', label: 'NDRF Boat 1', popup: 'En route to SOS #4092-B' },
    { position: location, type: 'ndrf', label: 'HQ Center', popup: 'Command Center' }
  ];

  return (
  <div className="w-full flex flex-col lg:flex-row animate-in fade-in duration-500 text-sm h-[calc(100dvh-73px)]">
    
    {/* LEFT: SOS Management */}
    <div className="w-full lg:w-1/2 flex flex-col lg:border-r border-gray-200 h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-end shrink-0">
        <div>
          <h3 className="text-2xl font-semibold text-[#0B1A2B] mb-2">Emergency Hub</h3>
          <p className="text-gray-500 text-xs">Manage active SOS signals and coordinate rescues.</p>
        </div>
        <div className="flex gap-2">
           <span className="text-red-600 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {alerts.filter(a => a.status === 'active').length} Critical
           </span>
        </div>
      </div>

      {/* SOS List */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50">
        
        {alerts.map(alert => (
          <div key={alert.id} className={`p-6 border-b border-gray-200 bg-white ${alert.status === 'resolved' ? 'opacity-40' : ''} ${alert.expanded ? `border-l-4 ${alert.borderColor}` : 'hover:bg-gray-50 cursor-pointer transition-colors'}`} onClick={() => !alert.expanded && handleExpand(alert.id)}>
              <div className="flex justify-between items-start mb-6">
                  <div>
                     <div className="flex gap-2 items-center mb-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${alert.typeColor}`}>{alert.type}</span>
                        {alert.id && <span className="text-xs text-gray-400 font-mono">ID: {alert.id}</span>}
                     </div>
                     <h4 className={`text-xl font-semibold text-[#0B1A2B] ${alert.status === 'resolved' ? 'line-through' : ''}`}>{alert.title}</h4>
                     {alert.location && <p className="text-sm text-gray-500 mt-1">{alert.location}</p>}
                  </div>
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{alert.time}</span>
              </div>
              
              {alert.expanded && (
                <>
                  {alert.individuals && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                       <div className="border-l-2 border-red-200 pl-3">
                          <span className="block text-xs text-gray-400 mb-1">Individuals</span>
                          <span className="font-semibold text-[#0B1A2B]">{alert.individuals}</span>
                       </div>
                       <div className="border-l-2 border-gray-200 pl-3">
                          <span className="block text-xs text-gray-400 mb-1">Contact Info</span>
                          <span className="font-semibold text-[#0B1A2B]">{alert.contact}</span>
                       </div>
                       <div className="border-l-2 border-gray-200 pl-3">
                          <span className="block text-xs text-gray-400 mb-1">Device Battery</span>
                          <span className="font-semibold text-orange-500">{alert.battery}</span>
                       </div>
                       <div className="border-l-2 border-gray-200 pl-3">
                          <span className="block text-xs text-gray-400 mb-1">Water Level</span>
                          <span className="font-semibold text-red-600">{alert.waterLevel}</span>
                       </div>
                    </div>
                  )}
                  {alert.message && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 text-sm text-gray-600 italic shadow-inner">
                      {alert.message}
                    </div>
                  )}
                  {alert.status === 'active' && (
                    <div className="flex flex-wrap gap-3">
                       <button onClick={(e) => { e.stopPropagation(); handleAction(alert.id, 'dispatch'); }} className="flex-1 bg-red-600 text-white py-3 px-4 rounded text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm min-w-[140px]">Dispatch NDRF Boat</button>
                       <button onClick={(e) => { e.stopPropagation(); handleAction(alert.id, 'resolve'); }} className="flex-1 bg-[#145C8C] text-white py-3 px-4 rounded text-sm font-semibold hover:bg-[#0B1A2B] transition-colors shadow-sm min-w-[140px]">Mark Resolved</button>
                    </div>
                  )}
                </>
              )}

              {!alert.expanded && alert.message && !alert.individuals && (
                 <>
                   <p className="text-sm text-gray-500 truncate mb-4">{alert.location} - {alert.message}</p>
                   {alert.status === 'active' && (
                     <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); handleAction(alert.id, 'dispatch'); }} className="px-5 border border-gray-200 text-[#145C8C] py-2 rounded text-xs font-semibold hover:bg-gray-50 transition-colors">Review Case</button>
                     </div>
                   )}
                 </>
              )}
          </div>
        ))}
        
      </div>
    </div>

    {/* RIGHT: MAP */}
    <div className="w-full lg:w-1/2 flex flex-col h-full bg-white relative">
      <div className="p-6 border-b border-gray-200 shrink-0">
        <h3 className="text-2xl font-semibold text-[#0B1A2B] mb-2">Tactical Map</h3>
        <p className="text-gray-500 text-xs">Live tracking of SOS signals and NDRF units.</p>
      </div>
      
      <div className="flex-1 relative z-0">
         {/* Real Leaflet Map */}
         <InteractiveMap 
           center={location} 
           zoom={14}
           markers={tacticalMarkers}
         />



      </div>
    </div>

  </div>
  );
};

export default function AuthoritiesDashboard() {
  const profile = { name: "District Collector", role: "Chamoli HQ" };
  const links = [
    { label: "Emergency Hub", path: "/dashboard/authorities/home" },
  ];

  return (
    <Routes>
      <Route element={<DashboardLayout title="BACHAV" profile={profile} links={links} />}>
        <Route path="home" element={<AuthoritiesHome />} />
        <Route index element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
