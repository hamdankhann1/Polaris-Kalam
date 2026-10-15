import React from 'react';
import { Mail, Phone, MapPin, Compass, Bed } from 'lucide-react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * Footer Component
 * =========================================================================
 * 
 * Minimalist, luxury architectural footer containing:
 * - Official contact channels
 * - Physical location coordinates in Kalam Valley
 * - Links to Private Inquiries and Direct Booking portal
 * - Completely secret: ZERO buttons or links to staff admin
 */
export default function Footer({ onOpenInquiry, onOpenBooking }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full max-w-full overflow-x-hidden border-t border-stone-200/90 bg-[#F5F2EB] text-stone-700 py-12 sm:py-16 px-3 sm:px-6">
      
      {/* Top Hairline Gold Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">
        
        {/* COLUMN 1: BRAND OVERVIEW (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/30 flex items-center justify-center bg-white shadow-2xs p-1.5 shrink-0">
              <img
                src={POLARIS_CONFIG.emblem}
                alt="Polaris Hotels & Resorts"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(180,138,40,0.3)]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-2xl tracking-[0.22em] text-stone-900 font-medium leading-tight truncate">
                {POLARIS_CONFIG.hotelName}
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.2em] text-[#8A661C] uppercase font-sans font-bold truncate">
                {POLARIS_CONFIG.brandSubtitle}
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-700 font-normal leading-relaxed max-w-sm">
            {POLARIS_CONFIG.tagline}. An avant-garde hospitality sanctuary currently 
            under development in the scenic heights of Kalam Valley, Swat.
          </p>

          <div className="pt-1 text-[11px] sm:text-xs font-mono tracking-wider text-[#8A661C] font-bold break-words">
            COORDINATES: {POLARIS_CONFIG.coordinates}
          </div>
        </div>

        {/* COLUMN 2: CONTACT & LOCATION (4 cols) */}
        <div className="md:col-span-4 space-y-3.5">
          <div className="text-xs sm:text-sm font-mono tracking-wider uppercase text-stone-900 font-bold mb-2">
            Concierge & Contact
          </div>

          <div className="flex items-start space-x-3 text-sm font-normal text-stone-700">
            <MapPin className="w-4 h-4 text-[#B48A28] shrink-0 mt-0.5" />
            <span>{POLARIS_CONFIG.contact.locationAddress}</span>
          </div>

          <div className="flex items-center space-x-3 text-sm font-normal text-stone-700">
            <Mail className="w-4 h-4 text-[#B48A28] shrink-0" />
            <a 
              href={`mailto:${POLARIS_CONFIG.contact.email}`}
              className="hover:text-[#B48A28] transition-colors"
            >
              {POLARIS_CONFIG.contact.email}
            </a>
          </div>

          <div className="flex items-center space-x-3 text-sm font-normal text-stone-700">
            <Phone className="w-4 h-4 text-[#B48A28] shrink-0" />
            <a 
              href={`tel:${POLARIS_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`}
              className="hover:text-[#B48A28] transition-colors"
            >
              {POLARIS_CONFIG.contact.phone}
            </a>
          </div>
        </div>

        {/* COLUMN 3: INQUIRIES & RESERVATIONS (3 cols) */}
        <div className="md:col-span-3 space-y-3.5">
          <div className="text-xs sm:text-sm font-mono tracking-wider uppercase text-stone-900 font-bold mb-2">
            Inquiries & Stays
          </div>

          <p className="text-sm text-stone-700 font-normal leading-relaxed">
            Discover our inaugural season allocations, partner inquiries, or press previews.
          </p>

          <div className="flex flex-col space-y-3 pt-1">
            <button
              onClick={onOpenInquiry}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm tracking-wider uppercase text-[#8A661C] hover:text-[#705215] border-b border-amber-500/60 pb-0.5 transition-colors self-start font-bold"
            >
              <span>Private Inquiries</span>
              <Compass className="w-3.5 h-3.5" />
            </button>

            {onOpenBooking && (
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm tracking-wider uppercase text-stone-800 hover:text-stone-900 border-b border-stone-400/60 pb-0.5 transition-colors self-start font-mono font-semibold"
              >
                <span>Direct Suite Reservations</span>
                <Bed className="w-3.5 h-3.5 text-[#B48A28]" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM LEGAL ROW */}
      <div className="max-w-7xl mx-auto mt-12 sm:mt-14 pt-6 sm:pt-8 border-t border-stone-300/70 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 font-sans">
        <p>© {currentYear} {POLARIS_CONFIG.hotelName} Hotel Kalam. All Rights Reserved.</p>
        <p className="mt-2 sm:mt-0 font-mono text-xs text-stone-600 font-medium">
          Redefining Tourism in Kalam Valley
        </p>
      </div>

    </footer>
  );
}
