import React, { useState } from "react";
import { Compass, Bed, ArrowRight, ArrowUpRight, Menu, X, Calendar, Sparkles } from "lucide-react";
import { POLARIS_CONFIG } from "../polarisConfig";

/**
 * =========================================================================
 * Navbar Component — Swiss Architectural Header (Inspired by 3d-discovery.fr)
 * =========================================================================
 * 
 * Clean architectural bar with hairline border, pill links with indicator marks,
 * and high-contrast "Reserve Direct ↗" CTA with diagonal arrow.
 */
export default function Navbar({ onOpenInquiry, onOpenBooking }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#FBFBFA]/92 backdrop-blur-md border-b border-stone-200/90 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-3">
        
        {/* BRAND IDENTITY */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-stone-300/80 flex items-center justify-center bg-white shadow-2xs p-1 transition-transform duration-300 group-hover:scale-105">
            <img
              src={POLARIS_CONFIG.emblem}
              alt="Polaris Star Emblem"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-display text-sm sm:text-lg tracking-[0.2em] font-semibold text-stone-900 leading-tight">
              {POLARIS_CONFIG.hotelName}
            </span>
            <span className="hidden md:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200/80 text-[9.5px] font-mono text-stone-700 font-semibold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>2,000M • KALAM</span>
            </span>
          </div>
        </div>

        {/* DESKTOP CAPSULE NAVIGATION LINKS (Inspired by 3d-discovery.fr pill nav) */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-mono uppercase tracking-wider text-stone-600 font-medium">
          <button 
            onClick={() => scrollToSection('suites-spatial-index')}
            className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-all spring-button"
          >
            Suites & Horizons
          </button>
          <button 
            onClick={() => scrollToSection('vision')}
            className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-all spring-button"
          >
            The Experience
          </button>
          <button 
            onClick={() => scrollToSection('concierge-knowledge-faq')}
            className="px-3.5 py-1.5 rounded-full hover:bg-stone-200/60 hover:text-stone-900 transition-all spring-button"
          >
            FAQ
          </button>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden sm:flex items-center space-x-2 shrink-0">
          {onOpenInquiry && (
            <button
              onClick={onOpenInquiry}
              className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-full transition-all flex items-center space-x-1.5 font-medium spring-button"
            >
              <Compass className="w-3.5 h-3.5 text-[#8A661C]" />
              <span>Inquire</span>
            </button>
          )}

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-white transition-all bg-stone-900 hover:bg-[#8A661C] rounded-full shadow-xs flex items-center space-x-1.5 spring-button group"
            >
              <span>Reserve Direct</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* MOBILE CONTROLS */}
        <div className="flex sm:hidden items-center space-x-1.5">
          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-white bg-stone-900 hover:bg-[#8A661C] rounded-full flex items-center space-x-1 spring-button"
            >
              <span>Reserve</span>
              <ArrowUpRight className="w-3 h-3 text-amber-300" />
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full text-stone-700 hover:bg-stone-200/60 transition-colors spring-button"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE EXPANDED ARCHITECTURAL DRAWER (With Numbered Links 01, 02, 03) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden w-full bg-[#FAF9F5] border-b border-stone-200/90 p-5 space-y-4 animate-slideUp shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/70 text-[10px] font-mono uppercase tracking-widest text-[#8A661C] font-bold">
            <span>Navigation Index</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kalam 2,000M</span>
            </span>
          </div>

          <nav className="flex flex-col space-y-2 text-xs font-mono uppercase tracking-wider text-stone-800 font-semibold">
            <button 
              onClick={() => scrollToSection('suites-spatial-index')}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-200/50 hover:text-[#8A661C] transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-stone-400 font-mono text-[10px]">01</span>
                <span>Suites & Horizons</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('vision')}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-200/50 hover:text-[#8A661C] transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-stone-400 font-mono text-[10px]">02</span>
                <span>The Experience</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('concierge-knowledge-faq')}
              className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-200/50 hover:text-[#8A661C] transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-stone-400 font-mono text-[10px]">03</span>
                <span>Sanctuary FAQ</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </nav>

          <div className="pt-2 border-t border-stone-200/70 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenInquiry && onOpenInquiry();
              }}
              className="w-full py-2.5 rounded-full border border-stone-300 text-stone-800 text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center space-x-2 spring-button"
            >
              <Compass className="w-4 h-4 text-[#8A661C]" />
              <span>Concierge Inquiries</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenBooking && onOpenBooking();
              }}
              className="w-full py-3 rounded-full bg-stone-900 text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center space-x-2 shadow-sm spring-button"
            >
              <span>Direct Reservations</span>
              <ArrowUpRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
