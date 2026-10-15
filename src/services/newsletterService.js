import { POLARIS_CONFIG } from '../polarisConfig';

/**
 * =========================================================================
 * Newsletter & VIP Waitlist Service
 * =========================================================================
 * 
 * Handles sending email signups and VIP inquiries to your email marketing
 * service (Brevo, Mailchimp, or custom Webhook).
 * 
 * HOW IT WORKS:
 * 1. If you configure `POLARIS_CONFIG.newsletter.endpoint` in `polarisConfig.js`,
 *    this function dispatches the data via an HTTP POST / fetch request.
 * 2. If `endpoint` is left empty (""), it operates in DEMO/PREVIEW mode:
 *    - Saves the contact to your browser's localStorage (`polaris_waitlist`).
 *    - Prints a clear guide in the browser console.
 *    - Seamlessly returns success so you can preview the user interface.
 */
export async function subscribeToWaitlist({ email, name = '', phone = '', interest = '', message = '' }) {
  const { endpoint, provider } = POLARIS_CONFIG.newsletter;

  // -----------------------------------------------------------------------
  // CASE 1: No endpoint configured yet -> Demo / Local fallback mode
  // -----------------------------------------------------------------------
  if (!endpoint || endpoint.trim() === '') {
    console.info(
      '%c[Polaris Waitlist]%c Signup received in preview mode for: %c' + email,
      'color: #D4AF37; font-weight: bold;',
      'color: #fff;',
      'color: #60a5fa;'
    );
    console.info(
      'To connect real automated welcome emails via Brevo or Mailchimp, add your form endpoint in `src/polarisConfig.js`.'
    );

    // Save to local storage for testing
    try {
      const existing = JSON.parse(localStorage.getItem('polaris_waitlist') || '[]');
      existing.push({ email, name, phone, interest, message, timestamp: new Date().toISOString() });
      localStorage.setItem('polaris_waitlist', JSON.stringify(existing));
    } catch (e) {
      // Ignore local storage quota errors
    }

    // Simulate 600ms network request for realistic UI experience
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, mode: 'preview' };
  }

  // -----------------------------------------------------------------------
  // CASE 2: Live endpoint configured (Brevo / Mailchimp / Webhook)
  // -----------------------------------------------------------------------
  try {
    if (provider === 'mailchimp') {
      // Mailchimp Embedded Form JSONP / POST format
      const formData = new FormData();
      formData.append('EMAIL', email);
      if (name) formData.append('FNAME', name);
      if (phone) formData.append('PHONE', phone);
      if (interest) formData.append('INTEREST', interest);
      if (message) formData.append('MESSAGE', message);

      await fetch(endpoint, {
        method: 'POST',
        body: formData,
        mode: 'no-cors', // Standard Mailchimp cross-domain form submission
      });

      return { success: true, mode: 'live' };
    }

    // If endpoint is a Brevo Form URL (sibforms.com)
    if (provider === 'brevo' || endpoint.includes('sibforms.com')) {
      const formData = new FormData();
      formData.append('EMAIL', email);
      formData.append('email_address_check', '');
      formData.append('locale', 'en');
      if (name) formData.append('FIRSTNAME', name);
      if (phone) formData.append('SMS', phone);

      // Using mode: 'no-cors' allows sending cross-origin form data to Brevo
      // without being blocked by browser CORS security policies.
      await fetch(endpoint, {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      });

      // Also save backup copy locally
      try {
        const stored = JSON.parse(localStorage.getItem('polaris_waitlist') || '[]');
        stored.push({ email, name, phone, interest, message, timestamp: new Date().toISOString() });
        localStorage.setItem('polaris_waitlist', JSON.stringify(stored));
      } catch (_) {}

      return { success: true, mode: 'live' };
    }

    // Default: Webhook (JSON payload)
    const payload = {
      email,
      name,
      phone,
      interest: interest || 'Polaris Dec 1 Soft Launch VIP',
      message,
      source: 'Polaris Kalam Hotel Landing Page',
      softLaunchDate: 'December 1st, 2026',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    return { success: true, mode: 'live' };
  } catch (error) {
    console.error('[Polaris Waitlist] Error dispatching to provider:', error);
    // Even if external network has a hiccup, we preserve the lead in localStorage
    try {
      const backups = JSON.parse(localStorage.getItem('polaris_backup_waitlist') || '[]');
      backups.push({ email, name, phone, interest, message, timestamp: new Date().toISOString() });
      localStorage.setItem('polaris_backup_waitlist', JSON.stringify(backups));
    } catch (_) {}

    return { success: false, error: error.message };
  }
}
