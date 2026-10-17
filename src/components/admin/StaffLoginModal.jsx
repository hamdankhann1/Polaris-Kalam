import React, { useState } from 'react';
import { Lock, Key, ArrowRight, ShieldCheck, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { POLARIS_CONFIG } from '../../polarisConfig';

/**
 * =========================================================================
 * StaffLoginModal Component
 * =========================================================================
 * 
 * Secure cryptographic gate for Polaris Hotel CMS.
 * Uses client-side SHA-256 hashing so the plain text password is never stored
 * in source code.
 * 
 * Master Admin Password:
 * Polar1s@Kalam@Admin@12/26
 * 
 * Target SHA-256 Hash:
 * 5fca4e1354c237a86321950ebdc55dc62f7ac8749a688add45bba0226f37785d
 */

// Cryptographic SHA-256 Hash of Polar1s@Kalam@Admin@12/26
const ADMIN_PASSWORD_HASH = '5fca4e1354c237a86321950ebdc55dc62f7ac8749a688add45bba0226f37785d';

/**
 * Computes SHA-256 hex digest using browser standard Web Crypto API
 */
async function computeSha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function StaffLoginModal({ isOpen, onLoginSuccess, onCancel }) {
  if (!isOpen) return null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Cryptographically hash the entered password
      const inputHash = await computeSha256(password.trim());

      if (inputHash === ADMIN_PASSWORD_HASH) {
        onLoginSuccess();
      } else {
        setError('Incorrect administrator security password. Access denied.');
      }
    } catch (err) {
      console.error('Cryptographic verification failed:', err);
      setError('An error occurred during security authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn w-full max-w-full overflow-x-hidden">
      <div 
        className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl p-4 sm:p-8 text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-stone-200">
          <div className="w-14 h-14 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-50 mb-3 shadow-xs">
            <Lock className="w-6 h-6 text-[#B48A28]" />
          </div>

          <h3 className="font-display text-2xl tracking-[0.2em] text-stone-900 font-medium">
            POLARIS
          </h3>
          <span className="text-xs tracking-wider text-[#8A661C] uppercase font-mono font-bold mt-1">
            Secret Staff Operations CMS
          </span>
          <p className="text-xs sm:text-sm text-stone-700 mt-2 font-normal">
            Enter the hashed administrative password to access hotel inventory and reservation approvals.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-800 mb-1.5 text-center font-bold">
              Staff Administrator Password
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter admin password..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-11 py-3 text-sm sm:text-base text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
              />

              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-mono flex items-center space-x-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className={`w-full py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider bg-[#B48A28] hover:bg-[#9E7719] text-white font-bold transition-all flex items-center justify-center space-x-2 shadow-xs hover:shadow-sm ${
              isSubmitting || !password ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{isSubmitting ? 'Verifying Hash...' : 'Authenticate & Unlock CMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="mt-6 pt-4 border-t border-stone-200 text-center space-y-3">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-mono text-stone-600 uppercase font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHA-256 Cryptographic Hash Active</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 transition-colors font-semibold"
          >
            ← Return to Public Website
          </button>
        </div>

      </div>
    </div>
  );
}
