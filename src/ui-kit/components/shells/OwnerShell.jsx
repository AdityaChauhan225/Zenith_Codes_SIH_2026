/**
 * OwnerShell — Pre-configured DashboardShell for property owner dashboards.
 */
import React from "react";
import { LayoutDashboard, Home, Calendar, AlertTriangle, MessageSquare, BookOpen, Settings } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const DEFAULT_LINKS = (basePath = "/owner") => [
  {
    section: "Properties",
    items: [
      { icon: LayoutDashboard, label: "Overview",       href: `${basePath}` },
      { icon: Home,            label: "My Properties",  href: `${basePath}/properties` },
      { icon: Calendar,        label: "Bookings",       href: `${basePath}/bookings` },
      { icon: AlertTriangle,   label: "Issues",         href: `${basePath}/issues` },
    ],
  },
  {
    section: "Communication",
    items: [
      { icon: MessageSquare, label: "Communications", href: `${basePath}/communications` },
      { icon: BookOpen,      label: "History",        href: `${basePath}/history` },
      { icon: Settings,      label: "Settings",       href: `${basePath}/settings` },
    ],
  },
];

export function OwnerShell({
  basePath = "/owner",
  links,
  profile = { name: "Property Owner", role: "Owner" },
  ...rest
}) {
  return (
    <DashboardShell
      dashboardLabel="Owner Dashboard"
      profile={profile}
      links={links ?? DEFAULT_LINKS(basePath)}
      accentColor="#145C8C"
      {...rest}
    />
  );
}

export default OwnerShell;
