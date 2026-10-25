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
 * travel connoisseurs, and press to connect prior to official opening.
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

    await submitPrivateInquiry({
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      interest: formData.interest,
      message: formData.message,
    });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn w-full overflow-x-hidden">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl glass-panel border border-stone-200 rounded-2xl p-5 sm:p-8 md:p-10 shadow-2xl z-10 bg-white/95 text-stone-900 max-h-[92vh] overflow-y-auto">
        
        {/* 44px Accessible Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center space-x-2 text-[#8A661C] text-xs font-mono tracking-wider uppercase mb-1.5 font-bold">
            <img
              src={POLARIS_CONFIG.emblem}
              alt="Polaris Emblem"
              className="w-4 h-4 object-contain"
            />
            <span>Exclusive Access</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
            Private Inquiries & Previews
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm mt-1.5 font-normal leading-relaxed">
            Connect with our hospitality concierge for bespoke reservations, corporate retreats, and private allocations.
          </p>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="py-10 flex flex-col items-center text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-[#8A661C] animate-bounce" />
            <h4 className="text-xl font-serif text-stone-900 font-normal">Inquiry Received</h4>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm font-normal">
              Our hospitality concierge team will contact you directly with priority allocations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                  WhatsApp / Phone
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-[#8A661C] absolute left-3.5 pointer-events-none shrink-0" />
                  <input
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                Primary Interest
              </label>
              <select
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors cursor-pointer"
              >
                <option value="December 1st Soft Launch VIP List">December 1st Soft Launch VIP List</option>
                <option value="Tourism & Press Partnership">Tourism & Press Partnership</option>
                <option value="Corporate Retreat / Private Buyout">Corporate Retreat / Private Buyout</option>
                <option value="General Concierge Inquiry">General Concierge Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-800 mb-1.5 font-bold">
                Notes or Special Requirements
              </label>
              <textarea
                rows={3}
                placeholder="Share any specific dates, preferences, or questions..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-[#8A661C] focus:bg-white focus:ring-1 focus:ring-[#8A661C] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#111111] hover:bg-[#2A2A2A] disabled:bg-stone-400 text-[#FBFBFA] text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center space-x-2 mt-2 shadow-xs rounded-xl touch-manipulation min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E0BB53]" />
                  <span>Transmitting Inquiry...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#E0BB53]" />
                  <span>Transmit Inquiry</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
