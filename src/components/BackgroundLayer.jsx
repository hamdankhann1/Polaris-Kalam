import React from 'react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * BackgroundLayer Component
 * =========================================================================
 * 
 * This component controls the full-screen visual backdrop:
 * 
 * 1. ZERO-IMAGE MODE (Default):
 *    When `POLARIS_CONFIG.backgroundImage` is empty (""), this renders a
 *    pure CSS & SVG generative architectural dark mesh with ambient starlight
 *    auroras. NO external image assets are downloaded or required.
 * 
 * 2. IMAGE MODE:
 *    When you provide an image URL or local path (e.g. "/my-building.jpg")
 *    in `polarisConfig.js`, it automatically displays your image with an
 *    elegant luxury dark gradient veil over it so that text remains 100%
 *    readable and sleek.
 */
export default function BackgroundLayer() {
  const hasCustomImage = Boolean(POLARIS_CONFIG.backgroundImage && POLARIS_CONFIG.backgroundImage.trim() !== "");

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF9F5]">
      {/* ------------------------------------------------------------- */}
      {/* OPTION 1: USER'S CUSTOM BACKGROUND IMAGE (If provided)        */}
      {/* ------------------------------------------------------------- */}
      {hasCustomImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105 motion-safe:animate-pulse-slow"
          style={{ backgroundImage: `url(${POLARIS_CONFIG.backgroundImage})` }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* OPTION 2: PURE ARCHITECTURAL PROCEDURAL BACKDROP (No images)  */}
      {/* ------------------------------------------------------------- */}
      {!hasCustomImage && (
        <>
          {/* Luminous Alpine morning light gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF8F3] to-[#F2EFE8]" />

          {/* Northern Star (Polaris) celestial focal golden aura */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[750px] h-[750px] rounded-full bg-gradient-to-b from-amber-300/25 via-amber-100/20 to-transparent blur-3xl pointer-events-none" />

          {/* Alpine glacial breeze and cedar warmth glows */}
          <div className="absolute top-[28%] -left-[10%] w-[550px] h-[550px] rounded-full bg-sky-200/20 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-[-10%] -right-[10%] w-[650px] h-[650px] rounded-full bg-amber-200/25 blur-[160px] pointer-events-none" />

          {/* Architectural engineering coordinates grid */}
          <div className="absolute inset-0 architectural-grid opacity-80" />

          {/* Minimalist SVG Constellation & Starlight Lines in refined champagne gold */}
          <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="starGlowLight" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Geometric architectural framing lines */}
            <line x1="10%" y1="0%" x2="90%" y2="100%" stroke="rgba(180, 138, 40, 0.08)" strokeWidth="1" />
            <line x1="90%" y1="0%" x2="10%" y2="100%" stroke="rgba(180, 138, 40, 0.08)" strokeWidth="1" />
            
            {/* Polaris starlight coordinates dots */}
            <circle cx="50%" cy="18%" r="3.5" fill="#B48A28" />
            <circle cx="50%" cy="18%" r="20" fill="url(#starGlowLight)" />
            <circle cx="38%" cy="28%" r="2" fill="#B48A28" opacity="0.6" />
            <circle cx="62%" cy="24%" r="2" fill="#B48A28" opacity="0.5" />
            <circle cx="25%" cy="45%" r="1.8" fill="#78716C" opacity="0.35" />
            <circle cx="75%" cy="42%" r="1.8" fill="#78716C" opacity="0.35" />
            <circle cx="48%" cy="65%" r="1.5" fill="#78716C" opacity="0.3" />
            <circle cx="55%" cy="80%" r="1.8" fill="#78716C" opacity="0.35" />
          </svg>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LUXURY LIGHT VEIL (Ensures contrast & pristine readability)  */}
      {/* ------------------------------------------------------------- */}
      {hasCustomImage && (
        <div 
          className="absolute inset-0 bg-[#FAF9F5]/75 backdrop-blur-[1px]" 
          style={{ opacity: POLARIS_CONFIG.backgroundOverlayOpacity || 0.75 }} 
        />
      )}
    </div>
  );
}
