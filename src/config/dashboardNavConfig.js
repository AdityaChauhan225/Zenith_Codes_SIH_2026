/**
 * dashboardNavConfig.js — Single source of truth for dashboard sidebar navigation.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  HOW TO ADD A NEW NAV ITEM                                        │
 * │                                                                   │
 * │  1. Import the icon from lucide-react at the top of this file.    │
 * │  2. Add an object to the `items` array of the relevant section:   │
 * │     { icon: YourIcon, label: "Your Label", href: "/dashboard/x" } │
 * │  3. Create the matching route component in src/pages/dashboard/.  │
 * │  4. Register the route in src/pages/DashboardPage.jsx <Routes>.   │
 * │                                                                   │
 * │  That's it — the sidebar renders automatically from this config.  │
 * └─────────────────────────────────────────────────────────────────────┘
 */
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  BarChart3,
  Database,
  Settings,
} from "lucide-react";

const dashboardNavConfig = [
  {
    section: "Monitoring",
    items: [
      { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
      { icon: AlertTriangle, label: "Active Alerts", href: "/dashboard/alerts" },
      { icon: Map, label: "Risk Map", href: "/dashboard/map" },
    ],
  },
  {
    section: "Analysis",
    items: [
      { icon: BarChart3, label: "Forecasts", href: "/dashboard/forecasts" },
      { icon: Database, label: "Sensor Data", href: "/dashboard/sensors" },
    ],
  },
  {
    section: "System",
    items: [
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

export default dashboardNavConfig;
