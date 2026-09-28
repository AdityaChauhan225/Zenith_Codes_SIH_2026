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
    <section id="features" className="w-full bg-[#0B1A2B] text-white py-16 md:py-24 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between text-sm font-bold mb-12 uppercase tracking-wide text-gray-400">
          <span>{sectionIndex} &mdash; {subtitle}</span>
        </div>

        <h2 className="text-5xl md:text-[80px] leading-[0.9] font-bold tracking-tighter mb-16 text-white max-w-4xl">
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-5 md:p-8 backdrop-blur-sm transition-all duration-300 ${feat.colSpan ?? "col-span-1 md:col-span-1"} flex flex-col justify-between group bg-white/5 border border-white/10 hover:border-transparent hover:bg-[#145C8C] text-white hover:shadow-[0_0_50px_rgba(20,92,140,0.35)] min-h-[250px] md:min-h-[300px] hover:scale-[1.02]`}
            >
              <div className="flex justify-between items-start mb-6 md:mb-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-white/10 group-hover:bg-white/20 text-[#1B7A8C] group-hover:text-white">
                  {feat.icon}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <h3 className="text-xl md:text-3xl font-bold mb-2 md:mb-3 tracking-tight">{feat.title}</h3>
                <p className="text-sm md:text-lg font-medium leading-relaxed text-gray-400 group-hover:text-white transition-colors">
                  {feat.desc}
                </p>
                {feat.extraInfo && (
                  <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-4">
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed pt-2 md:pt-4 border-t border-white/20">
                      {feat.extraInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
