import React from "react";
import { Mountain, ShieldCheck, Utensils, Waves, Sparkles, Compass, ArrowRight, ArrowUpRight } from "lucide-react";
import { POLARIS_CONFIG } from "../polarisConfig";
import PolarisStar3D from "./experience/PolarisStar3D";

/**
 * =========================================================================
 * VisionSection Component — Swiss Key Figures & Experience Pillars
 * =========================================================================
 * 
 * Inspired by 3d-discovery.fr's Key Figures and modular Swiss grid cards:
 * - Monumental stat figures (2,000M, 35°N, 4 Tiers, 100%)
 * - Interactive 3D Polaris Star beating mark canvas
 * - Architectural statement manifesto tile
 * - 4 modular experience pillars with corner crosshairs (+) and arrow indicators (→)
 */
export default function VisionSection({ onOpenInquiry }) {
  const pillarIcons = [
    <Mountain className="w-5 h-5 text-[#8A661C]" />,
    <Waves className="w-5 h-5 text-[#8A661C]" />,
    <Utensils className="w-5 h-5 text-[#8A661C]" />,
    <ShieldCheck className="w-5 h-5 text-[#8A661C]" />,
  ];

  return (
    <section
      id="vision"
      className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-10 overflow-hidden bg-[#FBFBFA]"
    >
      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20">
        
        {/* ========================================================================= */}
        {/* 1. KEY FIGURES STRIP (Inspired by 3d-discovery.fr Key Figures) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#8A661C] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#8A661C]" />
            <span>KEY FIGURES & SANCTUARY TELEMETRY</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sg-tile p-6 sm:p-8 rounded-2xl flex flex-col justify-between space-y-3 sg-crosshair">
              <p className="sg-stat text-3xl sm:text-5xl lg:text-6xl">2,000M</p>
              <div>
                <p className="sg-label">Elevation</p>
                <p className="text-xs text-stone-500 font-mono">6,562 Feet Altitude</p>
              </div>
            </div>

            <div className="sg-tile p-6 sm:p-8 rounded-2xl flex flex-col justify-between space-y-3 sg-crosshair">
              <p className="sg-stat text-3xl sm:text-5xl lg:text-6xl">35°29′N</p>
              <div>
                <p className="sg-label">Coordinates</p>
                <p className="text-xs text-stone-500 font-mono">72°35′E · Swat Valley</p>
              </div>
            </div>

            <div className="sg-tile p-6 sm:p-8 rounded-2xl flex flex-col justify-between space-y-3 sg-crosshair">
              <p className="sg-stat text-3xl sm:text-5xl lg:text-6xl">04</p>
              <div>
                <p className="sg-label">Vertical Horizons</p>
                <p className="text-xs text-stone-500 font-mono">Riverside to Summit</p>
              </div>
            </div>

            {/* Interactive 3D Beating Star Mark (Inspired by 3d-discovery.fr sg-mark-heart) */}
            <div className="sg-tile p-4 sm:p-6 rounded-2xl flex flex-col justify-between items-center text-center sg-crosshair bg-[#FAF9F5] overflow-hidden">
              <div className="w-full flex justify-between items-center text-[9px] font-mono text-stone-400">
                <span>3D EMBLEM</span>
                <span className="text-[#8A661C] animate-pulse">● LIVE</span>
              </div>
              <div className="w-24 h-24 sm:w-28 sm:h-28 my-auto">
                <PolarisStar3D />
              </div>
              <div>
                <p className="sg-label sg-label--gold">North Star Mark</p>
                <p className="text-[10px] text-stone-400 font-mono">Celestial Solitude</p>
              </div>
            </div>
          </div>

          {/* Architectural Statement Manifesto Tile */}
          <div className="sg-tile p-6 sm:p-10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 sg-crosshair bg-stone-50/60">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A661C] font-bold block">
                ARCHITECTURAL MANIFESTO
              </span>
              <p className="font-serif text-lg sm:text-xl text-stone-900 font-normal leading-relaxed">
                “We design a sanctuary that reveals the untouched: century-old Himalayan cedar canopies, glacial meltwater streams, and pristine Karakoram starlight. Every detail is calibrated for altitude solitude and thermal restoration.”
              </p>
            </div>

            {onOpenInquiry && (
              <button
                onClick={onOpenInquiry}
                className="px-5 py-3 rounded-xl border border-stone-300 hover:border-stone-900 bg-white hover:bg-stone-50 text-stone-900 text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-2 shrink-0 spring-button group"
              >
                <span>Concierge Protocol</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8A661C] group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ARCHITECTURAL EXPERIENCE PILLARS (Inspired by 3d-discovery.fr Solutions) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#8A661C] font-bold mb-1">
                <Compass className="w-3.5 h-3.5 text-[#8A661C]" />
                <span>THE SANCTUARY STANDARDS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-stone-900">
                Crafted for High Alpine Solitude
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 font-mono max-w-sm">
              Rooted in Kalam Valley's dramatic topography, oriented toward glacial meltwater and celestial Karakoram skies.
            </p>
          </div>

          {/* 4 Swiss Grid Experience Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {POLARIS_CONFIG.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="sg-tile rounded-2xl p-7 sm:p-9 flex flex-col justify-between space-y-6 group sg-crosshair"
              >
                <div className="flex items-center justify-between pb-4 border-b border-stone-150">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs tracking-widest text-stone-400 font-bold">
                      0{pillar.number}
                    </span>
                    <span className="font-mono text-xs tracking-wider uppercase text-[#8A661C] font-semibold">
                      // {pillar.category}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50 group-hover:bg-amber-50 group-hover:border-amber-200/80 transition-all duration-300">
                    {pillarIcons[idx % pillarIcons.length]}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-serif text-xl sm:text-2xl text-stone-900 font-medium group-hover:text-[#8A661C] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-150 text-[10.5px] font-mono tracking-wider uppercase text-stone-400 flex items-center justify-between">
                  <span>Polaris Sanctuary Standard</span>
                  <span className="text-[#8A661C] flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
