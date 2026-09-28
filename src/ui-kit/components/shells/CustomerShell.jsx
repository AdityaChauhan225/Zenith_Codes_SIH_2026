/**
 * CustomerShell — Pre-configured DashboardShell for customer/user dashboards.
 */
import React from "react";
import { LayoutDashboard, Car, Home, History, Wrench, MessageSquare, CreditCard, Settings } from "lucide-react";
import { DashboardShell } from "./DashboardShell";

const DEFAULT_LINKS = (basePath = "/customer") => [
  {
    section: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",    href: `${basePath}` },
      { icon: Car,             label: "Vehicles",     href: `${basePath}/vehicles` },
      { icon: Home,            label: "Properties",   href: `${basePath}/properties` },
      { icon: Wrench,          label: "Mechanic Help", href: `${basePath}/mechanic` },
    ],
  },
  {
    section: "Account",
    items: [
      { icon: History,       label: "Rentals",        href: `${basePath}/rentals` },
      { icon: CreditCard,    label: "Billing",        href: `${basePath}/billing` },
      { icon: MessageSquare, label: "Messages",       href: `${basePath}/communications` },
      { icon: Settings,      label: "Settings",       href: `${basePath}/settings` },
    ],
  },
];

export function CustomerShell({
  basePath = "/customer",
  links,
  profile = { name: "Customer", role: "Customer Account" },
  ...rest
}) {
  return (
    <DashboardShell
      dashboardLabel="Customer Dashboard"
      profile={profile}
      links={links ?? DEFAULT_LINKS(basePath)}
      accentColor="#145C8C"
      {...rest}
    />
  );
}

export default CustomerShell;
