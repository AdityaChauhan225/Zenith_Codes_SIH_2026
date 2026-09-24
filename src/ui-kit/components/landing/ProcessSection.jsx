/**
 * ProcessSection — Light-bg "how it works" section with numbered steps
 * and a neon summary card.
 *
 * Props:
 *   sectionIndex  — section number label (default: "02")
 *   bigText       — big text on the left (default: ["we", "connect."])
 *   steps         — array of { icon: ReactNode, title, desc }
 *   problemTitle  — heading in the neon card left side (default: "The Old Way")
 *   problemDesc   — text in neon card left side
 *   solutionTitle — heading in neon card right side (default: "Our Solution")
 *   solutionDesc  — text in neon card right side
 */
import React from "react";

export function ProcessSection({
  sectionIndex = "02",
  bigText = ["we", "connect."],
  steps = [],
  problemTitle = "The Old Way",
  problemDesc = "Fragmented tools with no unified solution.",
  solutionTitle = "Our Solution",
  solutionDesc = "Everything in one connected platform.",
}) {
  return (
    <section id="how-it-works" className="w-full bg-[#EFF3F6] text-[#0B1A2B] py-24 px-6 md:px-12 flex flex-col md:flex-row justify-between">

      {/* LEFT — big text */}
      <div className="w-full md:w-1/2 mb-12 md:mb-0">
        <div className="flex items-center text-sm font-bold mb-12 uppercase tracking-wide">
          <span>{sectionIndex} &mdash; How it works</span>
        </div>
        <h2 className="text-[90px] md:text-[160px] leading-[0.8] font-bold tracking-tighter">
          {bigText.map((line, i) => (
            <React.Fragment key={i}>{line}{i < bigText.length - 1 && <br />}</React.Fragment>
          ))}
        </h2>
      </div>

      {/* RIGHT — steps */}
      <div className="w-full md:w-1/2 flex flex-col pt-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`border-t ${idx === steps.length - 1 ? "border-b mb-12" : ""} border-gray-300 py-8 flex justify-between items-start group cursor-pointer hover:bg-white transition-all -mx-6 px-6 md:mx-0 md:px-6 rounded-2xl`}
          >
            <div className="flex gap-6 md:gap-10 w-full">
              <span className="font-bold text-gray-400 text-lg">{String(idx + 1).padStart(2, "0")}</span>
              <div className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="bg-[#0B1A2B] p-2 rounded-lg text-[#1B7A8C]">{step.icon}</span>
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}

        {/* NEON SUMMARY CARD */}
        <div className="bg-[#145C8C] p-8 md:p-12 shadow-lg relative flex flex-col justify-end min-h-[300px] rounded-3xl text-white">
          <div className="flex flex-col gap-6 mb-8">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tighter">{problemTitle}</h3>
            <p className="font-medium text-white/70 max-w-md text-lg leading-snug">{problemDesc}</p>
          </div>
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-2xl font-bold mb-3">{solutionTitle}</h3>
            <p className="font-bold text-xl max-w-md leading-tight">{solutionDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
