import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Bell, X, Camera } from 'lucide-react';

export function DashboardLayout({ title = "BACHAV", links = [], profile }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewAllNotifications, setViewAllNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState({
    name: profile?.name || "Citizen User",
    email: "citizen@example.com",
    phone: "+91 98765 43210",
    bloodGroup: "O+",
    photoUrl: ""
  });
  return (
    <div className="min-h-[100dvh] bg-white text-[#0B1A2B] font-sans flex flex-col pb-16 md:pb-0 selection:bg-[#145C8C] selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200">
        
        {/* Left: Logo */}
        <div className="flex items-center cursor-pointer w-1/3" onClick={() => navigate('/')}>
          <span className="font-extrabold text-lg tracking-[0.2em] text-[#0B1A2B] uppercase">
            {title}<span className="text-[#145C8C] text-xl leading-none">.</span>
          </span>
        </div>
        
        {/* Center: Navigation Links */}
        <nav className="hidden md:flex gap-8 justify-center w-1/3">
          {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-[#0B1A2B] ${isActive ? 'text-[#145C8C] font-semibold' : 'text-gray-500'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        
        {/* Right: Profile Section */}
        <div className="flex items-center justify-end gap-4 w-1/3 relative">
          <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${showNotifications ? 'bg-gray-100 border-gray-300 text-[#0B1A2B]' : 'border-gray-200 text-gray-500 hover:text-[#0B1A2B] hover:border-gray-300'}`}
          >
            <Bell size={14} />
          </button>
          
          {/* Notifications toggle handles state */}
          <div 
            onClick={() => setShowProfile(true)}
            className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer overflow-hidden hover:border-gray-300 hover:text-[#0B1A2B] transition-colors bg-center bg-cover"
            style={{ backgroundImage: userData.photoUrl ? `url(${userData.photoUrl})` : 'none' }}
          >
            {!userData.photoUrl && <User size={16} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      
      {/* Mobile Nav */}
      <div className="md:hidden bg-white text-[#0B1A2B] flex justify-around items-center p-4 fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200">
         {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => 
                `text-xs font-medium transition-colors ${isActive ? 'text-[#145C8C] font-semibold' : 'text-gray-500'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-[#0B1A2B]">Profile Settings</h3>
                 <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
                 
                 {/* Photo Upload */}
                 <div className="flex flex-col items-center gap-3">
                    <label 
                      className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-[#145C8C] hover:text-[#145C8C] transition-colors relative overflow-hidden bg-center bg-cover"
                      style={{ backgroundImage: userData.photoUrl ? `url(${userData.photoUrl})` : 'none' }}
                    >
                       <input 
                         type="file" 
                         accept="image/*"
                         className="hidden" 
                         onChange={(e) => {
                           const file = e.target.files[0];
                           if(file) {
                             const url = URL.createObjectURL(file);
                             setUserData({...userData, photoUrl: url});
                           }
                         }}
                       />
                       {!userData.photoUrl && <Camera size={24} />}
                    </label>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Update Photo</span>
                 </div>

                 {/* Personal Info */}
                 <div className="flex flex-col gap-4">
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                       <input 
                         type="text" 
                         value={userData.name}
                         onChange={(e) => setUserData({...userData, name: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                       <input 
                         type="email" 
                         value={userData.email}
                         onChange={(e) => setUserData({...userData, email: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                          <input 
                            type="text" 
                            value={userData.phone}
                            onChange={(e) => setUserData({...userData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C]"
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Blood Group</label>
                          <select 
                            value={userData.bloodGroup}
                            onChange={(e) => setUserData({...userData, bloodGroup: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#145C8C] focus:ring-1 focus:ring-[#145C8C] bg-white"
                          >
                             <option>A+</option><option>A-</option>
                             <option>B+</option><option>B-</option>
                             <option>O+</option><option>O-</option>
                             <option>AB+</option><option>AB-</option>
                          </select>
                       </div>
                    </div>
                 </div>

              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <button onClick={() => setShowProfile(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                    Cancel
                 </button>
                 <button onClick={() => setShowProfile(false)} className="px-4 py-2 bg-[#145C8C] hover:bg-[#104e78] text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                    Save Changes
                 </button>
              </div>

           </div>
        </div>
      )}
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-[#0B1A2B] uppercase tracking-wider text-sm">Notifications</h3>
                 <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex flex-col max-h-[60vh] overflow-y-auto">
                 <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-[#145C8C] transition-colors">
                    <p className="text-sm text-[#0B1A2B] font-semibold mb-1">Evacuation Route Updated</p>
                    <p className="text-xs text-gray-500">Route 4 is currently blocked due to flooding.</p>
                 </div>
                 <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-[#145C8C] transition-colors">
                    <p className="text-sm text-[#0B1A2B] font-semibold mb-1">Heavy Rainfall Alert</p>
                    <p className="text-xs text-gray-500">Expected 45mm/h rain in your area in 2 hours.</p>
                 </div>
                 
                 {viewAllNotifications && (
                   <>
                     <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-[#145C8C] transition-colors opacity-80">
                        <p className="text-sm text-[#0B1A2B] font-semibold mb-1">Supplies Delivered</p>
                        <p className="text-xs text-gray-500">Food and water drop completed at Zone A.</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">3 hours ago</p>
                     </div>
                     <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-[#145C8C] transition-colors opacity-80">
                        <p className="text-sm text-[#0B1A2B] font-semibold mb-1">Power Outage Warning</p>
                        <p className="text-xs text-gray-500">Grid maintenance scheduled for 18:00 local time.</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">5 hours ago</p>
                     </div>
                     <div className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-[#145C8C] transition-colors opacity-80">
                        <p className="text-sm text-[#0B1A2B] font-semibold mb-1">System Update</p>
                        <p className="text-xs text-gray-500">BACHAV network has been updated to v2.4.</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">1 day ago</p>
                     </div>
                   </>
                 )}
              </div>
              
              <div 
                className="p-3 text-center border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" 
                onClick={() => setViewAllNotifications(!viewAllNotifications)}
              >
                 <span className="text-xs text-[#145C8C] font-semibold uppercase tracking-widest">
                   {viewAllNotifications ? 'Show Less' : 'View All'}
                 </span>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
