import React from 'react';
import { Mail, Phone, MapPin, Compass, Bed, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * Footer Component — Swiss Architectural Wordmark Footer (Inspired by 3d-discovery.fr)
 * =========================================================================
 * 
 * Monumental POLARIS wordmark with hairline vertical guide rules,
 * Swiss modular tiles for Private Concierge, Coordinates, and Allocations.
 */
export default function Footer({ onOpenInquiry, onOpenBooking }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#F5F2EB] text-stone-900 border-t border-stone-200/90 overflow-hidden">
      
      {/* 1. MONUMENTAL ARCHITECTURAL WORDMARK WITH HAIRLINE RULES */}
      <div className="relative border-b border-stone-200/90 py-10 sm:py-16 px-4 sm:px-6 lg:px-10 overflow-hidden">
        {/* Hairline vertical guides across wordmark (inspired by 3d-discovery.fr wordmark rules) */}
        <div className="absolute inset-0 pointer-events-none select-none flex justify-between max-w-7xl mx-auto px-4 sm:px-6">
          <span className="sg-wordmark-rule left-[4%]" />
          <span className="sg-wordmark-rule left-[22%]" />
          <span className="sg-wordmark-rule left-[40%]" />
          <span className="sg-wordmark-rule left-[58%]" />
          <span className="sg-wordmark-rule left-[76%]" />
          <span className="sg-wordmark-rule left-[94%]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center sm:items-start space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono tracking-widest text-[#8A661C] uppercase font-bold px-2.5 py-1 rounded bg-amber-50 border border-amber-200/80">
              POLARIS // KALAM VALLEY
            </span>
            <span className="text-[10px] font-mono text-stone-500 uppercase">
              2,000M ELEVATION
            </span>
          </div>

          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[0.12em] text-stone-900/95 uppercase leading-none select-none">
            POLARIS
          </h2>
        </div>
      </div>

      {/* 2. SWISS MODULAR TILES GRID FOR CONCIERGE & DETAILS */}
      <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        
        {/* COLUMN 1: BRAND OVERVIEW (5 cols) */}
        <div className="md:col-span-5 sg-tile p-6 sm:p-8 rounded-2xl space-y-4 sg-crosshair">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full border border-stone-300/80 flex items-center justify-center bg-white shadow-2xs p-1.5 shrink-0">
              <img
                src={POLARIS_CONFIG.emblem}
                alt="Polaris Hotels & Resorts"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-xl tracking-[0.16em] text-stone-900 font-semibold leading-tight">
                {POLARIS_CONFIG.hotelName}
              </span>
              <span className="text-[10px] tracking-[0.18em] text-[#8A661C] uppercase font-mono font-bold">
                {POLARIS_CONFIG.brandSubtitle} • KALAM
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
            The North Star of alpine luxury in Pakistan. A climate-engineered architectural sanctuary rising 2,000 meters above sea level in Swat Kohistan.
          </p>

          <div className="space-y-1 text-[11px] font-mono text-[#8A661C] font-semibold pt-2 border-t border-stone-200">
            <div>COORDINATES: {POLARIS_CONFIG.coordinates}</div>
            <div>ELEVATION: 2,000 METERS // 6,562 FEET</div>
          </div>
        </div>

        {/* COLUMN 2: CONCIERGE & CONTACT (4 cols) */}
        <div className="md:col-span-4 sg-tile p-6 sm:p-8 rounded-2xl space-y-4 sg-crosshair">
          <div className="text-xs font-mono tracking-wider uppercase text-stone-900 font-bold pb-2 border-b border-stone-200">
            Private Concierge Desk
          </div>

          <div className="flex items-start space-x-3 text-xs sm:text-sm text-stone-700">
            <MapPin className="w-4 h-4 text-[#8A661C] shrink-0 mt-0.5" />
            <span>{POLARIS_CONFIG.contact.locationAddress}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs sm:text-sm text-stone-700">
            <Mail className="w-4 h-4 text-[#8A661C] shrink-0" />
            <a 
              href={`mailto:${POLARIS_CONFIG.contact.email}`}
              className="hover:text-[#8A661C] transition-colors font-mono"
            >
              {POLARIS_CONFIG.contact.email}
            </a>
          </div>

          <div className="flex items-center space-x-3 text-xs sm:text-sm text-stone-700">
            <Phone className="w-4 h-4 text-[#8A661C] shrink-0" />
            <a 
              href={`tel:${POLARIS_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`}
              className="hover:text-[#8A661C] transition-colors font-mono"
            >
              {POLARIS_CONFIG.contact.phone}
            </a>
          </div>
        </div>

        {/* COLUMN 3: DIRECT ACCESS (3 cols) */}
        <div className="md:col-span-3 sg-tile p-6 sm:p-8 rounded-2xl space-y-4 sg-crosshair flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs font-mono tracking-wider uppercase text-stone-900 font-bold pb-2 border-b border-stone-200">
              Inaugural Allocations
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Reserve directly with our private concierge for soft launch allocations beginning December 1st.
            </p>
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            {onOpenBooking && (
              <button
                onClick={onOpenBooking}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-[#8A661C] active:scale-[0.98] text-white text-xs font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-between rounded-xl shadow-xs spring-button group"
              >
                <span>Private Ledger</span>
                <ArrowUpRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            )}

            {onOpenInquiry && (
              <button
                onClick={onOpenInquiry}
                className="w-full py-2.5 px-4 border border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-mono uppercase tracking-wider font-semibold transition-all text-center rounded-xl spring-button"
              >
                Concierge Inquiries
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. BOTTOM LEGAL & ARCHITECTURAL COPYRIGHT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-10 pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-stone-500 text-center sm:text-left">
        <div>
          © {currentYear} POLARIS KALAM HOTELS & RESORTS (PVT. LTD.). ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center space-x-3">
          <span>KHYBER PAKHTUNKHWA</span>
          <span>•</span>
          <span>SWAT VALLEY, PAKISTAN</span>
        </div>
      </div>

    </footer>
  );
}
