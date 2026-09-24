/**
 * FeaturesSection — dark bento-grid features section.
 *
 * Props:
 *   sectionIndex — section number label (default: "01")
 *   subtitle     — subtitle tag (default: "Platform Features")
 *   title        — main heading (default: "Everything you need, built into one platform.")
 *   features     — array of:
 *     { icon: ReactNode, title, desc, colSpan?: "col-span-1 md:col-span-2" | "col-span-1 md:col-span-1", highlight?: bool }
 */
import React from "react";

export function FeaturesSection({
  sectionIndex = "01",
  subtitle = "Platform Features",
  title = "Everything you need, built into one platform.",
  features = [],
}) {
  return (
    <section id="features" className="w-full bg-[#0B1A2B] text-white py-24 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between text-sm font-bold mb-12 uppercase tracking-wide text-gray-400">
          <span>{sectionIndex} &mdash; {subtitle}</span>
        </div>

        <h2 className="text-5xl md:text-[80px] leading-[0.9] font-bold tracking-tighter mb-16 text-white max-w-4xl">
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 ${feat.colSpan ?? "col-span-1 md:col-span-1"} flex flex-col justify-between group ${
                feat.highlight
                  ? "bg-[#145C8C] text-white shadow-[0_0_40px_rgba(20,92,140,0.25)] hover:shadow-[0_0_50px_rgba(20,92,140,0.35)]"
                  : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
              }`}
            >
              <div className={`mb-12 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${feat.highlight ? "bg-white/15" : "bg-white/10"}`}>
                {feat.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">{feat.title}</h3>
                <p className={`font-medium leading-relaxed ${feat.highlight ? "text-white/70" : "text-gray-400"}`}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
