/**
 * RiskLevelWidget — Displays the current flood/landslide risk level
 * for a region using the IMD/NDMA severity palette.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  EXAMPLE WIDGET — Replace mock data with real API integration. │
 * │  This component demonstrates the widget pattern:               │
 * │  - Self-contained, single-responsibility                       │
 * │  - Uses kit's Card + Badge components                          │
 * │  - Reads from props or internal state (mock data for now)      │
 * └─────────────────────────────────────────────────────────────────┘
 */
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "../../ui-kit";
import { ShieldAlert } from "lucide-react";

const RISK_LEVELS = {
  green:  { label: "Normal",   variant: "severity-green",  color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "No flood risk detected. Conditions are stable across all monitored zones." },
  yellow: { label: "Advisory", variant: "severity-yellow", color: "text-yellow-400",  bg: "bg-yellow-500/10",  desc: "Be watchful. Moderate rainfall expected. Soil moisture rising in select areas." },
  orange: { label: "Watch",    variant: "severity-orange", color: "text-orange-400",  bg: "bg-orange-500/10",  desc: "Prepare to act. Heavy rainfall in progress. Soil saturation nearing critical levels." },
  red:    { label: "Warning",  variant: "severity-red",    color: "text-red-400",     bg: "bg-red-500/10",     desc: "Immediate action required. Flash flood imminent or in progress." },
};

export function RiskLevelWidget({ level = "yellow", region = "Chamoli District" }) {
  const risk = RISK_LEVELS[level] || RISK_LEVELS.green;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ShieldAlert className="h-4 w-4 text-[#1B7A8C]" />
          Current Risk Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`rounded-xl p-4 ${risk.bg} mb-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-3xl font-bold ${risk.color}`}>
              {risk.label}
            </span>
            <Badge variant={risk.variant}>{risk.label}</Badge>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {risk.desc}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Region: {region}</span>
          <span>Updated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
