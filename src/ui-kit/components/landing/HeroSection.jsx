/**
 * HeroSection — Full-screen hero with ambient background video, pill navbar,
 * expandable info card, and animated CTA headline.
 *
 * Props:
 *   appName         — brand name (default: "App")
 *   tagline         — array of 3 hero headline lines (default: generic)
 *   description     — short description for the info card
 *   videoSrc        — path/url to background video (default: "/hero-bg-video.mp4")
 *   navLinks        — array of { label, sectionId } for navbar scroll links
 *   ctaLabel        — "See How It Works" button label
 *   ctaSectionId    — scroll target section id for the CTA button
 *   details         — array of { icon: ReactNode, title, desc } for the expanded card
 *   SignInComponent — any component that wraps a trigger button for auth (optional)
 *                     If not provided, no auth button is shown.
 */
import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function HeroSection({
  appName = "App",
  tagline = ["One Platform.", "Every Feature.", "Every User."],
  description = "A unified platform for all your needs.",
  videoSrc = "/hero-bg-video.mp4",
  navLinks = [],
  ctaLabel = "See How It Works",
  ctaSectionId = "how-it-works",
  details = [],
  SignInComponent = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="relative min-h-screen w-full bg-[#EFF3F6] text-[#0B1A2B] flex flex-col justify-between pt-10 pb-12 px-6 md:px-12">

      {/* AMBIENT BACKGROUND VIDEO */}
      <div className="absolute inset-3 md:inset-4 pointer-events-none z-0 overflow-hidden rounded-[40px]">
        <video src={videoSrc} autoPlay muted loop playsInline className="w-full h-full object-cover mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#0B1A2B]/50 mix-blend-normal" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#EFF3F6]/30 via-transparent to-transparent" />
      </div>

      {/* MASSIVE BACKGROUND TEXT */}
      <div className="absolute left-0 right-0 top-[40vh] flex items-center justify-center pointer-events-none z-[1]">
        <h1 className="text-[22vw] font-bold tracking-tighter text-white/50 select-none w-full text-center">{appName}</h1>
      </div>

      {/* TOP ROW — Navbar */}
      <div className="relative z-10 flex justify-between items-center w-full">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 h-[40px] rounded-full shadow-md border border-gray-200">
          <div className="grid grid-cols-2 gap-[2px]">
            {[...Array(4)].map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-black" />)}
          </div>
          <span className="font-bold text-xs text-[#0B1A2B]">{appName}®</span>
        </div>

        <div className="w-[180px] hidden lg:block" />

        {/* Desktop Pill Navbar */}
        <nav className="hidden lg:flex items-center gap-6 bg-white/90 backdrop-blur-md px-6 h-[50px] rounded-full shadow-md border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-black" />)}
            </div>
            <span className="font-bold text-sm text-[#0B1A2B]">{appName}®</span>
          </div>
          {navLinks.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => document.getElementById(link.sectionId)?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          {SignInComponent && (
            <SignInComponent defaultTab="signup">
              <button className="bg-[#145C8C] text-white px-4 py-2 rounded-full text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer">
                Get Started <ArrowRight size={13} />
              </button>
            </SignInComponent>
          )}
        </nav>

        {/* Auth Button */}
        {SignInComponent ? (
          <SignInComponent>
            <button className="bg-[#0B1A2B]/90 backdrop-blur-md text-white h-[40px] lg:h-[50px] px-6 lg:px-8 rounded-full border border-white/15 shadow-xl font-bold text-xs lg:text-sm tracking-wider uppercase hover:bg-white hover:text-black transition-colors duration-300">
              Login
            </button>
          </SignInComponent>
        ) : <div className="w-[100px]" />}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-end justify-between w-full flex-1 mt-20 lg:mt-0 pb-14 lg:pb-20">

        {/* INFO CARD */}
        <motion.div
          layout
          className={`bg-[#1B7A8C] text-white p-6 flex flex-col shadow-lg lg:self-start lg:-mt-[8px] mb-8 lg:mb-0 overflow-hidden relative ${
            isExpanded ? "w-full lg:w-[480px] h-auto min-h-[450px] rounded-3xl z-50" : "w-full lg:w-[280px] min-h-[280px] lg:h-[380px] justify-between"
          }`}
          style={{ borderRadius: isExpanded ? 24 : 16 }}
        >
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex flex-col h-full justify-between">
                <div>
                  <h2 className="font-bold text-lg mb-6 text-white">{appName}®</h2>
                  <p className="font-medium text-[15px] leading-snug mb-4 text-white/90">{description}</p>
                </div>
                {details.length > 0 && (
                  <button onClick={() => setIsExpanded(true)} className="flex items-center gap-2 text-sm font-bold uppercase hover:opacity-70 transition-opacity cursor-pointer text-white">
                    Details <ArrowRight size={16} />
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-2xl tracking-tight text-white">Platform Details</h2>
                  <button onClick={() => setIsExpanded(false)} className="hover:bg-black/10 p-2 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
                </div>
                <div className="space-y-6 flex-1 mt-2">
                  {details.map((d, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="bg-white/15 p-3 rounded-xl h-fit text-white">{d.icon}</div>
                      <div><h4 className="font-bold mb-1 text-white">{d.title}</h4><p className="text-sm font-medium text-white/70">{d.desc}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* HEADLINE */}
        <div className="text-center lg:text-right w-full lg:w-auto mt-4 lg:mt-0">
          <h2 className="relative lg:-top-28 text-[11vw] sm:text-[9vw] lg:text-[100px] leading-[0.85] font-bold tracking-tighter text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {tagline.map((line, i) => (
              <React.Fragment key={i}>{line}{i < tagline.length - 1 && <><br className="hidden lg:block" /><span className="lg:hidden"> </span></>}</React.Fragment>
            ))}
          </h2>
          <div className="mt-8 lg:mt-12 flex justify-center lg:justify-end">
            <button
              onClick={() => document.getElementById(ctaSectionId)?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-4 lg:gap-5 bg-[#0B1A2B] text-white pl-6 lg:pl-8 pr-2.5 lg:pr-3.5 py-3 lg:py-4 rounded-full border border-white/20 shadow-[0_0_45px_25px_#0B1A2B] hover:border-[#145C8C] hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <span className="font-bold text-sm lg:text-lg tracking-tight">{ctaLabel}</span>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white text-[#0B1A2B] flex items-center justify-center group-hover:bg-[#1B7A8C] group-hover:text-white transition-colors">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && <div className="fixed inset-0 bg-transparent z-40" onClick={() => setIsExpanded(false)} />}
    </section>
  );
}
