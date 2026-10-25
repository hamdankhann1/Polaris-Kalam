import React from 'react';
import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * BackgroundLayer Component — Pure Alpine Luxury Canvas
 * =========================================================================
 * 
 * Clean, serene, natural mountain light.
 * Eliminates distracting diagrams, diagonal lines, and artificial meshes.
 */
export default function BackgroundLayer() {
  const hasCustomImage = Boolean(POLARIS_CONFIG.backgroundImage && POLARIS_CONFIG.backgroundImage.trim() !== "");

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF9F5]">
      {/* Custom User Background Photo (if configured) */}
      {hasCustomImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105 motion-safe:animate-pulse-slow"
          style={{ backgroundImage: `url(${POLARIS_CONFIG.backgroundImage})` }}
        />
      )}

      {/* Pure, Serene Luminous Alpine Canvas */}
      {!hasCustomImage && (
        <>
          {/* Natural Morning Sunlight Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] via-[#F7F5F0] to-[#F3F0EA]" />

          {/* Soft Natural Atmospheric Warmth (Subtle diffuse light) */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-b from-amber-100/30 to-transparent blur-3xl pointer-events-none" />
        </>
      )}

      {/* Luxury Light Veil (if custom photo is active) */}
      {hasCustomImage && (
        <div 
          className="absolute inset-0 bg-[#FAF9F5]/80 backdrop-blur-[1px]" 
          style={{ opacity: POLARIS_CONFIG.backgroundOverlayOpacity || 0.8 }} 
        />
      )}
    </div>
  );
}
