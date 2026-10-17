/**
 * =========================================================================
 * VERCEL SERVERLESS API: /api/auth
 * =========================================================================
 * 
 * Provides cryptographic authentication, rate-limiting, and signed HMAC-SHA256
 * session management for the Polaris Secret Staff Admin CMS.
 * 
 * Master Staff Password:
 * Polar1s@Kalam@Admin@12/26
 */

import {
  STAFF_ADMIN_HASH,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  checkAuthBruteForce,
  recordAuthFailure,
  recordAuthSuccess,
  checkRateLimit,
  applySecurityHeaders,
  sanitizeInput
} from './_security.js';

export default async function handler(req, res) {
  // Apply modern security and no-cache headers
  applySecurityHeaders(res);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-staff-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // General rate limiting: max 60 requests per minute
  const rateCheck = checkRateLimit(req, 'auth_api', 60, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many authentication requests. Please retry in ${rateCheck.retryAfter} seconds.`
    });
  }

  const { searchParams } = new URL(req.url, 'http://localhost');
  const action = searchParams.get('action');

  // -------------------------------------------------------------------------
  // 1. POST: Staff Login
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && (action === 'staff-login' || action === 'login')) {
    // Check brute-force defense (max 5 failed attempts per 15 mins)
    const bruteCheck = checkAuthBruteForce(req, 'staff_login', 5, 15 * 60 * 1000);
    if (bruteCheck.locked) {
      return res.status(429).json({
        success: false,
        error: `Security lockout: Too many failed administrator login attempts. Access is locked for ${bruteCheck.retryAfter} seconds.`
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid JSON request body.' });
      }
    }
    body = sanitizeInput(body || {});

    const submittedInput = body.password || body.passwordHash || body.key;
    if (!submittedInput) {
      return res.status(400).json({ success: false, error: 'Staff administrator password is required.' });
    }

    const isValid = verifyPassword(submittedInput, STAFF_ADMIN_HASH);

    if (!isValid) {
      recordAuthFailure(req, 'staff_login', 5, 15 * 60 * 1000);
      const remainingAttempts = bruteCheck.remaining > 0 ? bruteCheck.remaining - 1 : 0;
      return res.status(401).json({
        success: false,
        error: `Incorrect administrator security password. Access denied. (${remainingAttempts} attempts remaining before temporary lockout)`
      });
    }

    // Success: clear failed attempts and issue signed 24h HMAC session token
    recordAuthSuccess(req, 'staff_login');
    const token = createSessionToken('staff', { role: 'hotel_admin' }, 24);

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 86400,
      scope: 'staff',
      message: 'Staff administrator authentication successful.'
    });
  }

  // -------------------------------------------------------------------------
  // 2. POST: Verify Existing Staff Token
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && action === 'verify') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const token = req.headers.authorization || req.headers['x-staff-token'] || body?.token;
    const isValid = verifySessionToken(token, 'staff');

    if (!isValid) {
      return res.status(401).json({ success: false, valid: false, error: 'Session expired or invalid.' });
    }

    return res.status(200).json({ success: true, valid: true });
  }

  // -------------------------------------------------------------------------
  // 3. Fallback Health Ping
  // -------------------------------------------------------------------------
  return res.status(200).json({
    success: true,
    service: 'Polaris Security & Authentication Service',
    status: 'online',
    timestamp: new Date().toISOString()
  });
}
