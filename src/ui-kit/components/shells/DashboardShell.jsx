/**
 * DashboardShell — Universal dark sidebar + topbar dashboard layout.
 *
 * This is the CORE reusable shell. All 5 role-specific shells wrap this.
 * You can use this directly for any new project.
 *
 * Props:
 *   profile           — { name, role, avatar? }
 *   links             — array of nav sections:
 *                       [{ section: "Main", items: [{ icon: LucideIcon, label, href, active }] }]
 *   notifications     — array of { id, title, message, time, read }
 *   onLogout          — () => void
 *   onMarkAllRead     — () => void
 *   accentColor       — primary accent color hex (default: "#145C8C")
 *   dashboardLabel    — top-bar label (default: "Dashboard")
 *   topbarActions     — extra ReactNode rendered before notifications button (optional)
 *   children          — page content
 *
 * Dependencies: lucide-react, react-router-dom
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, PanelLeftClose, Menu, Settings, LogOut } from "lucide-react";

const NavItem = ({ icon: Icon, label, href, active, isCollapsed, accentColor }) => (
  <Link
    to={href}
    className={`flex items-center py-2 rounded-lg text-sm transition-colors ${
      isCollapsed ? "justify-center w-10 h-10" : "px-3 gap-3 w-full"
    } ${
      active
        ? "text-[#0B1A2B] font-medium"
        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
    }`}
    style={active ? { backgroundColor: accentColor } : {}}
    title={isCollapsed ? label : undefined}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
  </Link>
);

const SidebarSection = ({ title, children, isCollapsed }) => (
  <div className="mb-6">
    {!isCollapsed && (
      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 px-3 whitespace-nowrap overflow-hidden">
        {title}
      </h4>
    )}
    <div className="flex flex-col gap-0.5 items-center">{children}</div>
  </div>
);

export function DashboardShell({
  profile = { name: "User", role: "Member" },
  links = [],
  notifications = [],
  onLogout,
  onMarkAllRead,
  accentColor = "#145C8C",
  dashboardLabel = "Dashboard",
  topbarActions = null,
  children,
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen w-full bg-[#071420] text-white overflow-hidden">

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={`fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col border-r border-neutral-800 bg-[#071420] ${
          isCollapsed && !isMobileMenuOpen ? "w-[70px] hidden lg:flex" : "w-[260px]"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo Area */}
        <div className={`h-16 flex items-center border-b border-neutral-800 shrink-0 ${isCollapsed && !isMobileMenuOpen ? "justify-center" : "px-4"}`}>
          <div className={`flex items-center gap-2 ${!isCollapsed || isMobileMenuOpen ? "w-full" : ""}`}>
            <div className="flex flex-wrap gap-[2px] w-4 h-4 shrink-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-[6px] h-[6px] rounded-sm" style={{ backgroundColor: accentColor }} />
              ))}
            </div>
            {(!isCollapsed || isMobileMenuOpen) && <span className="font-bold tracking-wide whitespace-nowrap overflow-hidden">{dashboardLabel.split(" ")[0]}</span>}
          </div>
          {isMobileMenuOpen && (
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-white ml-auto">
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Sidebar Nav */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? "p-2" : "p-4"}`}>
          {links.map((section) => (
            <SidebarSection key={section.section} title={section.section} isCollapsed={isCollapsed && !isMobileMenuOpen}>
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={item.active ?? (currentPath === item.href || currentPath.startsWith(item.href + "/"))}
                  isCollapsed={isCollapsed && !isMobileMenuOpen}
                  accentColor={accentColor}
                />
              ))}
            </SidebarSection>
          ))}
        </div>

        {/* Footer */}
        <div className={`border-t border-neutral-800 shrink-0 ${isCollapsed ? "p-2 flex flex-col items-center" : "p-4"}`}>
          {!isCollapsed && (
            <div className="px-3 text-[10px] text-neutral-600 whitespace-nowrap overflow-hidden text-ellipsis">
              © {new Date().getFullYear()} {dashboardLabel.split(" ")[0]}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOPBAR */}
        <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-neutral-800 bg-[#071420] shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-neutral-400 hover:text-white transition cursor-pointer">
              <Menu className="h-6 w-6" />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block text-neutral-400 hover:text-white transition cursor-pointer">
              <PanelLeftClose className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-white">
              {dashboardLabel}
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {topbarActions}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
                className="p-2 rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition relative cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-[#071420]" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-12 mt-2 w-80 bg-[#0B1A2B] border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-2">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 mb-2">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="h-4 w-4" style={{ color: accentColor }} /> Notifications
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={onMarkAllRead} className="text-[10px] hover:underline cursor-pointer" style={{ color: accentColor }}>Mark all read</button>
                    )}
                  </div>
                  <div className="flex flex-col max-h-72 overflow-y-auto px-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`p-3 mb-1 rounded-lg text-xs border ${n.read ? "bg-transparent border-transparent text-neutral-400" : "bg-neutral-800/40 border-neutral-700/30 text-neutral-200"}`}>
                        <div className="flex justify-between font-bold mb-1">
                          <span className={n.read ? "text-neutral-300" : "text-white"}>{n.title}</span>
                          <span className="text-[10px] text-neutral-500">{n.time}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-neutral-500 text-xs">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
                className="h-8 w-8 rounded-full overflow-hidden border border-neutral-800 ml-2 focus:outline-none cursor-pointer hover:border-neutral-600 transition"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-neutral-800 text-xs font-bold text-white">
                    {profile.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-12 mt-2 w-56 bg-[#0B1A2B] border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-2">
                  <div className="px-4 py-3 border-b border-neutral-800 mb-2">
                    <div className="text-sm font-bold text-white">{profile.name}</div>
                    <div className="text-xs text-neutral-500">{profile.role}</div>
                  </div>
                  <div className="border-t border-neutral-800 mt-2 pt-2">
                    <button
                      onClick={() => { setIsProfileOpen(false); onLogout && onLogout(); }}
                      className="w-full flex items-center justify-start gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition font-medium cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-[#071420]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardShell;
