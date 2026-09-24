/**
 * AdminShell — Pre-configured DashboardShell for admin/super-user dashboards.
 *
 * Props: same as DashboardShell, but with admin-specific default nav links.
 * You can override `links` to replace with your own navigation.
 *
 * Default links cover: Overview, Users, Vehicles, Bookings, Maintenance, Finance, Live Ops, Comms, Reviews, Settings
 */
import React from "react";
import {
  LayoutDashboard, Users, Car, Calendar, Wrench, CreditCard,
  Map, MessageSquare, Star, Settings, FileText, ShieldCheck, Bell, BarChart
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const DEFAULT_LINKS = (basePath = "/admin") => [
  {
    section: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Overview", href: `${basePath}` },
      { icon: BarChart,        label: "Analytics", href: `${basePath}/analytics` },
    ],
  },
  {
    section: "Management",
    items: [
      { icon: Users,    label: "Users",      href: `${basePath}/users` },
      { icon: Car,      label: "Vehicles",   href: `${basePath}/vehicles` },
      { icon: Calendar, label: "Bookings",   href: `${basePath}/bookings` },
      { icon: Wrench,   label: "Issues",     href: `${basePath}/issues` },
      { icon: Users,    label: "Mechanics",  href: `${basePath}/mechanics` },
      { icon: Users,    label: "Staff",      href: `${basePath}/staff` },
    ],
  },
  {
    section: "Operations",
    items: [
      { icon: Map,          label: "Live Ops",       href: `${basePath}/live` },
      { icon: CreditCard,   label: "Payments",       href: `${basePath}/payments` },
      { icon: MessageSquare, label: "Communications", href: `${basePath}/communications` },
      { icon: Star,         label: "Reviews",        href: `${basePath}/reviews` },
      { icon: FileText,     label: "Audit Logs",     href: `${basePath}/audit` },
      { icon: Bell,         label: "Notifications",  href: `${basePath}/notifications` },
    ],
  },
  {
    section: "System",
    items: [
      { icon: ShieldCheck, label: "Roles",    href: `${basePath}/roles` },
      { icon: Settings,    label: "Settings", href: `${basePath}/settings` },
    ],
  },
];

export function AdminShell({
  basePath = "/admin",
  links,
  profile = { name: "Admin", role: "Super Admin" },
  ...rest
}) {
  return (
    <DashboardShell
      dashboardLabel="Admin Dashboard"
      profile={profile}
      links={links ?? DEFAULT_LINKS(basePath)}
      accentColor="#145C8C"
      {...rest}
    />
  );
}

export default AdminShell;
