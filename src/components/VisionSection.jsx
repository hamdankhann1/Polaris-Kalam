import React from "react";
import { Sparkles, Mountain, ShieldCheck, Utensils, Waves } from "lucide-react";
import { POLARIS_CONFIG } from "../polarisConfig";

/**
 * =========================================================================
 * VisionSection Component
 * =========================================================================
 *
 * Showcases Polaris Hotel's architectural concept & hospitality philosophy.
 * Designed with pure typography and modern glassmorphism panels — NO IMAGES
 * are used here, preserving the minimalist architectural aesthetic.
 */
export default function VisionSection({ onOpenInquiry }) {
  // Mapping of decorative icons for each pillar
  const pillarIcons = [
    <Mountain className="w-5 h-5 text-[#B48A28]" />,
    <ShieldCheck className="w-5 h-5 text-[#B48A28]" />,
    <Utensils className="w-5 h-5 text-[#B48A28]" />,
    <Waves className="w-5 h-5 text-[#B48A28]" />,
  ];

  return (
    <section
      id="vision"
      className="relative py-16 sm:py-24 md:py-28 px-3 sm:px-6 max-w-7xl mx-auto border-t border-stone-200/80 w-full max-w-full overflow-x-hidden"
    >
      {/* SECTION HEADER */}
      <div className="max-w-3xl mb-12 sm:mb-16 md:mb-20">
        <div className="inline-flex items-center space-x-2 text-[#8A661C] text-xs sm:text-sm font-mono tracking-wider uppercase mb-3 sm:mb-4 font-bold">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>The Concept</span>
        </div>

        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight sm:tracking-wide text-stone-900 uppercase mb-4 sm:mb-6 leading-tight">
          A Masterpiece Conceived For The Modern Wanderer
        </h2>

        <p className="text-stone-700 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
          Polaris is rooted in Kalam Valley’s dramatic alpine topography. Every
          element of the architecture is oriented toward the river currents,
          pine forests, and star-filled skies, setting a new international
          standard for tourism and hospitality in Pakistan.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4 ARCHITECTURAL PILLARS (Pure typography, no images)          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 md:mb-20">
        {POLARIS_CONFIG.pillars.map((pillar, idx) => (
          <div
            key={idx}
            className="group relative p-6 sm:p-8 md:p-10 glass-panel rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 shadow-xs"
          >
            {/* Top row: Number and Category */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-stone-200/80">
              <span className="font-mono text-xs sm:text-sm tracking-wider text-[#8A661C] font-bold">
                {pillar.number} // {pillar.category}
              </span>
              <div className="p-2 sm:p-2.5 rounded-full bg-amber-50/90 border border-amber-200/80 group-hover:border-amber-400 transition-colors">
                {pillarIcons[idx % pillarIcons.length]}
              </div>
            </div>

            {/* Pillar Title */}
            <h3 className="font-display text-xl sm:text-2xl text-stone-900 font-medium mb-3 sm:mb-4 tracking-wide group-hover:text-[#B48A28] transition-colors">
              {pillar.title}
            </h3>

            {/* Description */}
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-normal">
              {pillar.description}
            </p>

            {/* Bottom fine hover line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400/0 group-hover:bg-[#B48A28] transition-all duration-500 rounded-b-2xl" />
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ARCHITECTURAL SPECIFICATIONS ACCORDION / STATS STRIP          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 md:p-10 glass-panel rounded-2xl border border-stone-200/90 bg-gradient-to-r from-white via-amber-50/40 to-white shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-3 sm:p-4 rounded-xl bg-white/60 border border-stone-200/60 shadow-2xs">
            <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-mono font-bold">
              Location
            </div>
            <div className="text-sm sm:text-base md:text-lg font-display text-stone-900 font-semibold">
              Kalam Valley, Swat
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white/60 border border-stone-200/60 shadow-2xs">
            <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-mono font-bold">
              Elevation
            </div>
            <div className="text-sm sm:text-base md:text-lg font-display text-stone-900 font-semibold">
              2,000m Above Sea
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white/60 border border-stone-200/60 shadow-2xs">
            <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-mono font-bold">
              Status
            </div>
            <div className="text-sm sm:text-base md:text-lg font-display text-[#B48A28] font-bold">
              Under Construction
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-white/60 border border-stone-200/60 shadow-2xs">
            <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-mono font-bold">
              Target Opening
            </div>
            <div className="text-sm sm:text-base md:text-lg font-display text-stone-900 font-semibold">
              Winter 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
