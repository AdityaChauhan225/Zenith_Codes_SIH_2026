/**
 * App.jsx — Root application component with top-level routing.
 *
 * Routes:
 *   /              → Landing page (public)
 *   /dashboard/*   → Dashboard shell with nested pages (eventually protected)
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AuthoritiesDashboard from "./pages/dashboard/AuthoritiesDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/users/*" element={<UserDashboard />} />
      <Route path="/authorities/*" element={<AuthoritiesDashboard />} />
      {/* Backward-compatible aliases */}
      <Route path="/dashboard/user/*" element={<Navigate to="/users/home" replace />} />
      <Route path="/dashboard/authorities/*" element={<Navigate to="/authorities/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
