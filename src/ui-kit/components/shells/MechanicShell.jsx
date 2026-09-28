/**
 * MechanicShell — Pre-configured DashboardShell for mechanic dashboards.
 */
import React from "react";
import { LayoutDashboard, Wrench, Navigation, History, Star, User, MessageSquare } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const DEFAULT_LINKS = (basePath = "/mechanic") => [
  {
    section: "Work",
    items: [
      { icon: LayoutDashboard, label: "Overview",    href: `${basePath}` },
      { icon: Wrench,          label: "Jobs",        href: `${basePath}/jobs` },
      { icon: Navigation,      label: "Navigation",  href: `${basePath}/navigation` },
      { icon: History,         label: "History",     href: `${basePath}/history` },
    ],
  },
  {
    section: "Profile",
    items: [
      { icon: Star,          label: "Reviews",        href: `${basePath}/reviews` },
      { icon: MessageSquare, label: "Communications", href: `${basePath}/communications` },
      { icon: User,          label: "Profile",        href: `${basePath}/profile` },
    ],
  },
];

export function MechanicShell({
  basePath = "/mechanic",
  links,
  profile = { name: "Mechanic", role: "Field Mechanic" },
  ...rest
}) {
  return (
    <DashboardShell
      dashboardLabel="Mechanic Dashboard"
      profile={profile}
      links={links ?? DEFAULT_LINKS(basePath)}
      accentColor="#145C8C"
      {...rest}
    />
  );
}

export default MechanicShell;
