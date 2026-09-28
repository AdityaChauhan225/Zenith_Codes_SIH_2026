/**
 * CTASection — Dark full-screen CTA with background text, footer, and sign-in trigger.
 *
 * Props:
 *   sectionIndex    — section number label (default: "04")
 *   bgText          — giant background watermark word (default: "join")
 *   heading         — main CTA heading
 *   subheading      — supporting text below heading
 *   ctaLabel        — button label (default: "Create Your Account")
 *   appName         — brand name for footer
 *   footerLinks     — array of { section, href, label } for footer menu
 *   footerTagline   — brand description for footer
 *   copyright       — copyright string (default: "© 2025 App. All rights reserved.")
 *   SignInComponent — auth drawer wrapper component (optional)
 */
import React from "react";
import { ArrowRight } from "lucide-react";

export function CTASection({
  sectionIndex = "04",
  bgText = "join",
  heading = "Ready to get started?",
  subheading = "Join thousands of users on the platform.",
  ctaLabel = "Create Your Account",
  appName = "App",
  footerLinks = [],
  footerTagline = "",
  copyright = `© 2025 ${appName}. All rights reserved.`,
  SignInComponent = null,
}) {
  return (
    <section id="apply" className="relative w-full bg-[#0B1A2B] text-white min-h-[100dvh] flex flex-col justify-between py-16 md:py-24 px-6 md:px-12 overflow-hidden">

      {/* BACKGROUND TEXT */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h1 className="text-[18vw] md:text-[18vw] leading-none font-black tracking-tighter text-white/5 select-none whitespace-nowrap transform scale-y-[1.6] hidden md:block">{bgText}</h1>
      </div>

      <div className="relative z-10 flex justify-between items-center text-sm font-bold mb-24 uppercase tracking-wide">
        <span>{sectionIndex} &mdash; Apply</span>
      </div>

      {/* MAIN CTA */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center mt-12 mb-24">
        <h2 className="text-4xl md:text-[80px] leading-[0.9] font-bold tracking-tighter mb-8 max-w-4xl">
          {heading}
        </h2>
        <p className="text-gray-400 font-medium text-lg max-w-xl mb-12">{subheading}</p>

        {SignInComponent ? (
          <SignInComponent>
            <button className="bg-[#145C8C] text-white px-8 py-4 rounded-full font-bold text-lg md:text-xl flex items-center gap-4 hover:bg-[#0B3D5C] transition-colors group cursor-pointer">
              {ctaLabel} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </SignInComponent>
        ) : (
          <button className="bg-[#145C8C] text-white px-8 py-4 rounded-full font-bold text-lg md:text-xl flex items-center gap-4 hover:bg-[#0B3D5C] transition-colors cursor-pointer">
            {ctaLabel} <ArrowRight />
          </button>
        )}
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-12">
        <div className="flex gap-12 md:gap-24 mb-12 md:mb-0 text-sm font-medium">
          {footerLinks.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-gray-500 uppercase">Menu</h4>
              {footerLinks.map((link, i) => (
                <a key={i} href={link.href} className="hover:text-[#145C8C] transition-colors">{link.label}</a>
              ))}
            </div>
          )}
          {footerTagline && (
            <div className="flex flex-col gap-4 max-w-[250px]">
              <h4 className="font-extrabold tracking-[0.2em] text-gray-500 uppercase">
                {appName}<span className="text-[#145C8C] leading-none">.</span>
              </h4>
              <p className="text-gray-400">{footerTagline}</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="font-extrabold tracking-[0.2em] uppercase text-xl text-white mb-2">
            {appName}<span className="text-[#145C8C] text-2xl leading-none">.</span>
          </p>
          <p className="text-sm text-gray-500">{copyright}</p>
        </div>
      </footer>
    </section>
  );
}
