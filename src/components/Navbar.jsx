import React from 'react';
import { Compass, Sparkles, Bed } from 'lucide-react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * Navbar Component
 * =========================================================================
 * 
 * Minimalist, modern navigation bar designed with architectural precision.
 * Features:
 * - Brand Monogram with the Polaris Star icon
 * - "BOOKING WILL BE OPEN SOON" status indicator
 * - Link to explore suites & direct booking portal
 * - CTA button to open Private Inquiries
 */
export default function Navbar({ onOpenInquiry, onOpenBooking }) {
  return (
    <header className="w-full fixed top-0 left-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80 shadow-[0_2px_15px_rgba(28,25,23,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-20 flex items-center justify-between w-full max-w-full overflow-hidden">
        
        {/* BRAND IDENTITY / LOGO */}
        <div className="flex items-center space-x-2 sm:space-x-3 group cursor-default min-w-0 shrink">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-amber-500/30 flex items-center justify-center bg-white shadow-xs p-1.5 group-hover:border-amber-500/70 transition-all shrink-0">
            <img
              src={POLARIS_CONFIG.emblem}
              alt="Polaris Star Emblem"
              className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(180,138,40,0.3)] group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-display text-base sm:text-xl tracking-[0.16em] sm:tracking-[0.28em] font-semibold text-stone-900 leading-tight group-hover:text-[#B48A28] transition-colors truncate">
              {POLARIS_CONFIG.hotelName}
            </span>
            <span className="text-[9.5px] sm:text-xs tracking-[0.12em] sm:tracking-[0.16em] text-[#8A661C] uppercase font-sans font-semibold truncate">
              Hotels & Resorts • Kalam
            </span>
          </div>
        </div>

        {/* STATUS PILL (Centered on Desktop): BOOKING WILL BE OPEN SOON */}
        <div className="hidden lg:flex items-center space-x-2.5 px-4 py-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 shadow-xs shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
          </span>
          <span className="text-xs font-mono tracking-wider uppercase text-[#8A661C] font-bold">
            BOOKING WILL BE OPEN SOON
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs font-mono tracking-wider text-stone-600 font-medium">
            {POLARIS_CONFIG.elevation}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* LINK TO BOOKING PORTAL */}
          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 hover:text-stone-900 border border-stone-300 hover:border-amber-600 hover:bg-amber-50/80 transition-all flex items-center space-x-1 sm:space-x-1.5 shadow-2xs font-semibold"
            >
              <Bed className="w-3.5 h-3.5 text-[#B48A28] shrink-0" />
              <span>Suites</span>
            </button>
          )}

          {/* INQUIRY BUTTON */}
          <button
            onClick={onOpenInquiry}
            className="group relative px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-sm text-xs sm:text-sm font-sans tracking-[0.12em] sm:tracking-[0.2em] uppercase font-semibold text-white transition-all overflow-hidden bg-stone-900 hover:bg-[#1C1917] hover:shadow-md border border-stone-800 shadow-xs"
          >
            <span className="relative z-10 flex items-center space-x-1 sm:space-x-2">
              <span className="hidden sm:inline">Private Inquiries</span>
              <span className="sm:hidden">Inquire</span>
              <Compass className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}
