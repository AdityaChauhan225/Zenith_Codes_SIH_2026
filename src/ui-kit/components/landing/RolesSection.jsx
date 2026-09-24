/**
 * RolesSection — Horizontal-scroll role/audience cards with trust strip.
 *
 * Props:
 *   sectionIndex  — section number label (default: "03")
 *   title         — main heading (default: "Built for everyone.")
 *   cards         — array of { icon: ReactNode, tag, title, desc }
 *   trustPoints   — array of string bullet points for the trust strip
 *   trustHeading  — heading for trust strip (default: "Built with security and privacy first.")
 */
import React from "react";

export function RolesSection({
  sectionIndex = "03",
  title = "Built for everyone.",
  cards = [],
  trustPoints = [],
  trustHeading = "Built with security and privacy first.",
}) {
  return (
    <section id="roles" className="w-full bg-[#EFF3F6] text-[#0B1A2B] py-24 pl-6 md:pl-12 pr-0 overflow-hidden">
      <div className="flex justify-between items-center text-sm font-bold mb-12 uppercase tracking-wide pr-6 md:pr-12">
        <span>{sectionIndex} &mdash; Who It's For</span>
      </div>

      <h2 className="text-5xl md:text-[100px] leading-[0.9] font-bold tracking-tighter mb-16 pr-6 md:pr-12">
        {title}
      </h2>

      {/* HORIZONTAL SCROLL CARDS */}
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar pr-6 md:pr-12">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="min-w-[300px] md:min-w-[400px] bg-[#0B1A2B] text-white p-8 snap-center flex flex-col justify-between aspect-square md:aspect-[4/3] group cursor-pointer hover:bg-gray-900 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:text-[#145C8C] transition-all">
              {card.icon}
            </div>
            <div className="flex justify-between items-start mb-12">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-white">
                {card.tag}
              </span>
            </div>
            <div>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">{card.title}</h3>
              <p className="text-gray-400 font-medium mt-4">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TRUST STRIP */}
      {(trustPoints.length > 0 || trustHeading) && (
        <div className="mt-24 pr-6 md:pr-12">
          <div className="border-t border-gray-300 pt-12 flex flex-col md:flex-row justify-between">
            <div className="md:w-1/3 mb-8 md:mb-0">
              <h3 className="text-3xl font-bold tracking-tight">{trustHeading}</h3>
            </div>
            <div className="md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm font-medium text-gray-600">
              {trustPoints.map((pt, i) => (
                <p key={i} className="mb-2">✓ {pt}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
