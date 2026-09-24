/**
 * App.jsx — Root application component with top-level routing.
 *
 * Routes:
 *   /              → Landing page (public)
 *   /dashboard/*   → Dashboard shell with nested pages (eventually protected)
 */
import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard/*" element={<DashboardPage />} />
    </Routes>
  );
}
