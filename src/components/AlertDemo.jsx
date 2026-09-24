/**
 * AlertDemo — Static visual demonstration of the IMD/NDMA 4-stage severity scale.
 * Uses the kit's Badge and Card components.
 *
 * This is a presentational component for the landing page. It shows visitors
 * the standard Green → Yellow → Orange → Red alert scale used across
 * Indian disaster warning systems.
 */
import React from "react";
import { Badge } from "../ui-kit";
import { Shield, Eye, AlertTriangle, Siren } from "lucide-react";

const SEVERITY_LEVELS = [
  {
    variant: "severity-green",
    label: "Normal",
    desc: "No risk detected. Conditions stable.",
    icon: <Shield className="h-5 w-5" />,
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  {
    variant: "severity-yellow",
    label: "Advisory",
    desc: "Be watchful. Conditions may change.",
    icon: <Eye className="h-5 w-5" />,
    bgClass: "bg-yellow-500/10 border-yellow-500/20",
    textClass: "text-yellow-400",
  },
  {
    variant: "severity-orange",
    label: "Watch",
    desc: "Prepare to act. Risk rising.",
    icon: <AlertTriangle className="h-5 w-5" />,
    bgClass: "bg-orange-500/10 border-orange-500/20",
    textClass: "text-orange-400",
  },
  {
    variant: "severity-red",
    label: "Warning",
    desc: "Immediate action required.",
    icon: <Siren className="h-5 w-5" />,
    bgClass: "bg-red-500/10 border-red-500/20",
    textClass: "text-red-400",
  },
];

export function AlertDemo() {
  return (
    <section className="w-full bg-[#0B1A2B] text-white py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center text-sm font-bold mb-12 uppercase tracking-wide text-gray-400">
          <span>03 &mdash; Alert System</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 max-w-3xl">
          Standard four-stage warning scale.
        </h2>
        <p className="text-gray-400 font-medium text-lg max-w-2xl mb-16">
          Floodish uses the same Green–Yellow–Orange–Red severity scale
          mandated by IMD and NDMA. Every alert carries a clear, actionable
          risk level that responders already recognise.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEVERITY_LEVELS.map((level) => (
            <div
              key={level.variant}
              className={`rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] ${level.bgClass}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${level.bgClass} ${level.textClass}`}>
                {level.icon}
              </div>
              <div>
                <Badge variant={level.variant} className="mb-3">
                  {level.label}
                </Badge>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  {level.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mock live alert strip */}
        <div className="mt-12 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">Live Example</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">
              Chamoli District — Orange alert issued. Heavy rainfall expected in next 6 hours. Soil saturation at 87%. Prepare evacuation routes.
            </p>
          </div>
          <Badge variant="severity-orange">Watch</Badge>
        </div>
      </div>
    </section>
  );
}
