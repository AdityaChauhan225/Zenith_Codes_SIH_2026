/**
 * OverviewPage — Universal dashboard overview template with stat cards,
 * activity feed, and quick-actions grid.
 *
 * Props:
 *   title       — page heading (default: "Overview")
 *   stats       — array of { label, value, change?, changeType?: "up"|"down"|"neutral", icon: ReactNode, color?: "neon"|"blue"|"emerald"|"amber"|"red" }
 *   activities  — array of { id, title, desc, time, type?: "success"|"warning"|"error"|"info" }
 *   quickLinks  — array of { icon: ReactNode, label, href, desc? }
 *   accentColor — default: "#145C8C"
 */
import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const colorMap = {
  neon:    "bg-[#145C8C]/10 text-[#145C8C] border-[#145C8C]/20",
  blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red:     "bg-red-500/10 text-red-400 border-red-500/20",
};

export function OverviewPage({
  title = "Overview",
  stats = [],
  activities = [],
  quickLinks = [],
  accentColor = "#145C8C",
}) {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* STAT CARDS */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const colorClass = colorMap[stat.color ?? "neon"] ?? colorMap.neon;
            return (
              <div key={i} className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
                </div>
                {stat.change != null && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.changeType === "up" ? "text-emerald-400" : stat.changeType === "down" ? "text-red-400" : "text-neutral-400"}`}>
                    {stat.changeType === "up" ? <TrendingUp className="h-3 w-3" /> : stat.changeType === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITY FEED */}
        {activities.length > 0 && (
          <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activities.map((act) => {
                const dotColor = act.type === "success" ? "bg-emerald-400" : act.type === "warning" ? "bg-amber-400" : act.type === "error" ? "bg-red-400" : "bg-blue-400";
                return (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition">
                    <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{act.title}</div>
                      {act.desc && <div className="text-xs text-neutral-500 mt-0.5 truncate">{act.desc}</div>}
                    </div>
                    <div className="text-[10px] text-neutral-600 shrink-0">{act.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QUICK LINKS */}
        {quickLinks.length > 0 && (
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 transition group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-800 group-hover:bg-neutral-700 transition text-neutral-400 group-hover:text-white">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-300 group-hover:text-white transition">{link.label}</div>
                    {link.desc && <div className="text-xs text-neutral-600 truncate">{link.desc}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
