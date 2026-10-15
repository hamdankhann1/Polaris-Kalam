import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Mail, Phone, User, Send, Compass, Loader2 } from 'lucide-react';
import { POLARIS_CONFIG } from '../polarisConfig';
import { submitPrivateInquiry } from '../services/emailJsService';
import { BookingRequestService } from '../services/bookingRequestService';

/**
 * =========================================================================
 * InquiryModal Component
 * =========================================================================
 * 
 * Interactive inquiry form modal allowing potential guests, corporate partners,
 * travel connoisseurs, and press to connect prior to the official launch.
 * 
 * Features:
 * - Clean glassmorphism overlay
 * - Escape key / Backdrop click dismiss
 * - Form validation with feedback message
 * - Dispatches via EmailJS with custom inquiry email response
 */
export default function InquiryModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'December 1st Soft Launch VIP List',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Dispatches via EmailJS (only routes to Brevo if user explicitly selected VIP list option)
    await submitPrivateInquiry({
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      interest: formData.interest,
      message: formData.message,
    });

    // Also mirror to CMS booking inquiries queue so the notification badge increments in the CMS
    try {
      await BookingRequestService.createRequest({
        guestName: formData.name,
        email: formData.email,
        phone: formData.phone || '+92 300 0000000',
        roomId: 'inquiry-launch',
        roomNumber: 'INQ',
        roomName: 'Main Website Inquiry',
        tier: formData.interest,
        floor: 'Floor 1',
        pricePKR: 0,
        notes: formData.message ? `[${formData.interest}] ${formData.message}` : `Private Inquiry: ${formData.interest}`,
        status: 'pending'
      });
    } catch (inqErr) {
      console.warn('Could not mirror inquiry to CMS queue:', inqErr);
    }

    setIsLoading(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        interest: 'December 1st Soft Launch VIP List',
        message: '',
      });
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn w-full max-w-full overflow-x-hidden">
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl glass-panel border border-stone-200 rounded-2xl p-4 sm:p-8 md:p-10 shadow-2xl z-10 bg-white/95 text-stone-900 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 sm:mb-8 pr-8">
          <div className="flex items-center space-x-2 text-[#8A661C] text-xs sm:text-sm font-mono tracking-wider uppercase mb-2 font-bold">
            <img
              src={POLARIS_CONFIG.emblem}
              alt="Polaris Emblem"
              className="w-4 h-4 object-contain filter drop-shadow-[0_1px_3px_rgba(180,138,40,0.3)]"
            />
            <span>Exclusive Access</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-stone-900 font-medium">
            Private Inquiries & Previews
          </h3>
          <p className="text-stone-700 text-sm sm:text-base mt-2 font-normal leading-relaxed">
            Connect with our hospitality concierge for corporate retreats, media partnerships, or private inquiries at Polaris Kalam.
          </p>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center">
            <CheckCircle className="w-14 h-14 text-[#B48A28] mb-4 animate-bounce" />
            <h4 className="text-xl font-display text-stone-900 mb-2 font-medium">Inquiry Received</h4>
            <p className="text-sm sm:text-base text-stone-700 max-w-sm font-normal">
              Our hospitality concierge team will contact you with priority allocations before public opening.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm tracking-wider uppercase text-stone-800 mb-1.5 font-mono font-semibold">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm tracking-wider uppercase text-stone-800 mb-1.5 font-mono font-semibold">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm tracking-wider uppercase text-stone-800 mb-1.5 font-mono font-semibold">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
                  />
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm tracking-wider uppercase text-stone-800 mb-1.5 font-mono font-semibold">
                Primary Interest
              </label>
              <select
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                <option value="December 1st Soft Launch VIP List" className="bg-white text-stone-900">December 1st Soft Launch VIP List</option>
                <option value="Tourism & Press Partnership" className="bg-white text-stone-900">Tourism & Press Partnership</option>
                <option value="Corporate Retreat / Private Buyout" className="bg-white text-stone-900">Corporate Retreat / Private Buyout</option>
                <option value="General Concierge Inquiry" className="bg-white text-stone-900">General Concierge Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm tracking-wider uppercase text-stone-800 mb-1.5 font-mono font-semibold">
                Notes or Special Requirements
              </label>
              <textarea
                rows={3}
                placeholder="Share any specific dates, preferences, or questions..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-500 text-sm sm:text-base focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 bg-[#B48A28] hover:bg-[#9E7719] disabled:bg-amber-400/50 text-white text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 mt-4 shadow-sm hover:shadow-md rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Inquiry...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
