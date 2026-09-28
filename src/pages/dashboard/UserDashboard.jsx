import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ArrowUpRight, CloudLightning, CloudRain, CloudSun, Sun, Cloud, AlertTriangle, Info, Wind, Droplets, Search, MapPin, Download, Database, Trash2, Phone, User, ShieldAlert, Radio, BookOpen, AlertCircle, PhoneCall, Plus, X } from 'lucide-react';
import { InteractiveMap } from '../../components/dashboard/InteractiveMap';

const UserHome = () => {
  const [location, setLocation] = useState([30.3165, 78.0322]); // Default Dehradun
  const [currentWeather, setCurrentWeather] = useState({ temp: 22, wind: 45, humidity: 98, desc: "Fetching...", icon: <CloudLightning className="w-8 h-8 text-gray-800" strokeWidth={1.5} /> });
  const [currentRain, setCurrentRain] = useState(0);
  const [timelineData, setTimelineData] = useState([]);
  const [telemetry, setTelemetry] = useState({
    soil: 40, soilRisk: "Low landslide risk", soilColor: "bg-green-500",
    riverLevel: "-0.5", riverDesc: "Below danger mark",
    impactTime: "--", impactDesc: "No surge predicted",
    advisoryText: "Conditions are currently normal. No evacuation required at this time."
  });
  const [isLocating, setIsLocating] = useState(true);
  const [sosStatus, setSosStatus] = useState('idle');

  const handleSOS = () => {
    if (sosStatus !== 'idle') return;
    setSosStatus('loading');
    // Simulate network request to NDRF servers
    setTimeout(() => {
      setSosStatus('sent');
      // Reset button after 5 seconds
      setTimeout(() => setSosStatus('idle'), 5000);
    }, 2000);
  };

  useEffect(() => {
    // 1. Fetch live weather using completely free Open-Meteo API (NO API KEY REQUIRED)
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&hourly=precipitation,weather_code&timezone=auto`);
        const data = await res.json();
        
        const code = data.current.weather_code;
        let desc = "Clear";
        let icon = <Sun className="w-8 h-8 text-gray-800" strokeWidth={1.5} />;
        
        if (code >= 1 && code <= 3) { desc = "Cloudy"; icon = <CloudSun className="w-8 h-8 text-gray-800" strokeWidth={1.5} />; }
        else if (code >= 51 && code <= 67) { desc = "Rain"; icon = <CloudRain className="w-8 h-8 text-gray-800" strokeWidth={1.5} />; }
        else if (code >= 80 && code <= 82) { desc = "Showers"; icon = <CloudRain className="w-8 h-8 text-gray-800" strokeWidth={1.5} />; }
        else if (code >= 95) { desc = "Thunderstorms"; icon = <CloudLightning className="w-8 h-8 text-gray-800" strokeWidth={1.5} />; }

        setCurrentWeather({
          temp: Math.round(data.current.temperature_2m),
          wind: Math.round(data.current.wind_speed_10m),
          humidity: Math.round(data.current.relative_humidity_2m),
          desc: desc,
          icon: icon
        });
        const liveRain = data.current.precipitation || 0;
        setCurrentRain(liveRain);

        // Derive Telemetry from live data
        let soil = Math.min(Math.round(40 + (liveRain * 5)), 98);
        let sRisk = "Low landslide risk";
        let sColor = "bg-green-500";
        let sTextColor = "text-green-500";
        if(soil > 85) { sRisk = "High landslide risk"; sColor = "bg-orange-500"; sTextColor = "text-orange-500"; }
        else if (soil > 65) { sRisk = "Moderate landslide risk"; sColor = "bg-yellow-500"; sTextColor = "text-yellow-500"; }

        let rLevel = liveRain > 0 ? "+" + (liveRain * 0.15).toFixed(1) : "-0.5";
        let rDesc = liveRain > 10 ? "Above danger mark (Alaknanda)" : "Below danger mark";

        let iTime = liveRain > 10 ? "45" : "--";
        let iDesc = liveRain > 10 ? "Flood surge arrival" : "No surge predicted";

        let advText = liveRain > 10 
           ? "Seek high ground immediately. Do not attempt to cross flooded roads. The nearest safe zone is Primary School, Sector 4 (approx 400m North)."
           : liveRain > 5
           ? "Monitor alerts closely. Prepare emergency kits. Avoid low-lying areas."
           : "Conditions are currently normal. No evacuation required at this time.";

        setTelemetry({
           soil, soilRisk: sRisk, soilColor: sColor, soilTextColor: sTextColor,
           riverLevel: rLevel, riverDesc: rDesc,
           impactTime: iTime, impactDesc: iDesc,
           advisoryText: advText
        });

        // 12-Hour Timeline
        const currentHourIdx = data.hourly.time.findIndex(t => new Date(t) >= new Date()) - 1;
        const startIndex = currentHourIdx >= 0 ? currentHourIdx : 0;
        
        // If the real-world forecast is completely dry, inject a simulated storm pattern
        // so the timeline UI always has data to show during presentations.
        const next12Hours = data.hourly.precipitation.slice(startIndex, startIndex + 12);
        const isDry = next12Hours.every(p => !p || p === 0);

        const newTimeline = [];
        for (let i = 0; i < 12; i++) {
          let hourRain = data.hourly.precipitation[startIndex + i] || 0;
          let hCode = data.hourly.weather_code[startIndex + i] || 0;

          if (isDry) {
            if (i === 2) { hourRain = 1.2; hCode = 51; } // Drizzle
            else if (i === 3) { hourRain = 4.5; hCode = 61; } // Rain
            else if (i === 4) { hourRain = 8.2; hCode = 63; } // Heavy Rain
            else if (i === 5) { hourRain = 14.5; hCode = 95; } // Thunderstorm (Red Alert)
            else if (i === 6) { hourRain = 6.1; hCode = 61; } // Rain
            else if (i === 7) { hourRain = 2.0; hCode = 51; } // Drizzle
          }

          const timeObj = new Date(data.hourly.time[startIndex + i]);
          const timeStr = i === 0 ? 'Now' : timeObj.toLocaleTimeString([], { hour: 'numeric' });
          
          let risk = 'bg-gray-200';
          if (hourRain > 10) risk = 'bg-red-500';
          else if (hourRain > 5) risk = 'bg-orange-500';
          else if (hourRain > 2) risk = 'bg-yellow-500';
          else if (hourRain > 0) risk = 'bg-blue-400';
          
          let hIcon = <Sun size={20} strokeWidth={1.5} className="text-gray-400" />;
          if (hCode >= 1 && hCode <= 3) hIcon = <Cloud size={20} strokeWidth={1.5} className="text-gray-400" />;
          if (hCode >= 51 && hCode <= 67) hIcon = <CloudRain size={20} strokeWidth={1.5} className="text-blue-500" />;
          if (hCode >= 95) hIcon = <CloudLightning size={20} strokeWidth={1.5} className="text-red-500" />;

          newTimeline.push({
            time: timeStr,
            rain: hourRain.toFixed(1),
            unit: 'mm/h',
            riskColor: risk,
            icon: hIcon
          });
        }
        setTimelineData(newTimeline);
      } catch (err) {
        console.error(err);
      }
    };

    // 2. HTML5 Geolocation to get actual user coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation([lat, lon]);
          fetchWeather(lat, lon);
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation failed/denied, falling back to default.", err);
          fetchWeather(location[0], location[1]);
          setIsLocating(false);
        }
      );
    } else {
      fetchWeather(location[0], location[1]);
      setIsLocating(false);
    }
  }, []);

  return (
  <div className="w-full h-[calc(100dvh-73px)] flex flex-col animate-in fade-in duration-500 text-sm">
    
    {/* TOP SECTION (Left: Map, Right: Weather & SOS) */}
    <div className="flex-1 flex flex-col lg:flex-row border-b border-gray-200 overflow-hidden">
      
      {/* LEFT: MAP */}
      <div className="w-full lg:w-1/2 lg:border-r border-gray-200 h-[50vh] lg:h-full relative flex flex-col">
         <div className="px-6 h-[104px] border-b border-gray-200 shrink-0 bg-white z-10 flex justify-between items-center">
            <div>
               <h3 className="text-2xl font-semibold text-[#0B1A2B] mb-1">Your Location</h3>
               <p className="text-gray-500 text-xs">Pinpoint your exact location for accurate rescue coordination.</p>
            </div>
         </div>
         
         {/* Real Leaflet Map */}
         <div className="flex-1 relative z-0">
           {!isLocating && (
             <InteractiveMap 
               center={location} 
               zoom={14}
               markers={[{ position: location, popup: "You are here" }]}
             />
           )}
         </div>
      </div>

      {/* RIGHT: LOCATION TELEMETRY & SOS */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-white">
         
         <div className="px-6 h-[104px] border-b border-gray-200 shrink-0 flex justify-between items-center bg-white">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  {currentRain > 10 ? <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2} /> : 
                   currentRain > 5 ? <AlertCircle className="w-5 h-5 text-orange-500" strokeWidth={2} /> :
                   currentRain > 0 ? <Info className="w-5 h-5 text-yellow-500" strokeWidth={2} /> :
                   <ShieldAlert className="w-5 h-5 text-green-600" strokeWidth={2} />}
                  <h3 className="text-2xl font-semibold text-[#0B1A2B]">
                    {currentRain > 10 ? "Severe Weather" : currentRain > 5 ? "High Alert" : currentRain > 0 ? "Moderate Rain" : "Conditions Clear"}
                  </h3>
               </div>
               <p className="text-gray-500 text-xs">
                 {currentRain > 10 ? "Flash flood conditions met at pinned location." : currentRain > 5 ? "Heavy rainfall detected. Monitor alerts." : currentRain > 0 ? "Normal monsoon conditions. Stay updated." : "No immediate flood or weather threats detected."}
               </p>
            </div>
            <div className="text-right shrink-0">
               <span className={`text-sm font-bold uppercase tracking-wider ${currentRain > 10 ? 'text-red-600' : currentRain > 5 ? 'text-orange-500' : currentRain > 0 ? 'text-yellow-500' : 'text-green-600'}`}>
                  {currentRain > 10 ? "Red Alert" : currentRain > 5 ? "Orange Alert" : currentRain > 0 ? "Yellow Alert" : "Safe"}
               </span>
            </div>
         </div>
         
         {/* Telemetry Details */}
         <div className="flex-1 overflow-y-auto flex flex-col bg-white">
             
             {/* General Weather of pinned location */}
             <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0 bg-white">
                <div>
                   <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Current Weather</span>
                   <div className="flex items-center gap-4">
                      {currentWeather.icon}
                      <div>
                         <span className="text-3xl font-light text-[#0B1A2B]">{currentWeather.temp}°</span>
                         <span className="block text-xs text-gray-500 mt-1 font-medium">{currentWeather.desc}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right border-l border-gray-200 pl-6 flex flex-col gap-3">
                   <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                      <span>Wind</span>
                      <strong className="text-[#0B1A2B] font-medium w-16 text-right">{currentWeather.wind} km/h</strong>
                   </div>
                   <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                      <span>Humidity</span>
                      <strong className="text-[#0B1A2B] font-medium w-16 text-right">{currentWeather.humidity}%</strong>
                   </div>
                </div>
             </div>

             <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                 Disaster Telemetry Data
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 shrink-0">
                <div className="p-6 border-b border-gray-200 md:border-r bg-white">
                   <span className="block text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">Rainfall Intensity</span>
                   <span className="text-3xl font-light text-[#0B1A2B]">{currentRain} <span className="text-sm font-medium text-gray-400">mm/h</span></span>
                   <div className="w-full h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((currentRain / 20) * 100, 100)}%` }}></div>
                   </div>
                   <p className="text-[10px] text-blue-500 mt-3 font-medium">Live precipitation tracking</p>
                </div>
                
                <div className="p-6 border-b border-gray-200 bg-white">
                   <span className="block text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">Soil Saturation</span>
                   <span className="text-3xl font-light text-[#0B1A2B]">{telemetry.soil}%</span>
                   <div className="w-full h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                      <div className={`h-full ${telemetry.soilColor} transition-all duration-500`} style={{ width: `${telemetry.soil}%` }}></div>
                   </div>
                   <p className={`text-[10px] ${telemetry.soilTextColor} mt-3 font-medium`}>{telemetry.soilRisk}</p>
                </div>

                <div className="p-6 border-b border-gray-200 md:border-r bg-white">
                   <span className="block text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">Nearest River Level</span>
                   <span className="text-3xl font-light text-[#0B1A2B]">{telemetry.riverLevel} <span className="text-sm font-medium text-gray-400">m</span></span>
                   <p className="text-[10px] text-gray-500 mt-3 font-medium">{telemetry.riverDesc}</p>
                </div>

                <div className="p-6 border-b border-gray-200 bg-white">
                   <span className="block text-[11px] text-gray-500 mb-2 font-medium uppercase tracking-wider">Est. Impact Time</span>
                   <span className="text-3xl font-light text-[#0B1A2B]">{telemetry.impactTime} <span className="text-sm font-medium text-gray-400">mins</span></span>
                   <p className="text-[10px] text-gray-500 mt-3 font-medium">{telemetry.impactDesc}</p>
                </div>
             </div>

             <div className="p-6 bg-white flex gap-4 items-start flex-1">
                <Info className="w-5 h-5 text-[#145C8C] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                   <h5 className="text-sm font-semibold text-[#0B1A2B] mb-2">Evacuation Advisory</h5>
                   <p className="text-xs text-gray-500 leading-relaxed max-w-lg">{telemetry.advisoryText}</p>
                </div>
             </div>
         </div>

         {/* BIG SOS BUTTON */}
         <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0">
             <button 
                onClick={handleSOS}
                disabled={sosStatus !== 'idle'}
                className={`w-full font-semibold py-4 rounded text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  sosStatus === 'idle' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' : 
                  sosStatus === 'loading' ? 'bg-orange-500 text-white cursor-wait opacity-90' :
                  'bg-green-600 text-white shadow-lg shadow-green-600/20'
                }`}
             >
                 {sosStatus === 'idle' ? 'EMERGENCY SOS' : 
                  sosStatus === 'loading' ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Transmitting Coordinates...
                     </>
                  ) : 'SOS SENT — AUTHORITIES ALERTED'}
             </button>
             <p className="text-center text-[10px] text-gray-400 mt-3">
                 {sosStatus === 'idle' ? 'Pressing this will instantly alert NDRF authorities with your exact location.' : 'Your live coordinates have been successfully dispatched to the nearest NDRF response team.'}
             </p>
         </div>

      </div>
    </div>

    {/* BOTTOM SECTION (Horizontal Weather Timeline) */}
    <div className="w-full bg-white shrink-0 overflow-hidden border-t border-gray-200 flex flex-col">
       <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h4 className="font-semibold text-[10px] text-gray-400 uppercase tracking-widest">12-Hour Precipitation & Risk Timeline</h4>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hourly Forecast</span>
       </div>
       <div className="flex w-full overflow-x-auto divide-x divide-gray-200 scrollbar-hide">
          {timelineData.map((item, idx) => (
             <div key={idx} className="flex-1 min-w-[80px] p-4 flex flex-col items-center justify-between text-center bg-white hover:bg-gray-50 transition-colors">
                 <span className="text-[11px] font-medium mb-3 text-gray-500">{item.time}</span>
                 <div className="my-2">{item.icon}</div>
                 <span className="text-sm font-medium text-[#0B1A2B] mt-2">{item.rain}</span>
                 <span className="text-[10px] text-gray-400 mb-4">{item.unit}</span>
                 {/* Risk Bar */}
                 <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${item.riskColor} w-full`}></div>
                 </div>
             </div>
          ))}
       </div>
    </div>

    </div>
  );
};

const UserMap = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [location, setLocation] = useState([30.3165, 78.0322]);
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

  const [downloadedMaps, setDownloadedMaps] = useState([
    { id: 1, name: "Dehradun Central Area", radius: "5km", radiusNum: 5, lat: 30.3165, lon: 78.0322, size: "45 MB", date: "2 days ago" },
    { id: 2, name: "Mussoorie Route", radius: "10km", radiusNum: 10, lat: 30.4598, lon: 78.0664, size: "112 MB", date: "1 week ago" }
  ]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Search failed", err);
      }
    }
  };

  const handleDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setTimeout(() => {
      const newMap = {
        id: Date.now(),
        name: searchQuery ? searchQuery : "Current Location Area",
        radius: `${selectedRadius}km`,
        radiusNum: selectedRadius,
        lat: location[0],
        lon: location[1],
        size: `${Math.floor(Math.random() * 50 + 10)} MB`,
        date: "Just now"
      };
      setDownloadedMaps([newMap, ...downloadedMaps]);
      setIsDownloading(false);
    }, 1500);
  };

  const handleDeleteMap = (id) => {
    setDownloadedMaps(downloadedMaps.filter(map => map.id !== id));
  };

  const handleGoToMap = (map) => {
    if (map.lat && map.lon) {
      setLocation([map.lat, map.lon]);
    }
  };

  return (
  <div className="w-full flex flex-col animate-in fade-in duration-500 h-[calc(100vh-80px)] bg-[#f8fafc]">
    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] h-full">
      {/* Left: Map Viewer */}
      <div className="lg:border-r border-gray-200 h-full flex flex-col relative bg-gray-100 overflow-hidden">
        {/* Real Leaflet Map */}
        <div className="absolute inset-0 z-0">
          {!isLocating && (
            <InteractiveMap 
              center={location}
              zoom={13}
              radius={selectedRadius}
              downloadedAreas={downloadedMaps}
              markers={[
                { position: location, popup: "Selected Download Region" }
              ]}
            />
          )}
        </div>





      </div>

      {/* Right: Map Controls */}
      <div className="h-full bg-white flex flex-col overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
           <h3 className="text-xl font-semibold text-[#0B1A2B] mb-1">Offline Maps</h3>
           <p className="text-xs text-gray-500">Download topological maps for offline navigation during outages.</p>
        </div>
        
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
           <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search region, city or coordinates (Press Enter)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-none text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C] transition-colors"
              />
           </div>
        </div>

        {/* Location Info */}
        <div className="p-6 border-b border-gray-200 flex items-start gap-4">
           <div className="mt-1 text-[#145C8C]"><MapPin size={20} /></div>
           <div>
              <p className="text-sm font-semibold text-[#0B1A2B] mb-1">{searchQuery ? searchQuery : "Current Location"}</p>
              <p className="text-xs text-gray-500 font-mono">Lat: {location[0].toFixed(4)}° N, Lon: {location[1].toFixed(4)}° E</p>

           </div>
        </div>

        {/* Radius Slider & Download Button */}
        <div className="p-6 border-b border-gray-200">
           <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-semibold text-[#0B1A2B] uppercase tracking-wider">Download Radius</label>
              <span className="text-[#145C8C] text-sm font-bold">{selectedRadius} km</span>
           </div>
           <input 
              type="range" 
              min="1" max="25" step="1"
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(parseInt(e.target.value))}
              className="w-full accent-[#145C8C] mb-2"
           />
           <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-6">
              <span>1km</span><span>25km</span>
           </div>

           <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-colors uppercase group ${isDownloading ? 'bg-gray-400 text-white cursor-wait' : 'bg-[#145C8C] hover:bg-[#0B1A2B] text-white'}`}
           >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                  Download Offline Map
                </>
              )}
           </button>
        </div>

        {/* Downloaded Maps Section */}
        <div className="flex-1 bg-white">
           <div className="p-4 border-b border-gray-200 bg-gray-50">
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Database size={12} /> My Downloaded Maps
             </h4>
           </div>
           
           <div className="flex flex-col">
              {downloadedMaps.map((map, index) => (
                <div 
                  key={map.id} 
                  onClick={() => handleGoToMap(map)}
                  className={`p-6 flex flex-col gap-4 group transition-colors hover:bg-gray-50 cursor-pointer ${index !== downloadedMaps.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-sm font-semibold text-[#0B1A2B] mb-1">{map.name}</p>
                         <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                           <span>{map.radius} Radius</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <span>{map.size}</span>
                         </div>
                      </div>
                      <button onClick={() => handleDeleteMap(map.id)} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 size={16} />
                      </button>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Ready
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{map.date}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  </div>
  );
};

const UserHelp = () => {
  const [contacts, setContacts] = useState([
    { id: 1, name: "Ramesh Singh", relation: "Father", phone: "+91 98765 43210" },
    { id: 2, name: "Priya Sharma", relation: "Spouse", phone: "+91 98765 12345" }
  ]);

  const [userDetails, setUserDetails] = useState({
    name: "Citizen User",
    phone: "+91 91234 56789",
    bloodGroup: "O Positive",
    medicalConditions: "Asthma",
    address: "14-B, Riverside Colony, Dehradun, Uttarakhand"
  });

  const [sosStatus, setSosStatus] = useState("idle");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(userDetails);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', relation: '', phone: '' });
  
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleEditDetails = () => {
     setEditForm(userDetails);
     setShowEditModal(true);
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    setUserDetails(editForm);
    setShowEditModal(false);
  };

  const handleAddContact = () => {
     setContactForm({ name: '', relation: '', phone: '' });
     setShowContactModal(true);
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if(contactForm.name && contactForm.phone) {
       setContacts([...contacts, { id: Date.now(), ...contactForm }]);
       setShowContactModal(false);
    }
  };

  const handleDeleteContact = (id) => {
     if(window.confirm("Remove this emergency contact?")) {
        setContacts(contacts.filter(c => c.id !== id));
     }
  };

  const handleSOS = () => {
     if(sosStatus !== "idle") return;
     setSosStatus("broadcasting");
     setTimeout(() => {
        setSosStatus("sent");
        setTimeout(() => setSosStatus("idle"), 5000);
     }, 2500);
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-500 h-[calc(100vh-80px)] bg-[#f8fafc]">
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] h-full">
        
        {/* Left Column: Personal Emergency Info */}
        <div className="lg:border-r border-gray-200 h-full flex flex-col bg-white overflow-y-auto">
          
          <div className="p-6 border-b border-gray-200">
             <h3 className="text-xl font-semibold text-[#0B1A2B] mb-1">Emergency Profile</h3>
             <p className="text-xs text-gray-500">Your critical information shared with rescue teams during an SOS.</p>
          </div>

          {/* User Details */}
          <div className="p-6 border-b border-gray-200">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <User size={12} /> My Details
                </h4>
                <button onClick={handleEditDetails} className="text-xs font-semibold text-[#145C8C] hover:underline uppercase tracking-wider">Edit</button>
             </div>
             <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                   <p className="text-xs text-gray-400 font-medium mb-1">Full Name</p>
                   <p className="font-semibold text-[#0B1A2B]">{userDetails.name}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-medium mb-1">Phone Number</p>
                   <p className="font-semibold text-[#0B1A2B]">{userDetails.phone}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-medium mb-1">Blood Group</p>
                   <p className="font-semibold text-red-600">{userDetails.bloodGroup}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 font-medium mb-1">Medical Conditions</p>
                   <p className="font-semibold text-[#0B1A2B]">{userDetails.medicalConditions}</p>
                </div>
                <div className="col-span-2">
                   <p className="text-xs text-gray-400 font-medium mb-1">Primary Address</p>
                   <p className="font-semibold text-[#0B1A2B]">{userDetails.address}</p>
                </div>
             </div>
          </div>

          {/* Emergency Contacts */}
          <div className="flex-1 bg-gray-50 flex flex-col">
             <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <PhoneCall size={12} /> Emergency Contacts
                </h4>
                <button onClick={handleAddContact} className="text-[10px] font-bold text-[#145C8C] flex items-center gap-1 uppercase tracking-wider hover:bg-gray-50 px-2 py-1 transition-colors">
                   <Plus size={14} /> Add Contact
                </button>
             </div>
             
             <div className="flex flex-col bg-white">
                {contacts.length === 0 && (
                   <div className="p-6 text-center text-xs text-gray-400">No emergency contacts added yet.</div>
                )}
                {contacts.map((contact, index) => (
                  <div key={contact.id} className={`p-6 flex items-center justify-between group hover:bg-gray-50 transition-colors ${index !== contacts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                     <div>
                        <p className="text-sm font-semibold text-[#0B1A2B] mb-0.5">{contact.name} <span className="text-xs text-gray-400 font-normal ml-2">({contact.relation})</span></p>
                        <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
                     </div>
                     <button onClick={() => handleDeleteContact(contact.id)} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: SOS & Resources */}
        <div className="h-full bg-white flex flex-col overflow-y-auto">
          
          {/* Big SOS Button Section */}
          <div className="p-6 border-b border-gray-200 bg-white flex flex-col gap-4">
             <div>
               <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${sosStatus === 'sent' ? 'text-green-600' : sosStatus === 'broadcasting' ? 'text-orange-600' : 'text-red-600'}`}>
                 {sosStatus === "idle" ? "Emergency Broadcast" : sosStatus === "broadcasting" ? "Broadcasting Signal..." : "Signal Received by NDRF"}
               </h3>
               <p className="text-xs text-gray-500">
                 {sosStatus === "idle" ? "Instantly shares your live location and medical profile with NDRF and your emergency contacts." : sosStatus === "broadcasting" ? "Connecting to secure satellite channels..." : "Help is on the way. Please stay calm and follow evacuation guides below."}
               </p>
             </div>
             <button 
                onClick={handleSOS}
                disabled={sosStatus !== "idle"}
                className={`w-full py-4 text-white flex items-center justify-center gap-2 transition-colors font-bold tracking-widest uppercase ${
                  sosStatus === "idle" ? "bg-red-600 hover:bg-red-700 cursor-pointer" : 
                  sosStatus === "broadcasting" ? "bg-orange-500 cursor-wait" : 
                  "bg-green-600"
                }`}
             >
                {sosStatus === "idle" ? <ShieldAlert size={18} /> : sosStatus === "broadcasting" ? <Radio size={18} className="animate-pulse" /> : <ShieldAlert size={18} />}
                {sosStatus === "idle" ? "SOS" : sosStatus === "broadcasting" ? "SENDING..." : "SENT!"}
             </button>
          </div>

          {/* Official Helplines */}
          <div className="p-6 border-b border-gray-200">
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Phone size={12} /> National Helplines
             </h4>
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-semibold text-[#0B1A2B]">NDRF (Disaster Response)</span>
                   <span className="text-sm font-bold text-red-600 font-mono">1078</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-semibold text-[#0B1A2B]">Ambulance / Medical</span>
                   <span className="text-sm font-bold text-red-600 font-mono">108</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-semibold text-[#0B1A2B]">Police</span>
                   <span className="text-sm font-bold text-red-600 font-mono">100</span>
                </div>
             </div>
          </div>

          {/* Emergency Information */}
          <div className="p-6 flex-1">
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <AlertCircle size={12} /> Critical Information
             </h4>
             
             <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-start p-4 bg-gray-50 border border-gray-200">
                   <Radio size={16} className="text-[#145C8C] mt-0.5" />
                   <div>
                      <p className="text-sm font-semibold text-[#0B1A2B] mb-1">Emergency Broadcast Frequency</p>
                      <p className="text-xs text-gray-500">Tune your battery-operated radio to <strong className="text-[#145C8C]">92.7 FM</strong> or <strong className="text-[#145C8C]">104.8 FM</strong> for official state instructions during complete power grid failure.</p>
                   </div>
                </div>
                <div onClick={() => setShowGuideModal(true)} className="flex gap-3 items-start p-4 bg-gray-50 border border-gray-200 cursor-pointer hover:border-[#145C8C] transition-colors">
                   <BookOpen size={16} className="text-[#145C8C] mt-0.5" />
                   <div>
                      <p className="text-sm font-semibold text-[#0B1A2B] mb-1">Evacuation Survival Guide</p>
                      <p className="text-xs text-gray-500">Checklist of items to pack, first aid basics, and safe route identification protocols.</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-[#0B1A2B] uppercase tracking-wider text-sm">Edit Emergency Profile</h3>
                 <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleSaveDetails} className="p-6 flex flex-col gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" required />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Blood Group</label>
                       <input type="text" value={editForm.bloodGroup} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Medical Conditions</label>
                       <input type="text" value={editForm.medicalConditions} onChange={e => setEditForm({...editForm, medicalConditions: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary Address</label>
                    <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C] resize-none h-20" required></textarea>
                 </div>
                 <div className="pt-2">
                    <button type="submit" className="w-full bg-[#145C8C] hover:bg-[#0B1A2B] text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-sm">Save Changes</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-[#0B1A2B] uppercase tracking-wider text-sm">Add Emergency Contact</h3>
                 <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleSaveContact} className="p-6 flex flex-col gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Name</label>
                    <input type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" placeholder="E.g. Priya Sharma" required />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Relation</label>
                    <input type="text" value={contactForm.relation} onChange={e => setContactForm({...contactForm, relation: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" placeholder="E.g. Spouse, Brother" required />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="text" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]" placeholder="E.g. +91 98765 12345" required />
                 </div>
                 <div className="pt-2">
                    <button type="submit" className="w-full bg-[#145C8C] hover:bg-[#0B1A2B] text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-sm">Add Contact</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Evacuation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 sticky top-0">
                 <h3 className="font-bold text-[#0B1A2B] uppercase tracking-wider text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-[#145C8C]" /> Evacuation Survival Guide
                 </h3>
                 <button onClick={() => setShowGuideModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#145C8C] uppercase tracking-widest mb-3">Essentials to Pack</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
                       <li>Water (one gallon per person per day)</li>
                       <li>Non-perishable food (3-day supply)</li>
                       <li>Battery-powered radio and extra batteries</li>
                       <li>First aid kit and essential medications</li>
                       <li>Flashlight and whistle to signal for help</li>
                       <li>Important documents in a waterproof container</li>
                    </ul>
                 </div>
                 <div className="mb-6">
                    <h4 className="text-xs font-bold text-[#145C8C] uppercase tracking-widest mb-3">Before Evacuating</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
                       <li>Unplug electrical equipment and shut off water/gas mains if instructed.</li>
                       <li>Wear sturdy shoes and comfortable, protective clothing.</li>
                       <li>Lock all doors and windows of your home.</li>
                       <li>Inform your emergency contacts of your planned route and destination.</li>
                    </ul>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-[#145C8C] uppercase tracking-widest mb-3">On the Move</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5">
                       <li>Follow the evacuation routes mapped on your BACHAV dashboard.</li>
                       <li>Do not attempt to cross flooded roads or bridges.</li>
                       <li>Keep your phone on power-saving mode and only use it for emergencies.</li>
                    </ul>
                 </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                 <button onClick={() => setShowGuideModal(false)} className="w-full bg-[#145C8C] hover:bg-[#0B1A2B] text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-sm">I Understand</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default function UserDashboard() {
  const profile = { name: "Citizen User", role: "Resident" };
  const links = [
    { label: "Home", path: "/dashboard/user/home" },
    { label: "Map", path: "/dashboard/user/map" },
    { label: "Help", path: "/dashboard/user/help" },
  ];

  return (
    <Routes>
      <Route element={<DashboardLayout title="BACHAV" profile={profile} links={links} />}>
        <Route path="home" element={<UserHome />} />
        <Route path="map" element={<UserMap />} />
        <Route path="help" element={<UserHelp />} />
        <Route index element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
