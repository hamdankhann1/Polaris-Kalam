/**
 * ======================================================================================
 * POLARIS HOTEL — CONFIGURATION FILE
 * ======================================================================================
 *
 * Welcome to the Polaris website settings! You can customize everything here
 * without needing to touch complex React code.
 *
 * --------------------------------------------------------------------------------------
 * HOW TO CHANGE THE BACKGROUND IMAGE:
 * --------------------------------------------------------------------------------------
 * 1. OPTION A (Use your own local photo):
 *    - Place your photo file (e.g. "hotel-bg.jpg") inside the "public/" folder.
 *    - Set `backgroundImage: "/hotel-bg.jpg"` below.
 *
 * 2. OPTION B (Use an image URL):
 *    - Set `backgroundImage: "https://your-domain.com/photo.jpg"`
 *
 * 3. OPTION C (No image - Modern Dark Architectural Mesh):
 *    - Leave `backgroundImage: ""` (an empty string).
 *    - The website will automatically render an ultra-modern dark gradient mesh
 *      with ambient starlight effects and zero external images!
 *
 * ======================================================================================
 */

export const POLARIS_CONFIG = {
  // --- BRAND IDENTITY & LOGO ---
  hotelName: "POLARIS",
  brandSubtitle: "HOTELS & RESORTS",
  tagline: "The North Star of Alpine Luxury",
  logo: "/polaris-logo-tight.png",
  logoFull: "/polaris-logo.png",
  emblem: "/polaris-emblem.png",
  location: "Kalam Valley, Swat, Pakistan",
  coordinates: "35°29'12.4N 72°3504.0E",
  elevation: "2,000 Meters",

  // --- HERO SECTION BACKGROUND IMAGE ---
  // Background photo specifically rendered for the top Hero section
  heroBackgroundImage: "/polaris-hero-bg.jpg",
  heroBackgroundImageMobile: "/polaris-hero-bg-mobile.jpg",
  heroBackgroundOverlayOpacity: 0.68,

  // --- GLOBAL BACKGROUND IMAGE SETTING (FULL SITE) ---
  // Leave empty `""` to display the luminous light theme procedural canvas across other sections.
  backgroundImage: "",

  // Dark overlay opacity over the global background image (from 0.1 to 0.95).
  backgroundOverlayOpacity: 0.82,

  // --- VIP WAITLIST & AUTOMATED EMAIL SERVICE (HERO SECTION) ---
  // Live Brevo (Sendinblue) endpoint configured for the December 1st Soft Launch waitlist.
  newsletter: {
    provider: "brevo",
    endpoint:
      "https://ca3f3c0d.sibforms.com/serve/MUIFAKGTddn0dYPjGWAOu1Scnv5UD0-xz-51ip75JDoJfREunF6g5m1ue767IjNtxjkUDJDhm4FvZphb1s8iSAeI42rChPdG1F1Ynibce4_6Eh8t2YcJ96231oeyJTLE8EoKLqLng29HhQZgzv4JT4P8pinuwZM1zc1qhK5vQC6phtNXBKU09N74rMZ9KitxSF-OJE-YGagh06fRpw==",
    welcomeSubject:
      "Welcome to Polaris Kalam Valley — Soft Launch December 1st",
  },

  // --- EMAILJS CONFIGURATION (FOR PRIVATE INQUIRIES MODAL) ---
  // Private inquiries (Suite bookings, Press, Corporate) are handled by EmailJS.
  // Sends notification emails directly to the hotel management (no confirmation sent to guest).
  emailjs: {
    serviceId: "service_qx2qws3",
    templateId: "template_kn7mzdb",
    publicKey: "xA12DzFiEYvbvei6G",
  },

  // --- LAUNCH & COUNTDOWN STATUS ---
  statusBadge: "OPENING SOON",
  subStatus: "Architecture Under Construction • Inaugural Season 2026",

  // Target launch date for the countdown timer (Format: YYYY-MM-DDTHH:MM:SS)
  targetLaunchDate: "2026-12-01T00:00:00",

  // --- BRAND NARRATIVE / MISSION STATEMENT ---
  mission: {
    headline: "Redefining High-Altitude Hospitality",
    description:
      "Rising amidst the pine forests and glacial peaks of Kalam Valley, Polaris is an architectural sanctuary designed to transcend conventional tourism. We are crafting an immersive retreat where avant-garde design, bespoke service, and untouched nature converge.",
  },

  // --- ARCHITECTURAL PILLARS (Experience Highlights) ---
  // Pure typography and concept previews - no images required.
  pillars: [
    {
      number: "01",
      title: "Panoramic Glass Living",
      category: "ARCHITECTURE",
      description:
        "Monolithic, climate-engineered suites offering unobstructed floor-to-ceiling vistas of Kalam's snow-clad horizons and celestial night skies.",
    },
    {
      number: "02",
      title: "Bespoke Hospitality",
      category: "SERVICE",
      description:
        "A tailored, discreet guest experience curated from arrival to departure, establishing a new benchmark for luxury tourism in Northern Pakistan.",
    },
    {
      number: "03",
      title: "Alpine Gastronomy",
      category: "CULINARY",
      description:
        "An avant-garde dining experience marrying indigenous mountain flavors with contemporary fine dining techniques.",
    },
    {
      number: "04",
      title: "Holistic Thermal Sanctuary",
      category: "WELLNESS",
      description:
        "Heated infinity hydrotherapy pools, mountain herb steam baths, and serene relaxation spaces crafted from local stone.",
    },
  ],

  // --- CONTACT & INQUIRIES ---
  contact: {
    email: "concierge@polarishotel.pk",
    phone: "+92 3142107800",
    locationAddress:
      "Main Kalam Valley Road, Swat, Khyber Pakhtunkhwa, Pakistan",
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
    },
  },
};
