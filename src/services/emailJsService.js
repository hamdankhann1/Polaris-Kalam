import emailjs from '@emailjs/browser';
import { POLARIS_CONFIG } from '../polarisConfig';
import { subscribeToWaitlist } from './newsletterService';

/**
 * =========================================================================
 * EmailJS Private Inquiry Service
 * =========================================================================
 * 
 * Handles the Private Inquiries modal submissions with conditional logic:
 * 
 * 1. NON-VIP INQUIRIES (Suites, Press, Corporate, General):
 *    - Will NEVER be sent to the Brevo newsletter list.
 *    - Dispatches a dedicated inquiry notification & auto-reply via EmailJS.
 * 
 * 2. VIP SOFT LAUNCH LIST OPTION:
 *    - If the user selects the "December 1st Soft Launch VIP List", it can
 *      register them with Brevo so they receive the December 1st announcement,
 *      OR use a designated EmailJS VIP template.
 * 
 * 3. PREVIEW MODE (When EmailJS keys are not yet provided):
 *    - Simulates success with detailed console logs so you can test the UI.
 */
export async function submitPrivateInquiry({ name, email, phone, interest, message }) {
  const { serviceId, templateId, publicKey } = POLARIS_CONFIG.emailjs || {};

  // Check if the user selected the VIP soft launch list option
  const isVipListOption = 
    interest.toLowerCase().includes('soft launch') || 
    interest.toLowerCase().includes('vip list');

  // -----------------------------------------------------------------------
  // RULE 1: If they selected the VIP List option
  // -----------------------------------------------------------------------
  if (isVipListOption) {
    // Only subscribers who explicitly choose the VIP List get added to Brevo
    console.info('[Polaris Inquiry] VIP List option selected -> routing to Brevo Soft Launch list.');
    await subscribeToWaitlist({ name, email, phone, interest, message });
  } else {
    // ---------------------------------------------------------------------
    // RULE 2: If they selected ANYTHING ELSE (Suite, Press, Corporate, General)
    // ---------------------------------------------------------------------
    console.info(
      `[Polaris Inquiry] Non-VIP option selected ("${interest}"). Skipping Brevo to prevent newsletter emails.`
    );
  }

  // -----------------------------------------------------------------------
  // RULE 3: Send via EmailJS (For inquiry notifications & custom auto-reply)
  // -----------------------------------------------------------------------
  if (!publicKey || !serviceId || !templateId) {
    // PREVIEW / DEMO MODE (Keys not entered yet)
    console.info(
      '%c[EmailJS Preview]%c Inquiry received for: %c' + email,
      'color: #D4AF37; font-weight: bold;',
      'color: #fff;',
      'color: #60a5fa;'
    );
    console.info(
      'To connect live EmailJS delivery, add your `serviceId`, `templateId`, and `publicKey` in `src/polarisConfig.js`.'
    );

    // Save local backup
    try {
      const stored = JSON.parse(localStorage.getItem('polaris_inquiries') || '[]');
      stored.push({ name, email, phone, interest, message, provider: 'emailjs-preview', timestamp: new Date().toISOString() });
      localStorage.setItem('polaris_inquiries', JSON.stringify(stored));
    } catch (_) {}

    await new Promise((resolve) => setTimeout(resolve, 700));
    return { success: true, mode: 'preview', isVipListOption };
  }

  // LIVE EMAILJS SUBMISSION
  try {
    const templateParams = {
      from_name: name,
      user_name: name,
      user_email: email,
      reply_to: email, // Lets you click "Reply" in your inbox to email the guest directly
      user_phone: phone || 'Not provided',
      inquiry_type: interest,
      message: message || 'No specific notes provided.',
      hotel_name: POLARIS_CONFIG.hotelName,
      hotel_location: POLARIS_CONFIG.location,
      hotel_email: POLARIS_CONFIG.contact.email,
      submitted_at: new Date().toLocaleString(),
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.info('[EmailJS] Inquiry sent successfully:', response.status, response.text);

    // Keep local backup record
    try {
      const stored = JSON.parse(localStorage.getItem('polaris_inquiries') || '[]');
      stored.push({ name, email, phone, interest, message, provider: 'emailjs-live', timestamp: new Date().toISOString() });
      localStorage.setItem('polaris_inquiries', JSON.stringify(stored));
    } catch (_) {}

    return { success: true, mode: 'live', isVipListOption };
  } catch (error) {
    console.error('[EmailJS] Error sending email:', error);
    return { success: false, error: error.message || 'Failed to dispatch via EmailJS' };
  }
}
