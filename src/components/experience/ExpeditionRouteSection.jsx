import React from 'react';
import { Compass, MapPin, Navigation, Car, Mountain, ArrowRight } from 'lucide-react';

/**
 * =========================================================================
 * ExpeditionRouteSection Component — The Journey to Kalam
 * =========================================================================
 */

const ITINERARY_STAGES = [
  {
    step: '01',
    from: 'Islamabad / Rawalpindi',
    to: 'Chakdara Interchange',
    via: 'M-1 & Swat Motorway (M-16)',
    duration: '2.5 Hours',
    distance: '160 km',
    icon: Car,
    description: 'High-speed modern motorway through the scenic Malakand mountain pass.'
  },
  {
    step: '02',
    from: 'Chakdara',
    to: 'Mingora / Saidu Sharif',
    via: 'Swat Motorway Phase 2',
    duration: '45 Minutes',
    distance: '55 km',
    icon: Navigation,
    description: 'Passing historic Gandhara Buddhist heritage sites and pine valleys.'
  },
  {
    step: '03',
    from: 'Mingora',
    to: 'Bahrain & Madyan Gorges',
    via: 'Kalam Highway (N-95)',
    duration: '1 Hour',
    distance: '60 km',
    icon: MapPin,
    description: 'Following the rushing Swat River through dramatic riverside stone cliffs.'
  },
  {
    step: '04',
    from: 'Bahrain',
    to: 'Polaris Kalam Sanctuary',
    via: 'Alpine Valley Ascent',
    duration: '1.5 Hours',
    distance: '45 km',
    icon: Mountain,
    description: 'Rising to 2,000m elevation into Kalam’s pristine cedar basin.'
  }
];

const LOCAL_WONDERS = [
  { name: 'Ushu Ancient Pine Forest', distance: '8 km', time: '15 mins', tag: 'Centuries-old cedar canopy walks' },
  { name: 'Mahodand Glacial Lake', distance: '35 km', time: '1.5 hrs (4x4)', tag: 'Trout fishing & glacial waters' },
  { name: 'Matiltan Glacial Cascade', distance: '14 km', time: '30 mins', tag: 'Thunderous meltwater waterfall' },
  { name: 'Kundol Emerald Lake', distance: '28 km', time: '2 hrs (Trek)', tag: 'Untouched high-altitude cirque' },
  { name: 'Falak Sar Peak (5,918m)', distance: 'Trailhead', time: 'Expedition', tag: 'The monarch summit of Swat' }
];

export default function ExpeditionRouteSection({ onOpenInquiry }) {
  return (
    <section id="location-expedition" className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#8A661C] font-bold">
            <Compass className="w-3.5 h-3.5 text-[#8A661C]" />
            <span>GEOGRAPHY & ACCESS</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-stone-900 leading-tight">
            The Journey to Kalam Valley
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal pt-1">
            Perched at 2,000 meters in Swat Kohistan, Polaris is accessible via a seamless alpine journey from Islamabad along the high-speed M-16 Swat Motorway.
          </p>
        </div>

        {/* 4-Stage Itinerary Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITINERARY_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="p-6 sm:p-7 bg-white border border-stone-200/90 rounded-3xl flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md hover:border-stone-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-150">
                    <span className="font-mono text-xs font-bold text-[#8A661C] flex items-center space-x-1.5">
                      <Icon className="w-3.5 h-3.5 text-[#8A661C]" />
                      <span>STAGE {stage.step}</span>
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">
                      {stage.duration}
                    </span>
                  </div>

                  <div className="text-[10px] uppercase font-mono text-stone-400 font-bold mb-1">
                    {stage.via}
                  </div>
                  <h3 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-2">
                    {stage.from} <span className="text-[#8A661C]">→</span> {stage.to}
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-150 flex items-center justify-between text-[11px] font-mono text-stone-500">
                  <span>Distance</span>
                  <span className="font-bold text-stone-900">{stage.distance}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Surrounding Excursions Grid */}
        <div className="p-8 sm:p-12 bg-white border border-stone-200/90 rounded-3xl space-y-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-150">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#8A661C] font-bold">
                SURROUNDING EXPEDITIONS
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium mt-1">
                Curated Excursions from Polaris Sanctuary
              </h3>
            </div>
            {onOpenInquiry && (
              <button
                onClick={onOpenInquiry}
                className="self-start sm:self-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all shadow-xs"
              >
                Arrange 4x4 Chauffeur
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {LOCAL_WONDERS.map((wonder, wIdx) => (
              <div
                key={wIdx}
                className="p-5 border border-stone-200/80 rounded-2xl bg-stone-50/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mb-2">
                    <span className="text-[#8A661C] font-bold">{wonder.distance}</span>
                    <span>{wonder.time}</span>
                  </div>
                  <div className="font-serif text-base text-stone-900 font-medium">
                    {wonder.name}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-stone-500 mt-3 italic">
                  {wonder.tag}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
