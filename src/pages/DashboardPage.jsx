/**
 * DashboardPage — Persistent shell wrapping all dashboard routes.
 *
 * Uses the kit's DashboardShell with navigation driven by
 * dashboardNavConfig.js. Child routes render inside the shell.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  HOW TO ADD A NEW DASHBOARD ROUTE                              │
 * │                                                                │
 * │  1. Add a nav entry in src/config/dashboardNavConfig.js        │
 * │  2. Create the page component in src/pages/dashboard/          │
 * │  3. Add a <Route> below in the <Routes> block                  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * AUTH INTEGRATION POINT:
 * The `profile` and `onLogout` props are currently mocked.
 * When auth is implemented:
 *   - Replace `profile` with the authenticated user's data
 *   - Replace `onLogout` with real logout/token-clear logic
 *   - Wrap this page in a ProtectedRoute or auth guard
 */
import React from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardShell } from "../ui-kit";
import dashboardNavConfig from "../config/dashboardNavConfig";
import DashboardOverview from "./dashboard/DashboardOverview";
import PlaceholderPage from "./dashboard/PlaceholderPage";

/* ── Mock profile — replace with authenticated user data ── */
const mockProfile = {
  name: "District Officer",
  role: "Chamoli, Uttarakhand",
};

/* ── Mock notifications ── */
const mockNotifications = [
  {
    id: 1,
    title: "Orange Alert — Chamoli",
    message: "Heavy rainfall expected. Soil saturation at 87%. Prepare evacuation routes.",
    time: "14m ago",
    read: false,
  },
  {
    id: 2,
    title: "Sensor Offline — Station K7",
    message: "Rain gauge at Joshimath node K7 went offline. Last reading: 42mm/hr.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    title: "Alert Downgraded — Pithoragarh",
    message: "Flash flood risk reduced to Yellow. Continue monitoring.",
    time: "3h ago",
    read: true,
  },
];

export default function DashboardPage() {
  /**
   * TODO: Replace with real logout logic.
   * Clear auth tokens, redirect to landing page.
   */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleMarkAllRead = () => {
    // TODO: Implement mark-all-read API call
  };

  return (
    <DashboardShell
      profile={mockProfile}
      links={dashboardNavConfig}
      notifications={mockNotifications}
      onLogout={handleLogout}
      onMarkAllRead={handleMarkAllRead}
      accentColor="#145C8C"
      dashboardLabel="Floodish"
    >
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="alerts" element={<PlaceholderPage title="Active Alerts" />} />
        <Route path="map" element={<PlaceholderPage title="Risk Map" />} />
        <Route path="forecasts" element={<PlaceholderPage title="Forecasts" />} />
        <Route path="sensors" element={<PlaceholderPage title="Sensor Data" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Routes>
    </DashboardShell>
  );
}
