import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bed,
  Calendar,
  Compass,
  Sparkles,
  MapPin,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * Hero Component — Swiss Architectural Hero (Inspired by 3d-discovery.fr)
 * =========================================================================
 * 
 * Swiss hairline modular tiles, monumental editorial typography,
 * corner crosshairs, micro-labels, and direct diagonal arrow actions.
 */
export default function Hero({ onOpenInquiry, onOpenBooking }) {
  const scrollToSuites = () => {
    const el = document.getElementById('suites-spatial-index');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full pt-24 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-10 overflow-hidden bg-[#FBFBFA]">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* 1. SWISS MODULAR TOP TILES ROW (Inspired by 3d-discovery.fr sg-tile header row) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-left">
          <div className="sg-tile p-3 sm:p-4 rounded-xl flex items-center justify-between sg-crosshair">
            <p className="sg-label">Polaris Kalam · ©2026</p>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="sg-tile p-3 sm:p-4 rounded-xl hidden sm:flex items-center justify-between sg-crosshair">
            <p className="sg-label sg-label--muted">35°29′N 72°35′E · 2,000M</p>
          </div>

          <div className="sg-tile p-3 sm:p-4 rounded-xl flex items-center justify-between sg-crosshair">
            <p className="sg-label sg-label--gold">Soft Launch Dec 1st · Swat</p>
            <span className="text-[10px] font-mono text-stone-400">VOL. 01</span>
          </div>
        </div>

        {/* 2. GRAND LUXURY EDITORIAL DISPLAY ZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column (7 cols): Monumental Typography & Telemetry */}
          <div className="lg:col-span-7 sg-tile p-6 sm:p-10 lg:p-12 rounded-2xl flex flex-col justify-between space-y-8 sg-crosshair">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#8A661C] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#8A661C]" />
                <span>AN ALPINE SANCTUARY IN KOHISTAN</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-stone-900 leading-[1.03]">
                An Alpine Sanctuary <br className="hidden sm:inline" />
                Above the Clouds
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-stone-600 font-normal leading-relaxed max-w-xl">
                A single monolithic sanctuary for high-altitude solitude, heated cedar hydrotherapy, and bespoke concierge hospitality, rising 2,000 meters amidst the ancient pine forests and glacial meltwater of Kalam Valley.
              </p>
            </div>

            {/* Swiss Telemetry 4-Cell Grid Dock */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-stone-200">
              <div className="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-0.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                  Location
                </span>
                <div className="text-xs sm:text-sm font-semibold text-stone-900">
                  Kalam Valley
                </div>
                <span className="text-[10px] font-mono text-stone-500">Swat Kohistan</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-0.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                  Altitude
                </span>
                <div className="text-xs sm:text-sm font-semibold text-stone-900">
                  2,000M
                </div>
                <span className="text-[10px] font-mono text-stone-500">6,562 Feet</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-0.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                  Tiers
                </span>
                <div className="text-xs sm:text-sm font-semibold text-stone-900">
                  4 Levels
                </div>
                <span className="text-[10px] font-mono text-stone-500">River to Sky</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-0.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                  Nightly
                </span>
                <div className="text-xs sm:text-sm font-semibold text-stone-900">
                  PKR 45,000
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">Direct Open</span>
              </div>
            </div>

            {/* CTA Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {onOpenBooking && (
                <button
                  onClick={onOpenBooking}
                  className="py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-[#8A661C] active:scale-[0.98] text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 shadow-sm spring-button group"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>Reserve Direct</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}

              <button
                onClick={scrollToSuites}
                className="py-3.5 px-5 rounded-xl border border-stone-300 hover:border-stone-900 bg-white hover:bg-stone-50 text-stone-900 font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 spring-button group"
              >
                <span>Explore Horizons</span>
                <ArrowRight className="w-4 h-4 text-stone-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): High-Contrast Architectural Photographic Exhibit */}
          <div className="lg:col-span-5 sg-tile rounded-2xl overflow-hidden relative min-h-[360px] sm:min-h-[460px] lg:min-h-full flex flex-col justify-between group sg-crosshair">
            <picture className="absolute inset-0 w-full h-full block">
              {POLARIS_CONFIG.heroBackgroundImageMobile && (
                <source
                  media="(max-width: 767px)"
                  srcSet={POLARIS_CONFIG.heroBackgroundImageMobile}
                />
              )}
              <img
                src={POLARIS_CONFIG.heroBackgroundImage}
                alt="Polaris Alpine Hotel Kalam Swat"
                className="w-full h-full object-cover object-[45%_center] md:object-center filter contrast-[1.04] brightness-[1.01] transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </picture>

            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20 pointer-events-none" />

            {/* Top metadata tag */}
            <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
              <span className="px-3 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] uppercase tracking-widest font-bold">
                EXHIBIT 01 // ARCHITECTURE
              </span>
              <span className="text-[10px] font-mono text-white/75 bg-black/40 px-2.5 py-0.5 rounded backdrop-blur-xs">
                SWAT RIVER
              </span>
            </div>

            {/* Bottom Monograph Caption Card */}
            <div className="relative z-10 p-4 sm:p-5">
              <div className="p-4 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 space-y-1.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                  MONOLITHIC ALPINE SANCTUARY
                </span>
                <p className="text-xs sm:text-sm font-light text-stone-100 leading-snug">
                  Himalayan cedar timber, heated basalt floors, and unobstructed panoramic glacial glass rising along the Swat River.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
