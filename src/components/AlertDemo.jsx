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
    variant: "neon",
    label: "Normal",
    desc: "No risk detected. Conditions stable.",
    icon: <Shield className="h-7 w-7" />,
  },
  {
    variant: "neon",
    label: "Advisory",
    desc: "Be watchful. Conditions may change.",
    icon: <Eye className="h-7 w-7" />,
  },
  {
    variant: "neon",
    label: "Watch",
    desc: "Prepare to act. Risk rising.",
    icon: <AlertTriangle className="h-7 w-7" />,
  },
  {
    variant: "neon",
    label: "Warning",
    desc: "Immediate action required.",
    icon: <Siren className="h-7 w-7" />,
  },
];

export function AlertDemo() {
  return (
    <section className="w-full min-h-screen bg-[#0B1A2B] text-white py-24 px-6 md:px-12 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center text-sm font-bold mb-12 uppercase tracking-wide text-[#1B7A8C]">
          <span>03 &mdash; Alert System</span>
        </div>

        <h2 className="text-5xl md:text-[80px] leading-[0.9] font-bold tracking-tighter mb-8 max-w-4xl">
          Standard four-stage warning scale.
        </h2>
        <p className="text-gray-400 font-medium text-xl max-w-2xl mb-16 leading-relaxed">
          BACHAV uses a clear, four-stage severity scale mandated by IMD and NDMA. Every alert carries a distinct, actionable
          risk level that responders already recognise, mapped uniformly to our platform UI.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SEVERITY_LEVELS.map((level) => (
            <div
              key={level.variant}
              className="rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between group bg-white/5 border border-white/10 hover:border-transparent hover:bg-[#145C8C] text-white hover:shadow-[0_0_50px_rgba(20,92,140,0.35)] min-h-[250px]"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-[#145C8C]/20 group-hover:bg-white/15 text-[#1B7A8C] group-hover:text-white">
                  {level.icon}
                </div>
                <Badge variant={level.variant} className="group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors">
                  {level.label}
                </Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3 tracking-tight">{level.label} Alert</h3>
                <p className="text-lg font-medium leading-relaxed text-gray-400 group-hover:text-white/70 transition-colors">
                  {level.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
