import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { POLARIS_CONFIG } from "../polarisConfig";
import { subscribeToWaitlist } from "../services/newsletterService";
import CountdownTimer from "./CountdownTimer";

/**
 * =========================================================================
 * Hero Component
 * =========================================================================
 *
 * The main focal section of the landing page.
 * Highlights:
 * - Architectural geographic coordinates (Kalam Valley, Swat)
 * - Monumental brand typography for POLARIS
 * - Clear "Opening Soon" positioning
 * - Launch Countdown Timer
 * - Automated email waitlist integration (Brevo / Mailchimp)
 */
export default function Hero({ onOpenInquiry, onOpenBooking }) {
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleQuickSignup = async (e) => {
    e.preventDefault();
    if (!emailInput || isLoading) return;

    setIsLoading(true);

    // Dispatches to Brevo / Mailchimp / LocalStorage via newsletterService
    await subscribeToWaitlist({
      email: emailInput,
      interest: "Soft Launch December 1st - Priority Access",
    });

    setIsLoading(false);
    setIsSubmitted(true);
    setEmailInput("");
  };

  return (
    <section className="relative min-h-screen w-full max-w-full overflow-x-hidden flex flex-col items-center justify-center pt-24 sm:pt-28 pb-16 sm:pb-20 px-3 sm:px-6 text-center">
      {/* ------------------------------------------------------------- */}
      {/* ARCHITECTURAL GEOGRAPHIC BADGE                                */}
      {/* ------------------------------------------------------------- */}
      <div className="inline-flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 mb-6 sm:mb-8 border border-stone-200/90 bg-white/90 shadow-xs backdrop-blur-md rounded-full max-w-[92vw]">
        <MapPin className="w-3.5 h-3.5 text-[#B48A28] shrink-0" />
        <span className="text-[11px] sm:text-xs md:text-sm font-mono tracking-wider text-stone-700 uppercase font-medium truncate">
          <span className="hidden sm:inline">
            {POLARIS_CONFIG.coordinates} •{" "}
          </span>
          {POLARIS_CONFIG.location}
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AUTHENTIC BRAND EMBLEM                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative mb-5 sm:mb-6 group cursor-default">
        {/* Ambient star aura */}
        <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full pointer-events-none transform scale-150 animate-pulse" />
        <img
          src={POLARIS_CONFIG.emblem}
          alt="Polaris Hotels & Resorts Star"
          className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain mx-auto drop-shadow-[0_4px_20px_rgba(180,138,40,0.35)] transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MONUMENTAL BRAND TITLE                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative mb-2 w-full max-w-full px-2">
        {/* Subtle decorative glow behind brand name */}
        <div className="absolute inset-0 bg-amber-200/25 blur-3xl rounded-full pointer-events-none" />

        <h1 className="relative font-display text-3xl sm:text-6xl md:text-8xl lg:text-9xl tracking-[0.14em] sm:tracking-[0.22em] md:tracking-[0.25em] font-medium uppercase text-stone-900 break-words leading-tight">
          {POLARIS_CONFIG.hotelName}
        </h1>
      </div>

      {/* Brand Subtitle Lockup (Matches Official Logo) */}
      <p className="text-xs sm:text-sm md:text-base font-sans tracking-[0.16em] sm:tracking-[0.35em] md:tracking-[0.42em] uppercase text-[#B48A28] font-bold mb-2.5 sm:mb-3 px-2">
        {POLARIS_CONFIG.brandSubtitle}
      </p>

      {/* Brand Tagline */}
      <p className="text-xs sm:text-sm md:text-base font-sans tracking-wide sm:tracking-[0.24em] uppercase text-stone-600 mb-5 sm:mb-6 font-semibold px-2">
        {POLARIS_CONFIG.tagline}
      </p>

      {/* Narrative Subtitle */}
      <p className="max-w-2xl text-stone-700 text-sm sm:text-base md:text-lg leading-relaxed font-normal mb-8 sm:mb-10 px-2 sm:px-4">
        {POLARIS_CONFIG.mission.description}
      </p>

      {/* ------------------------------------------------------------- */}
      {/* "BOOKING WILL BE OPEN SOON" PROMINENT LUXURY ANNOUNCEMENT     */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-lg mb-8 sm:mb-10 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-amber-50/90 via-[#FFFDF7] to-amber-50/90 border border-amber-300/80 text-center space-y-3 backdrop-blur-md shadow-[0_4px_25px_rgba(180,138,40,0.08)]">
        <div className="flex items-center justify-center space-x-2 text-[#8A661C] text-xs sm:text-sm font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-green-600 animate-pulse shrink-0" />
          <span>BOOKING IS OPEN FOR SOFT LAUNCH DECEMBER</span>
        </div>
        <p className="text-xs sm:text-sm text-stone-700 font-normal leading-relaxed">
          Our 4 floors of panoramic alpine suites and summit penthouse are
          preparing for the 2026 inaugural season. Direct bookings will open
          shortly.
        </p>
        {onOpenBooking && (
          <div className="pt-1.5">
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-white hover:bg-amber-50/90 border border-amber-400/80 hover:border-amber-600 text-[#8A661C] hover:text-[#705215] text-xs sm:text-sm font-mono uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-2 shadow-2xs font-bold rounded-lg"
            >
              <span className="hidden sm:inline">
                Explore Suites & Pricing (Booking)
              </span>
              <span className="sm:hidden">Explore Suites & Pricing</span>
              <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COUNTDOWN SECTION                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-xl mb-10 sm:mb-12 px-1 sm:px-0">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="h-[1px] w-6 sm:w-8 bg-amber-400/60" />
          <span className="text-xs sm:text-sm font-sans tracking-wider uppercase text-[#8A661C] font-bold">
            Anticipated Inaugural Season
          </span>
          <span className="h-[1px] w-6 sm:w-8 bg-amber-400/60" />
        </div>

        <CountdownTimer />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CALL TO ACTION / PRIORITY WAITLIST NOTIFICATION               */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-md px-1 sm:px-0">
        {isSubmitted ? (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-lg flex items-center justify-center space-x-3 text-emerald-900 text-xs sm:text-sm tracking-wide shadow-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Registration confirmed. Look for your invitation for our December
              1st Soft Launch.
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleQuickSignup}
            className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 w-full max-w-full"
          >
            <input
              type="email"
              required
              disabled={isLoading}
              placeholder="Enter your email for Dec 1 soft launch"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full flex-1 px-4 py-3 sm:py-3.5 bg-white border border-stone-300 rounded-lg text-stone-900 placeholder-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors font-sans disabled:opacity-50 shadow-2xs"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-[#B48A28] hover:bg-[#9E7719] disabled:bg-amber-400/50 text-white rounded-lg text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 shadow-xs hover:shadow-sm shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join Waitlist</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Subtle Scroll Down Cue */}
      <div className="mt-12 sm:mt-16 flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
        <span className="text-xs tracking-wider uppercase text-stone-600 mb-2 font-semibold">
          Discover The Vision
        </span>
        <ArrowDown className="w-4 h-4 text-stone-600 animate-bounce" />
      </div>
    </section>
  );
}
