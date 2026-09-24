/**
 * StaffShell — Pre-configured DashboardShell for staff/property-manager dashboards.
 */
import React from "react";
import { LayoutDashboard, Wrench, User, MessageSquare } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const DEFAULT_LINKS = (basePath = "/staff") => [
  {
    section: "Operations",
    items: [
      { icon: LayoutDashboard, label: "Overview",       href: `${basePath}` },
      { icon: Wrench,          label: "Assigned Issues", href: `${basePath}/issues` },
      { icon: MessageSquare,   label: "Communications", href: `${basePath}/communications` },
      { icon: User,            label: "Profile",        href: `${basePath}/profile` },
    ],
  },
];

export function StaffShell({
  basePath = "/staff",
  links,
  profile = { name: "Staff Member", role: "Property Manager" },
  ...rest
}) {
  return (
    <DashboardShell
      dashboardLabel="Staff Dashboard"
      profile={profile}
      links={links ?? DEFAULT_LINKS(basePath)}
      accentColor="#145C8C"
      {...rest}
    />
  );
}

export default StaffShell;
