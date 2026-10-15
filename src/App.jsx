import React, { useState, useEffect } from 'react';
import BackgroundLayer from './components/BackgroundLayer';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VisionSection from './components/VisionSection';
import Footer from './components/Footer';
import InquiryModal from './components/InquiryModal';
import AdminPortal from './components/admin/AdminPortal';
import StaffLoginModal from './components/admin/StaffLoginModal';
import BookingPage from './components/booking/BookingPage';

/**
 * =========================================================================
 * Polaris Hotel — Main Application Routing
 * =========================================================================
 * 
 * Supports 3 environments:
 * 1. Main Landing Website ('website') — Default home page
 * 2. Direct Booking Portal ('booking') — Accessed via /booking or #booking (polarishotels.pk/booking)
 * 3. Secret Admin CMS ('admin') — ONLY accessible via /admintopsecretmanage or #admintopsecretmanage
 * 
 * SECURITY:
 * - There are ZERO visible links or buttons on the home page leading to the admin portal.
 * - Access is strictly limited to the secret direct link: polarishotels.pk/admintopsecretmanage
 * - Protected with staff PIN gate.
 */
export default function App() {
  // Determine initial view from URL path/hash
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      // Check for booking portal link first
      if (
        hash === '#booking' ||
        path === '/booking' ||
        path.endsWith('/booking') ||
        search.includes('booking=true')
      ) {
        return 'booking';
      }

      // Check for secret admin link
      if (
        hash === '#admintopsecretmanage' ||
        path === '/admintopsecretmanage' ||
        path.endsWith('/admintopsecretmanage')
      ) {
        return 'admin';
      }
    }
    return 'website';
  });

  // Staff Authentication State (for secret admin)
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('polaris_staff_auth') === 'true';
    }
    return false;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // Sync with browser URL changes
  useEffect(() => {
    const handleLocationCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      // 1. Check for booking portal (takes priority if hash is #booking or path is /booking)
      if (
        hash === '#booking' ||
        path === '/booking' ||
        path.endsWith('/booking') ||
        search.includes('booking=true')
      ) {
        setCurrentView('booking');
        return;
      }

      // 2. Check for secret admin link
      if (
        hash === '#admintopsecretmanage' ||
        path === '/admintopsecretmanage' ||
        path.endsWith('/admintopsecretmanage')
      ) {
        setCurrentView('admin');
        return;
      }

      // 3. Otherwise default to website
      setCurrentView('website');
    };

    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);
    return () => {
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  // Handlers for Views
  const handleOpenBooking = () => {
    setCurrentView('booking');
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, document.title, window.location.origin + '/booking');
      } catch (e) {
        window.location.hash = 'booking';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Option C: Strict Auto-Logout on Exit
  // Whenever staff leaves the admin console to return to the public website, automatically terminate the staff session
  // and reset the browser URL to '/' so the domain is NEVER stuck at /admintopsecretmanage!
  const handleExitAndLogout = () => {
    setIsStaffAuthenticated(false);
    sessionStorage.removeItem('polaris_staff_auth');
    setCurrentView('website');
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, document.title, window.location.origin + '/');
      } catch (e) {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToWebsite = () => {
    setCurrentView('website');
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, document.title, window.location.origin + '/');
      } catch (e) {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setIsStaffAuthenticated(true);
    sessionStorage.setItem('polaris_staff_auth', 'true');
    setIsLoginModalOpen(false);
    setCurrentView('admin');
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, document.title, window.location.origin + '/admintopsecretmanage');
      } catch (e) {
        window.location.hash = 'admintopsecretmanage';
      }
    }
  };

  const handleLogout = () => {
    setIsStaffAuthenticated(false);
    sessionStorage.removeItem('polaris_staff_auth');
    setCurrentView('website');
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, document.title, window.location.origin + '/');
      } catch (e) {
        window.location.hash = '';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // VIEW 1: SECRET ADMIN PORTAL (polarishotels.pk/admintopsecretmanage)
  // =========================================================================
  if (currentView === 'admin') {
    if (isStaffAuthenticated) {
      return (
        <AdminPortal
          onReturnToWebsite={handleExitAndLogout} // Option C: Auto-logout on exit to website
          onOpenBooking={handleOpenBooking}       // Option A: Live guest booking preview in staff mode
          onLogout={handleLogout}
        />
      );
    }

    // Require PIN for secret admin URL
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6 text-stone-900">
        <BackgroundLayer />
        <StaffLoginModal
          isOpen={true}
          onLoginSuccess={handleLoginSuccess}
          onCancel={handleReturnToWebsite}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DIRECT BOOKING PORTAL (polarishotels.pk/booking)
  // =========================================================================
  if (currentView === 'booking') {
    return (
      <BookingPage
        onReturnHome={handleExitAndLogout} // Option C: Auto-logout on return to sanctuary/website
        isAdmin={isStaffAuthenticated}      // Option A: Staff preview banner with 1-click return
        onReturnToAdmin={() => {
          setCurrentView('admin');
          if (typeof window !== 'undefined') {
            try {
              window.history.pushState(null, document.title, window.location.origin + '/admintopsecretmanage');
            } catch (e) {
              window.location.hash = 'admintopsecretmanage';
            }
          }
        }}
        onLogout={handleLogout}             // Option C: Direct logout action
      />
    );
  }

  // =========================================================================
  // VIEW 3: MAIN LANDING WEBSITE (Default)
  // =========================================================================
  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden text-stone-800 selection:bg-amber-200 selection:text-stone-900">
      
      {/* Visual Backdrop */}
      <BackgroundLayer />

      {/* Top Architectural Navigation Bar */}
      <Navbar 
        onOpenInquiry={() => setIsInquiryModalOpen(true)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-full overflow-x-hidden">
        {/* Hero Section: Brand, "BOOKING WILL BE OPEN SOON", Countdown & Waitlist */}
        <Hero 
          onOpenInquiry={() => setIsInquiryModalOpen(true)}
          onOpenBooking={handleOpenBooking}
        />

        {/* Vision Section: Concept Pillars & Hotel Standards in Kalam Valley */}
        <VisionSection onOpenInquiry={() => setIsInquiryModalOpen(true)} />
      </main>

      {/* Footer Section */}
      <Footer 
        onOpenInquiry={() => setIsInquiryModalOpen(true)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Private Inquiry & Early Access Modal */}
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />

    </div>
  );
}
