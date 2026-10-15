# POLARIS — Kalam Valley Premier Hotel
### Modern "Opening Soon" Landing Page

Polaris is a premier luxury hotel project being built in **Kalam Valley, Swat**, designed to redefine hospitality and the experience of tourism in the region.

This project is a React-based modern landing page placeholder designed to announce that Polaris will be opening soon, allowing visitors to discover the architectural vision, view the launch countdown, and register for private booking inquiries.

---

## Key Features

1. **Ultra-Modern Architectural Aesthetic**:
   - Monolithic, dark obsidian palette with subtle champagne gold starlight accents.
   - Glassmorphic panels, fine geometric coordinate badges, and luxury typography (`Cinzel`, `Syne`, and `Plus Jakarta Sans`).
2. **Zero External Images by Default**:
   - The initial design uses **no image assets whatsoever**.
   - A generative dark mesh with vector starlight and celestial coordinates represents the North Star (Polaris) in the alpine sky.
3. **Changeable Background Image**:
   - Change your background image anytime with a single line edit in `src/polarisConfig.js`.
4. **Live Launch Countdown**:
   - Automatically computes remaining days, hours, minutes, and seconds until the inaugural season.
5. **Private VIP Inquiry & Waitlist Capture**:
   - Includes an inline quick notification form and an interactive inquiry modal for VIP bookings and tourism press.
6. **Extensively Documented Code**:
   - Every file and component contains thorough explanatory comments.

---

## How to Run the Website

Make sure you have Node.js installed, then run:

```bash
# Install dependencies (already installed)
npm install

# Start the local development server
npm run dev

# Build for production deployment
npm run build
```

---

## How to Change the Background Image

Open [`src/polarisConfig.js`](file:///Users/khanhamdan/Developer/Polaris%20Kalam%20Hotel/src/polarisConfig.js) and locate the `backgroundImage` property:

### Option 1: Using your own local image
1. Copy your photo (e.g. `polaris-exterior.jpg`) into the `public/` directory.
2. In `src/polarisConfig.js`, set:
   ```javascript
   backgroundImage: "/polaris-exterior.jpg",
   ```

### Option 2: Using an online image URL
Set the URL directly:
```javascript
backgroundImage: "https://images.example.com/polaris-building.jpg",
```

### Option 3: Returning to the image-free modern procedural canvas
Simply set it back to an empty string:
```javascript
backgroundImage: "",
```

You can also adjust `backgroundOverlayOpacity` (e.g. `0.85` or `0.70`) to control how dark the luxury tint over your image should be.

---

## How to Set Up Automated Welcome Emails (Brevo / Mailchimp)

When visitors register for the **December 1st Soft Launch**, you can have them automatically receive a branded luxury welcome email and build your subscriber list.

1. **Create a Free Account** on [Brevo (Sendinblue)](https://www.brevo.com).
2. Go to **Contacts > Forms** and click **Create a new subscription form**.
3. Customize the confirmation/welcome email with your message:
   *"Welcome to Polaris Kalam Valley — You are on the priority list for our December 1st Soft Launch."*
4. In the final step of the form builder, copy the **Form URL** or **Form Action URL**.
5. Paste it in [`src/polarisConfig.js`](file:///Users/khanhamdan/Developer/Polaris%20Kalam%20Hotel/src/polarisConfig.js):
   ```javascript
   newsletter: {
     provider: "brevo",
     endpoint: "https://your-brevo-form-url-here",
     welcomeSubject: "Welcome to Polaris Kalam Valley — Soft Launch December 1st",
   }
   ```
*Note: If `endpoint` is left empty `""`, the website runs in preview mode and stores submissions in the browser's `localStorage` so you can test without an account.*

---

## Website Structure & URL Routing

### 1. Main Landing Website (`polarishotels.pk`)
- High-altitude architectural luxury experience with celestial starlight theme.
- Features **"BOOKING WILL BE OPEN SOON"** banner and launch countdown.
- Link to explore suites and direct allocations at `polarishotels.pk/booking`.
- Private inquiries modal for press, corporate buyouts, and VIP launch list.
- **ZERO visible admin links or buttons anywhere on the public page.**

### 2. Direct Booking Website (`polarishotels.pk/booking`)
- Minimal, clean luxury suites catalog organized across **4 floors and one top penthouse suite**.
- Displays real-time availability badges:
  - 🟢 **Available** $\rightarrow$ Guests can submit a **"Request Reservation"** inquiry.
  - 🔴 **Reserved / Fully Booked** $\rightarrow$ Button disabled to prevent double bookings.
  - 🟡 **Turnover** $\rightarrow$ "Inquire for Next Check-in".
- When guests submit an inquiry, they provide their WhatsApp contact and stay dates.

### 3. Secret Hotel Staff Admin CMS (`polarishotels.pk/admintopsecretmanage`)
- **Direct Link Only**: Accessible exclusively at `http://localhost:5173/#admintopsecretmanage` (or `polarishotels.pk/admintopsecretmanage`).
- **Master Admin Password**: `Polar1s@Kalam@Admin@12/26`
- **Cryptographic Security**: Password is verified via client-side SHA-256 hash (`5fca4e1354c237a86321950ebdc55dc62f7ac8749a688add45bba0226f37785d`). The plain text password is never stored in source code.
- **Core CMS Capabilities**:
  1. **Guest Booking Requests Tab**:
     - View all incoming requests from the booking website.
     - **1-Click WhatsApp Chat**: Directly opens a WhatsApp chat (`wa.me`) with the guest pre-loaded with a luxury concierge confirmation message.
     - **1-Click Approve & Lock Room**: Automatically updates that room to **`booked`** on the public website and marks request as approved!
  2. **Room Inventory & Availability Tab**:
     - Manage rooms across **Floor 1**, **Floor 2**, **Floor 3**, **Floor 4**, and the **Top Suite**.
     - 3-option status switcher on each card (`Available`, `Booked`, `In Cleaning`).
     - **Add New Rooms** and **Remove Rooms** (with confirmation).
     - **Change Nightly Rates (PKR)** with 1-click seasonal percentage presets (+10%, +25%, -10%).

---

## Project Structure

```text
├── index.html                 # HTML shell with Google Fonts and vector favicon
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Custom luxury theme colors, fonts, and animations
├── vite.config.js             # Vite build & dev server config
├── public/                    # Logos, emblems, and optional background images
└── src/
    ├── polarisConfig.js       # Central configuration (text, launch date, background image)
    ├── index.css              # Global styles, glassmorphism, and architectural grid
    ├── main.jsx               # React 19 application entrypoint
    ├── App.jsx                # Router: Main Site, /booking, and /admintopsecretmanage
    ├── services/
    │   ├── roomService.js     # Room inventory, 4 floors + top suite, nightly rates
    │   ├── bookingRequestService.js # Guest requests, WhatsApp link generator, approvals
    │   ├── emailJsService.js  # VIP private inquiry dispatch
    │   └── newsletterService.js # Waitlist dispatch
    └── components/
        ├── booking/
        │   └── BookingPage.jsx        # Minimal luxury booking site (polarishotels.pk/booking)
        ├── admin/
        │   ├── AdminPortal.jsx        # Staff room dashboard, WhatsApp approvals & pricing
        │   ├── RoomFormModal.jsx      # Add new room & edit room specifications
        │   ├── QuickPriceModal.jsx    # Instant nightly price adjustment & seasonal presets
        │   ├── DeleteConfirmModal.jsx # Safe room removal confirmation
        │   ├── StatusChangeModal.jsx  # 3-status transition modal (guest/cleaning info)
        │   ├── NewBookingModal.jsx    # Manual external booking recorder
        │   ├── RoomDetailsModal.jsx   # Room specs & operational audit view
        │   └── StaffLoginModal.jsx    # PIN protection gate (Default: 2026)
        ├── BackgroundLayer.jsx  # Renders zero-image mesh or custom image overlay
        ├── Navbar.jsx           # Header with 'BOOKING WILL BE OPEN SOON' & booking link
        ├── Hero.jsx             # Hero with 'BOOKING WILL BE OPEN SOON' banner & waitlist
        ├── CountdownTimer.jsx   # Real-time countdown calculation
        ├── VisionSection.jsx    # Architectural concept pillars
        ├── InquiryModal.jsx     # Clean VIP private inquiry popup
        └── Footer.jsx           # Location, contact info, and booking portal link
```
