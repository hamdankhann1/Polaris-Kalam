import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bed, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Flame, 
  MapPin,
  ChevronRight,
  ChevronLeft,
  Layers,
  Crown
} from 'lucide-react';
import { RoomService } from '../../services/roomService';
import { FloorService } from '../../services/floorService';
import { POLARIS_CONFIG } from '../../polarisConfig';

/**
 * =========================================================================
 * FloorExplorationSection Component — Swiss Framework & Floor Hall Exhibit
 * =========================================================================
 * 
 * Features:
 * - Natural section height with ZERO artificial viewport heights or whitespace voids
 * - Full horizontal left-to-right runway that can scroll cleanly to Floor 1 and all levels
 * - Architectural floor hall and corridor photograph for each floor (No wireframe geoshape)
 * - Ascending floor order: Floor 1 (Level 01) -> Floor 4 -> Top Suite (Level 05)
 * - Segment progress indicators (01 / 05) and rolling digital counter
 * - Touch-optimized snap points with peek view on phone and tablet
 * - Live MongoDB room inventory chips for instant direct booking
 * - Categorized solutions grid with numbered tiles (01 to 05)
 */

const SPATIAL_METADATA = {
  'Floor 1': {
    code: 'LEVEL 01',
    subtitle: 'Riverfront Garden Sanctuaries',
    altitudeDelta: '2,000M (VALLEY FLOOR)',
    highlight: 'Direct riverfront cedar deck, heated basalt floors, outdoor stone soak',
    atmosphere: 'Intimate riparian ground living with the rush of glacial meltwater',
    hallImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=85',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
  },
  'Floor 2': {
    code: 'LEVEL 02',
    subtitle: 'Pine Canopy Chambers',
    altitudeDelta: '2,004M (EVERGREEN CANOPY)',
    highlight: 'Himalayan cedar joinery, woven raw wool textiles, panoramic pine boughs',
    atmosphere: 'Elevated evergreen sanctuary immersed in century-old pine needles',
    hallImage: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
  },
  'Floor 3': {
    code: 'LEVEL 03',
    subtitle: 'Glacial Horizon Suites',
    altitudeDelta: '2,008M (RIDGE PANORAMA)',
    highlight: 'Floor-to-ceiling horizon glass, bio-ethanol stone hearth, limestone bath',
    atmosphere: 'Unobstructed panorama spanning 40km of snow-clad Ushu peaks',
    hallImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
  },
  'Floor 4': {
    code: 'LEVEL 04',
    subtitle: 'Celestial Summit Penthouse',
    altitudeDelta: '2,012M (CELESTIAL SKYLINE)',
    highlight: 'Monolithic cantilevered terrace, heated outdoor cedar plunge, stargazing suite',
    atmosphere: '360-degree high-altitude living beneath pristine Karakoram night skies',
    hallImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=85',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  },
  'Top Suite': {
    code: 'LEVEL 05',
    subtitle: 'Presidential Glacier Penthouse',
    altitudeDelta: '2,016M (SUMMIT SKYLINE)',
    highlight: '360° glacial panorama, private heated cedar plunge, dual stone hearths',
    atmosphere: 'The pinnacle of high-altitude solitude with private butler and panoramic Karakoram views',
    hallImage: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=85',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
  }
};

/**
 * Natural ascending order helper for hotel floors
 */
const floorOrderWeight = (name) => {
  const n = (name || '').trim().toLowerCase();
  if (n === 'floor 1' || n.includes('floor 1') || n.includes('ground') || n.includes('level 1') || n.includes('level 01')) return 1;
  if (n === 'floor 2' || n.includes('floor 2') || n.includes('level 2') || n.includes('level 02')) return 2;
  if (n === 'floor 3' || n.includes('floor 3') || n.includes('level 3') || n.includes('level 03')) return 3;
  if (n === 'floor 4' || n.includes('floor 4') || n.includes('level 4') || n.includes('level 04')) return 4;
  if (n.includes('top') || n.includes('penthouse') || n.includes('5') || n.includes('president')) return 5;
  return 99;
};

export default function FloorExplorationSection({ onOpenBooking, onOpenInquiry }) {
  const [rooms, setRooms] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const runwayRef = useRef(null);

  // 1. Fetch live rooms & floors from database on mount + subscribe
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [liveRooms, liveFloors] = await Promise.all([
          RoomService.getRooms(),
          FloorService.getFloors()
        ]);
        if (isMounted) {
          setRooms(liveRooms || []);
          setFloorsList(liveFloors || []);
        }
      } catch (err) {
        console.error('Error fetching live floor inventory:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    const unsubRooms = RoomService.subscribe((updatedRooms) => {
      if (isMounted) setRooms(updatedRooms || []);
    });

    const unsubFloors = FloorService.subscribe((updatedFloors) => {
      if (isMounted) setFloorsList(updatedFloors || []);
    });

    return () => {
      isMounted = false;
      unsubRooms();
      unsubFloors();
    };
  }, []);

  // 2. Dynamically group live rooms by floor from MongoDB, sorted ascending (Floor 1 -> Top Suite)
  const dynamicFloorGroups = useMemo(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) return [];

    const floorMap = new Map();

    rooms.forEach((room) => {
      const flrName = (room.floor || 'Floor 1').trim();
      if (!floorMap.has(flrName)) {
        floorMap.set(flrName, {
          floorName: flrName,
          rooms: [],
          categories: new Set(),
          amenities: new Set(),
          minPrice: Infinity,
          maxPrice: 0,
          availableCount: 0
        });
      }

      const entry = floorMap.get(flrName);
      entry.rooms.push(room);

      if (room.category) entry.categories.add(room.category);
      if (Array.isArray(room.amenities)) {
        room.amenities.forEach((a) => {
          if (a && typeof a === 'string') entry.amenities.add(a.trim());
        });
      }

      const price = Number(room.pricePKR) || 0;
      if (price > 0 && price < entry.minPrice) entry.minPrice = price;
      if (price > entry.maxPrice) entry.maxPrice = price;

      if (room.status === 'available') {
        entry.availableCount += 1;
      }
    });

    return Array.from(floorMap.values())
      .filter((g) => g.rooms.length > 0)
      .sort((a, b) => floorOrderWeight(a.floorName) - floorOrderWeight(b.floorName))
      .map((g, idx) => {
        const meta = SPATIAL_METADATA[g.floorName] || {
          code: `LEVEL 0${idx + 1}`,
          subtitle: `Alpine Horizon Tier 0${idx + 1}`,
          altitudeDelta: `+${(idx * 3.8).toFixed(1)}M ELEVATION`,
          highlight: 'Handcrafted cedar joinery, heated natural stone, panoramic insulated glass',
          atmosphere: 'Private architectural retreat designed around natural mountain light',
          hallImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=85',
          image: POLARIS_CONFIG.heroBackgroundImage
        };

        return {
          floorName: g.floorName,
          code: meta.code || `LEVEL 0${idx + 1}`,
          subtitle: meta.subtitle,
          altitudeDelta: meta.altitudeDelta,
          highlight: meta.highlight,
          atmosphere: meta.atmosphere,
          hallImage: meta.hallImage || meta.image,
          image: meta.image || POLARIS_CONFIG.heroBackgroundImage,
          roomCount: g.rooms.length,
          availableCount: g.availableCount,
          minPrice: g.minPrice === Infinity ? 45000 : g.minPrice,
          maxPrice: g.maxPrice === 0 ? 45000 : g.maxPrice,
          categories: Array.from(g.categories),
          amenities: Array.from(g.amenities).slice(0, 6),
          rooms: g.rooms
        };
      });
  }, [rooms, floorsList]);

  const totalSteps = dynamicFloorGroups.length || 4;

  /**
   * Smoothly scroll horizontal runway to target step with guaranteed 0 alignment for Floor 1
   */
  const scrollToStep = (idx) => {
    const targetIdx = Math.max(0, Math.min(idx, totalSteps - 1));
    setActiveStep(targetIdx);

    if (!runwayRef.current) return;

    if (targetIdx === 0) {
      runwayRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    const card = runwayRef.current.children[targetIdx];
    if (card) {
      const containerLeft = runwayRef.current.offsetLeft;
      const targetLeft = card.offsetLeft - containerLeft;
      runwayRef.current.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    const nextIdx = activeStep > 0 ? activeStep - 1 : totalSteps - 1;
    scrollToStep(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeStep < totalSteps - 1 ? activeStep + 1 : 0;
    scrollToStep(nextIdx);
  };

  // Sync active step indicator when user scrolls runway horizontally
  const handleRunwayScroll = () => {
    if (!runwayRef.current) return;
    const container = runwayRef.current;
    const scrollLeft = container.scrollLeft;

    // Guaranteed snap to Floor 1 if near start
    if (scrollLeft <= 35) {
      if (activeStep !== 0) setActiveStep(0);
      return;
    }

    const firstCard = container.firstElementChild;
    if (!firstCard) return;
    const cardWidth = firstCard.clientWidth + 20;
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < totalSteps && newIdx !== activeStep) {
      setActiveStep(newIdx);
    }
  };

  if (isLoading && dynamicFloorGroups.length === 0) {
    return (
      <section className="py-16 px-6 text-center font-mono text-xs text-stone-500 bg-[#FBFBFA]">
        <div className="animate-pulse">SYNCHRONIZING POLARIS SUITE INVENTORY...</div>
      </section>
    );
  }

  if (dynamicFloorGroups.length === 0) return null;

  const currentFloor = dynamicFloorGroups[activeStep] || dynamicFloorGroups[0];
  const stepNumber = `0${activeStep + 1}`;

  return (
    <div id="suites-spatial-index" className="w-full bg-[#FBFBFA]">
      
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE FRAMEWORK SHOWCASE (Inspired by 3d-discovery.fr cap-showcase) */}
      {/* ========================================================================= */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-10 border-t border-stone-200/90 bg-[#FBFBFA]">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Header Row (Matching 3d-discovery.fr cap-showcase__head) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
            <div className="sm:col-span-3 sg-tile p-3 sm:p-4 rounded-xl sg-crosshair">
              <p className="sg-label">Framework</p>
            </div>

            <div className="sm:col-span-5 sg-tile p-3 sm:p-4 rounded-xl hidden sm:flex items-center justify-between sg-crosshair">
              <p className="sg-label sg-label--muted">What you get · Live Floor Inventory</p>
            </div>

            {/* Segmented Progress Indicators (Fill according to active tier) */}
            <div className="sm:col-span-4 sg-tile p-3 sm:p-4 rounded-xl flex items-center justify-between sg-crosshair">
              <div className="flex items-center space-x-1.5 flex-1 mr-4">
                {dynamicFloorGroups.map((_, idx) => (
                  <div key={idx} className="h-1 flex-1 bg-stone-200/90 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        idx <= activeStep ? 'bg-[#8A661C] w-full' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <span className="font-mono text-xs font-bold text-stone-900 shrink-0">
                {stepNumber} / 0{totalSteps}
              </span>
            </div>
          </div>

          {/* Stepper Navigation: Horizon Pills & Chevrons */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center space-x-2">
              {dynamicFloorGroups.map((floor, idx) => {
                const isSelected = activeStep === idx;
                return (
                  <button
                    key={floor.floorName}
                    onClick={() => scrollToStep(idx)}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono text-[11px] sm:text-xs uppercase font-bold tracking-wider transition-all spring-button shrink-0 flex items-center space-x-1.5 touch-manipulation min-h-[42px] ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-2xs'
                    }`}
                  >
                    <span className={isSelected ? 'text-amber-300' : 'text-stone-400'}>
                      0{idx + 1}
                    </span>
                    <span>{floor.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Chevrons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handlePrev}
                className="p-2 sm:p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 transition-colors shadow-2xs spring-button"
                aria-label="Previous tier"
              >
                <ChevronLeft className="w-4 h-4 text-stone-800" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 sm:p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 transition-colors shadow-2xs spring-button"
                aria-label="Next tier"
              >
                <ChevronRight className="w-4 h-4 text-stone-800" />
              </button>
            </div>
          </div>

          {/* Floor Hall Stage: Architectural Hall Picture + Telemetry & Inventory */}
          <div className="sg-tile rounded-2xl p-5 sm:p-8 sg-crosshair bg-white border border-stone-200/90 shadow-lg transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Grand Floor Hallway & Corridor Exhibit Photo (Replacing the geoshape) */}
              <div className="md:col-span-6 h-[220px] sm:h-[280px] md:h-[320px] rounded-xl bg-stone-100 border border-stone-200/80 overflow-hidden relative group">
                <img
                  src={currentFloor.hallImage || currentFloor.image}
                  alt={`${currentFloor.floorName} Architectural Hall & Gallery`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />

                {/* Top Corner Markers */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
                  <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/20 text-white uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{currentFloor.code} // FLOOR HALL & GALLERY</span>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 font-bold">
                    {currentFloor.altitudeDelta.split(' ')[0]}
                  </span>
                </div>

                {/* Bottom Hallway Monograph Caption */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="p-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-white space-y-0.5">
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                      <span>{currentFloor.floorName} Corridor</span>
                      <span className="text-white/70">Kalam Valley Schist & Cedar</span>
                    </div>
                    <p className="text-xs text-stone-200 font-light line-clamp-1">
                      {currentFloor.highlight}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Horizon Metadata & Specifications */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-widest text-[#8A661C] font-bold">
                    <span>{currentFloor.code}</span>
                    <span>•</span>
                    <span>{currentFloor.altitudeDelta}</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight">
                    {currentFloor.floorName} — {currentFloor.subtitle}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
                    {currentFloor.atmosphere}
                  </p>
                </div>

                {/* Thermal Engineering Highlight */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-700 font-sans flex items-start space-x-2.5">
                  <Flame className="w-4 h-4 text-[#8A661C] shrink-0 mt-0.5" />
                  <span>{currentFloor.highlight}</span>
                </div>

                {/* Live Suite Count & Rates */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="uppercase text-stone-500 font-semibold">
                      Suites on {currentFloor.floorName}:
                    </span>
                    <span className="text-stone-900 font-bold">
                      From PKR {currentFloor.minPrice.toLocaleString()}/night
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{currentFloor.availableCount} of {currentFloor.rooms.length} Suites Available Now</span>
                    </span>
                    <span className="text-emerald-700 font-semibold">Instant Allocation</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono text-stone-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct Concierge Lock</span>
                  </div>

                  <button
                    onClick={() => onOpenBooking && onOpenBooking(currentFloor.floorName)}
                    className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-[#8A661C] active:scale-[0.98] text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center space-x-1.5 shadow-xs spring-button group"
                  >
                    <span>Reserve on {currentFloor.floorName}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* HORIZONTAL SHOWCASE RUNWAY (Glides smoothly left-to-right) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between text-xs font-mono text-stone-500 uppercase tracking-wider font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8A661C] animate-pulse" />
                <span>Horizontal Showcase Runway • Floor 1 to Penthouse</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 transition-colors shadow-2xs"
                  aria-label="Previous floor"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-stone-700" />
                </button>
                <span className="font-bold text-stone-900">{activeStep + 1} of {totalSteps}</span>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 transition-colors shadow-2xs"
                  aria-label="Next floor"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-stone-700" />
                </button>
              </div>
            </div>

            <div 
              ref={runwayRef}
              onScroll={handleRunwayScroll}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-none px-1"
            >
              {dynamicFloorGroups.map((floor, idx) => {
                const isSelected = activeStep === idx;
                const cardCode = `0${idx + 1}`;

                return (
                  <div
                    key={floor.floorName}
                    id={`floor-card-${idx}`}
                    onClick={() => scrollToStep(idx)}
                    className={`min-w-[85vw] sm:min-w-[500px] md:min-w-[560px] snap-start sg-tile rounded-2xl p-5 sm:p-7 flex flex-col justify-between space-y-4 bg-white border transition-all duration-300 sg-crosshair cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 shadow-xl ring-2 ring-stone-900/15'
                        : 'border-stone-200/90 hover:border-stone-400 shadow-sm opacity-95'
                    }`}
                  >
                    {/* Card Head */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                          {cardCode}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#8A661C] uppercase tracking-wider">
                          {floor.code}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-stone-500">
                        {floor.altitudeDelta}
                      </span>
                    </div>

                    {/* Image & Atmosphere */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-5 aspect-[16/11] rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 relative group">
                        <img
                          src={floor.hallImage || floor.image}
                          alt={`${floor.subtitle} Hall`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/55 backdrop-blur-xs text-[9px] font-mono text-white font-bold">
                          {floor.altitudeDelta.split(' ')[0]}
                        </div>
                      </div>

                      <div className="sm:col-span-7 space-y-2">
                        <h4 className="font-display text-xl sm:text-2xl text-stone-900 font-normal leading-snug">
                          {floor.subtitle}
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-3">
                          {floor.atmosphere}
                        </p>
                        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 text-[11px] text-stone-700 font-sans flex items-start space-x-2">
                          <Flame className="w-3.5 h-3.5 text-[#8A661C] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{floor.highlight}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Rooms Inventory Chips */}
                    <div className="space-y-2 pt-2 border-t border-stone-150">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="uppercase text-stone-500 font-semibold">
                          Live Inventory on {floor.floorName}:
                        </span>
                        <span className="text-stone-900 font-bold">
                          From PKR {floor.minPrice.toLocaleString()}/night
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 max-h-[88px] overflow-y-auto pr-1">
                        {floor.rooms.map((room, rIdx) => {
                          const isAvail = room.status === 'available';
                          const roomPrice = Number(room.pricePKR) || floor.minPrice;
                          const roomCat = room.category || floor.floorName;

                          return (
                            <div
                              key={room._id || room.id || rIdx}
                              className="p-1.5 sm:p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center space-x-2 text-xs"
                            >
                              <span className="font-mono font-bold text-stone-900 text-[11px]">
                                {room.roomNumber ? `#${room.roomNumber}` : `Suite 0${rIdx + 1}`}
                              </span>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                              <span className="font-mono text-stone-600 text-[10.5px]">
                                PKR {roomPrice.toLocaleString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenBooking && onOpenBooking(roomCat);
                                }}
                                className="px-2 py-0.5 rounded bg-stone-900 hover:bg-[#8A661C] text-white text-[9px] font-mono uppercase font-bold spring-button"
                              >
                                Book
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Reservation Button */}
                    <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[11px] font-mono text-stone-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Direct Concierge Lock</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBooking && onOpenBooking(floor.floorName);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-[#8A661C] active:scale-[0.98] text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center space-x-1.5 shadow-xs spring-button group"
                      >
                        <span>Reserve on {floor.floorName}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORIZED SOLUTIONS GRID (Inspired by 3d-discovery.fr sg-solutions) */}
      {/* ========================================================================= */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-10 border-t border-stone-200/90 bg-[#FBFBFA]">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#8A661C] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8A661C]" />
                <span>CHOOSE YOUR HORIZON</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-stone-900">
                Suites by Field & Altitude
              </h2>
            </div>

            <button
              onClick={() => onOpenBooking && onOpenBooking()}
              className="inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider font-bold text-stone-700 hover:text-stone-900 transition-colors"
            >
              <span>View All Allocations</span>
              <span className="text-[#8A661C]">→</span>
            </button>
          </div>

          {/* Modular Swiss Solution Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {dynamicFloorGroups.map((floor, idx) => {
              const cardCode = `0${idx + 1}`;

              return (
                <div
                  key={floor.floorName}
                  onClick={() => onOpenBooking && onOpenBooking(floor.floorName)}
                  className="sg-tile sg-tile--link rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 group sg-crosshair"
                >
                  {/* Card Head with Arrow and Code */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <span className="font-mono text-sm font-bold text-stone-400 group-hover:text-[#8A661C] transition-colors">
                      {cardCode}
                    </span>
                    <span className="font-mono text-xs text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 relative">
                    <img
                      src={floor.hallImage || floor.image}
                      alt={floor.subtitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs text-[9px] font-mono text-white uppercase font-bold">
                      {floor.altitudeDelta.split(' ')[0]}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-serif text-lg text-stone-900 font-medium group-hover:text-[#8A661C] transition-colors leading-snug">
                      {floor.subtitle}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-2">
                      {floor.atmosphere}
                    </p>
                  </div>

                  {/* Bottom Rate & Action */}
                  <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[9.5px] uppercase text-stone-400 block font-bold">From</span>
                      <span className="font-bold text-stone-900">PKR {floor.minPrice.toLocaleString()}</span>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-stone-800 group-hover:text-[#8A661C] transition-colors flex items-center space-x-1">
                      <span>Reserve</span>
                      <span>→</span>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}
