import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, ArrowRight, ArrowUpRight, Calendar, MessageSquare } from 'lucide-react';
import { POLARIS_CONFIG } from '../../polarisConfig';

/**
 * =========================================================================
 * SanctuaryAEOSection Component — Swiss FAQ Grid & Take Action Banner
 * =========================================================================
 * 
 * Inspired by 3d-discovery.fr's FAQ grid and "Take Action" banner:
 * - Swiss hairline modular tiles with corner crosshairs (+)
 * - Clear, readable typography and Schema.org FAQPage compliance
 * - Dedicated "Reserve your horizon" Take Action CTA section
 */

export const SANCTUARY_FAQS = [
  {
    q: 'What is Polaris Hotel Kalam?',
    a: 'Polaris is an avant-garde 5-star luxury alpine hotel in Kalam Valley, Swat, Pakistan. Located at 2,000 meters elevation, it features floor-to-ceiling glacial mountain suites, heated floors, cedar plunge pools, and bespoke private concierge service.',
    category: 'IDENTITY'
  },
  {
    q: 'Where is Polaris Hotel located and what are its exact coordinates?',
    a: 'Polaris is situated on Main Kalam Valley Road in Swat, Khyber Pakhtunkhwa, Pakistan, at coordinates 35°29′12″N 72°35′04″E. It lies adjacent to the Swat River and Ushu pine forest at an altitude of 2,000 meters.',
    category: 'LOCATION'
  },
  {
    q: 'What are the room rates and suite categories at Polaris Kalam?',
    a: 'Nightly rates start from PKR 45,000 for Deluxe Alpine Rooms, PKR 60,000 for Executive Horizon Suites, and PKR 120,000 for the Celestial Summit Penthouse. All reservations include artisan mountain breakfast and private concierge assistance.',
    category: 'RATES'
  },
  {
    q: 'How do guests travel to Polaris Hotel from Islamabad or Lahore?',
    a: 'Travelers take the M-1 to the M-16 Swat Motorway through Chakdara to Mingora, then follow the scenic N-95 highway through Bahrain to Kalam (approx. 5–6 hours from Islamabad). Polaris arranges chauffeured 4x4 airport transfers upon request.',
    category: 'TRAVEL'
  },
  {
    q: 'When is the best season to visit Polaris in Kalam Swat?',
    a: 'Polaris offers two premier seasons: the Glacial Summer Retreat (June–September) with cool mountain breezes, and the Alpine Winter Wonderland (December–March) with pristine snowfall, heated plunge pools, and stone fireplaces.',
    category: 'SEASONS'
  },
  {
    q: 'What amenities and dining experiences are available?',
    a: 'Amenities include floor-to-ceiling panoramic glass suites, heated stone flooring, stone hearth fireplaces, heated cedar plunge pools, fine Swati-international fusion gastronomy, fiber-optic Wi-Fi, and 24/7 personal butler service.',
    category: 'AMENITIES'
  }
];

export default function SanctuaryAEOSection({ onOpenBooking, onOpenInquiry }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="concierge-knowledge-faq"
      className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-10 overflow-hidden bg-[#FBFBFA] border-t border-stone-200/90"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20">
        
        {/* ========================================================================= */}
        {/* 1. SWISS FAQ SECTION (Inspired by 3d-discovery.fr FAQ) */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          
          {/* Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
            <div className="sm:col-span-3 sg-tile p-3 sm:p-4 rounded-xl sg-crosshair">
              <p className="sg-label">FAQ</p>
            </div>
            <div className="sm:col-span-9 sg-tile p-3 sm:p-4 rounded-xl sg-crosshair">
              <p className="sg-label sg-label--muted">Frequently Asked Questions · Guest Intelligence</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-stone-900">
              Sanctuary Knowledge & Access
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm font-normal">
              Essential documentation regarding geography, inaugural access, and luxury hospitality standards at Polaris Kalam.
            </p>
          </div>

          {/* 2-Column Swiss Grid FAQ Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {SANCTUARY_FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <article
                  key={idx}
                  className={`sg-tile rounded-2xl transition-all duration-300 overflow-hidden sg-crosshair ${
                    isOpen ? 'border-stone-400 shadow-xs' : 'hover:border-stone-300'
                  }`}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between space-x-3 focus:outline-none spring-button"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <span className="font-mono text-[9.5px] uppercase font-bold text-[#8A661C] px-2 py-0.5 rounded bg-amber-50 border border-amber-200/80 inline-block">
                        {item.category}
                      </span>
                      <h3
                        className="font-serif text-base sm:text-lg text-stone-900 font-medium leading-snug"
                        itemProp="name"
                      >
                        {item.q}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-300 shrink-0 mt-1 ${
                        isOpen ? 'rotate-180 text-stone-900' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans border-t border-stone-100 animate-fadeIn"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{item.a}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. INVOLVEMENT & RESERVATION BANNER */}
        {/* ========================================================================= */}
        <div className="sg-tile sg-tile--dark rounded-3xl p-8 sm:p-12 lg:p-16 sg-crosshair bg-[#111111] text-white relative overflow-hidden shadow-2xl border border-stone-800">
          {/* Subtle architectural ambient warmth glow in corner */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>INVOLVEMENT & INAUGURAL ALLOCATIONS</span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-tight">
                Reserve Your Alpine Horizon
              </h2>

              <p className="text-stone-300 text-sm sm:text-base font-normal max-w-xl leading-relaxed">
                Direct allocations are open for soft launch commencing December 1st, 2026. Explore heated cedar hydrotherapy, private butler concierge, and high-altitude solitude rising 2,000 meters in Kalam Valley.
              </p>

              {/* Status micro-badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-stone-400">
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Soft Launch Dec 1st</span>
                </span>
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-stone-300">
                  <span>Direct Concierge Lock</span>
                </span>
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-amber-300">
                  <span>Kalam Valley, Swat</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5">
              {onOpenBooking && (
                <button
                  onClick={onOpenBooking}
                  className="py-4 px-6 rounded-xl bg-white hover:bg-stone-100 active:scale-[0.98] text-stone-900 font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2.5 shadow-xl spring-button group"
                >
                  <Calendar className="w-4 h-4 text-[#8A661C] shrink-0" />
                  <span>Check Live Dates</span>
                  <ArrowUpRight className="w-4 h-4 text-[#8A661C] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </button>
              )}

              <a
                href={`https://wa.me/${POLARIS_CONFIG.contact.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 px-6 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-emerald-300 hover:text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2.5 shadow-sm spring-button"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
