/**
 * =========================================================================
 * COMPREHENSIVE SECURITY VERIFICATION TEST SUITE
 * =========================================================================
 * Tests all security controls, PII protection, authentication gates,
 * rate limiters, brute-force defenses, and NoSQL sanitization.
 */

import {
  STAFF_ADMIN_HASH,
  REVENUE_PORTAL_HASH,
  REVENUE_DELETE_HASH,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  isStaffAuthorized,
  isRevenueAuthorized,
  sanitizeInput,
  redactBookingPII,
  redactRoomPII,
  checkAuthBruteForce,
  recordAuthFailure,
  recordAuthSuccess,
  checkRateLimit
} from '../api/_security.js';

import bookingsHandler from '../api/bookings.js';
import roomsHandler from '../api/rooms.js';
import categoriesHandler from '../api/categories.js';
import floorsHandler from '../api/floors.js';
import revenueHandler from '../api/revenue.js';
import authHandler from '../api/auth.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

// Mock Request & Response Builder
function createMockReqRes({ method = 'GET', url = 'http://localhost/api/test', headers = {}, body = null, query = {} } = {}) {
  const req = {
    method,
    url,
    headers: { ...headers },
    body,
    query: { ...query },
    socket: { remoteAddress: '127.0.0.1' }
  };

  const responseHeaders = {};
  let statusCode = 200;
  let responseData = null;
  let ended = false;

  const res = {
    setHeader(key, value) {
      responseHeaders[key.toLowerCase()] = value;
      return res;
    },
    getHeader(key) {
      return responseHeaders[key.toLowerCase()];
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      ended = true;
      return res;
    },
    end() {
      ended = true;
      return res;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
    _getHeaders: () => responseHeaders
  };

  return { req, res };
}

async function runSecurityTests() {
  console.log('\n======================================================');
  console.log('🔒 RUNNING POLARIS PRODUCTION SECURITY VERIFICATION');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Cryptographic Password & Token Primitives
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Cryptography & Token Primitives ---');
  
  // 1.1 Timing-safe Staff Password Verification
  assert(verifyPassword('Polar1s@Kalam@Admin@12/26', STAFF_ADMIN_HASH) === true, 'Staff admin password verifies correctly');
  assert(verifyPassword('WrongPassword123', STAFF_ADMIN_HASH) === false, 'Invalid staff password rejected');
  assert(verifyPassword('', STAFF_ADMIN_HASH) === false, 'Empty password rejected');

  // 1.2 Timing-safe Revenue Portal Password Verification
  assert(verifyPassword('Polar1s@Asif@Master@PortalPass26/12', REVENUE_PORTAL_HASH) === true, 'Revenue portal password verifies correctly');
  assert(verifyPassword('Polar1s@Asif@WrongPass', REVENUE_PORTAL_HASH) === false, 'Invalid revenue portal password rejected');

  // 1.3 Timing-safe Revenue Deletion Password Verification
  assert(verifyPassword('Polar1s@Asif@Master@26/12', REVENUE_DELETE_HASH) === true, 'Revenue deletion password verifies correctly');
  assert(verifyPassword('Polar1s@Asif@Master@Wrong', REVENUE_DELETE_HASH) === false, 'Invalid revenue deletion password rejected');

  // 1.4 HMAC-SHA256 Token Lifecycle
  const staffToken = createSessionToken('staff', { role: 'admin' }, 24);
  assert(typeof staffToken === 'string' && staffToken.length > 20, 'Generates base64 HMAC signed token');
  assert(verifySessionToken(staffToken, 'staff') === true, 'Verifies valid staff token with matching scope');
  assert(verifySessionToken(staffToken, 'revenue_master') === false, 'Rejects staff token when revenue_master scope expected');
  assert(verifySessionToken('invalid.tampered.token', 'staff') === false, 'Rejects malformed/tampered token');

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Customer PII Redaction
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Customer PII Redaction ---');

  const testCustomerBooking = {
    id: 'req-secret-999',
    roomId: 'room-101',
    roomNumber: '101',
    guestName: 'Senator Tariq Khan',
    phone: '+92 321 9988776',
    email: 'tariq.khan@vip.gov.pk',
    checkIn: '2026-12-25',
    checkOut: '2026-12-28',
    nights: 3,
    status: 'approved',
    notes: 'Confidential security escort will arrive in 2 vehicles.',
    staffNote: 'VIP VIP protocol requested.'
  };

  const redacted = redactBookingPII(testCustomerBooking);
  assert(redacted.guestName === 'Reserved Guest', 'Customer guestName is masked as "Reserved Guest"');
  assert(redacted.phone === '[Protected Contact]', 'Customer phone number is masked as "[Protected Contact]"');
  assert(redacted.email === '[Protected Email]', 'Customer email is masked as "[Protected Email]"');
  assert(redacted.notes === '', 'Customer private notes are cleared');
  assert(redacted.staffNote === '', 'Staff internal notes are cleared');
  assert(redacted.checkIn === '2026-12-25' && redacted.checkOut === '2026-12-28', 'Schedule dates remain intact for calendar availability');

  const testRoomWithActiveBooking = {
    id: 'room-101',
    name: 'Presidential Suite',
    activeBooking: testCustomerBooking,
    bookedRanges: [testCustomerBooking]
  };
  const redactedRoom = redactRoomPII(testRoomWithActiveBooking);
  assert(redactedRoom.activeBooking.guestName === 'Reserved Guest', 'Room activeBooking customer name is masked');
  assert(redactedRoom.bookedRanges[0].guestName === undefined, 'Room bookedRanges guestName stripped');

  // -------------------------------------------------------------------------
  // TEST GROUP 3: NoSQL Operator Neutralization
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: NoSQL Injection Neutralization ---');

  const maliciousPayload = {
    id: { $ne: null },
    roomNumber: { $gt: '' },
    $where: 'sleep(5000)',
    normalField: 'clean string',
    'nested.key': 'attack',
    nestedObject: {
      $regex: '.*',
      validName: 'Polaris'
    }
  };

  const cleanPayload = sanitizeInput(maliciousPayload);
  assert(cleanPayload.$where === undefined, 'Strips top-level $where operator');
  assert(cleanPayload['nested.key'] === undefined, 'Strips dot-notation operator injection');
  assert(cleanPayload.id.$ne === undefined, 'Strips nested $ne operator');
  assert(cleanPayload.nestedObject.$regex === undefined, 'Strips deep $regex operator');
  assert(cleanPayload.normalField === 'clean string', 'Preserves clean string fields');
  assert(cleanPayload.nestedObject.validName === 'Polaris', 'Preserves legitimate nested properties');

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Public vs Staff Bookings Endpoint (/api/bookings)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Bookings API Public vs Staff Protection ---');

  // Seed one booking first via mock staff
  const { req: seedReq, res: seedRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/bookings',
    headers: { 'x-staff-token': staffToken },
    body: testCustomerBooking
  });
  await bookingsHandler(seedReq, seedRes);
  assert(seedRes._getStatus() === 201, 'Staff can create booking record');

  // 4.1 Unauthenticated Public Caller GET /api/bookings
  const { req: pubGetReq, res: pubGetRes } = createMockReqRes({
    method: 'GET',
    url: 'http://localhost/api/bookings'
  });
  await bookingsHandler(pubGetReq, pubGetRes);
  assert(pubGetRes._getStatus() === 200, 'Public GET /api/bookings returns 200 for calendar availability');
  const pubData = pubGetRes._getData()?.data || [];
  const foundBooking = pubData.find((b) => b.id === testCustomerBooking.id);
  assert(foundBooking !== undefined, 'Public calendar receives date availability record');
  assert(foundBooking?.guestName === 'Reserved Guest', 'Public caller NEVER sees customer guestName');
  assert(foundBooking?.phone === '[Protected Contact]', 'Public caller NEVER sees customer phone');
  assert(foundBooking?.email === '[Protected Email]', 'Public caller NEVER sees customer email');
  assert(pubGetRes._getHeaders()['x-frame-options'] === 'DENY', 'Anti-Clickjacking X-Frame-Options: DENY is active');
  assert(pubGetRes._getHeaders()['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff is active');

  // 4.2 Authenticated Staff Caller GET /api/bookings
  const { req: staffGetReq, res: staffGetRes } = createMockReqRes({
    method: 'GET',
    url: 'http://localhost/api/bookings',
    headers: { 'authorization': `Bearer ${staffToken}` }
  });
  await bookingsHandler(staffGetReq, staffGetRes);
  assert(staffGetRes._getStatus() === 200, 'Staff GET /api/bookings returns 200');
  const staffData = staffGetRes._getData()?.data || [];
  const staffFound = staffData.find((b) => b.id === testCustomerBooking.id);
  assert(staffFound?.guestName === 'Senator Tariq Khan', 'Authenticated staff sees full unredacted customer name');
  assert(staffFound?.phone === '+92 321 9988776', 'Authenticated staff sees full unredacted customer phone');

  // 4.3 Unauthenticated PUT /api/bookings
  const { req: unauthPutReq, res: unauthPutRes } = createMockReqRes({
    method: 'PUT',
    url: 'http://localhost/api/bookings',
    body: { id: testCustomerBooking.id, status: 'approved' }
  });
  await bookingsHandler(unauthPutReq, unauthPutRes);
  assert(unauthPutRes._getStatus() === 401, 'Unauthenticated PUT /api/bookings strictly rejected with 401 Unauthorized');

  // 4.4 Unauthenticated DELETE /api/bookings
  const { req: unauthDelReq, res: unauthDelRes } = createMockReqRes({
    method: 'DELETE',
    url: 'http://localhost/api/bookings',
    body: { id: testCustomerBooking.id }
  });
  await bookingsHandler(unauthDelReq, unauthDelRes);
  assert(unauthDelRes._getStatus() === 401, 'Unauthenticated DELETE /api/bookings strictly rejected with 401 Unauthorized');

  // 4.5 Unauthenticated Reset Bookings
  const { req: unauthResetReq, res: unauthResetRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/bookings',
    body: { action: 'reset' }
  });
  await bookingsHandler(unauthResetReq, unauthResetRes);
  assert(unauthResetRes._getStatus() === 401, 'Unauthenticated reset booking requests strictly rejected with 401');

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Administrative Inventory Protection (/api/rooms)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Rooms API Protection ---');

  // 5.1 Public GET /api/rooms
  const { req: pubRoomGetReq, res: pubRoomGetRes } = createMockReqRes({
    method: 'GET',
    url: 'http://localhost/api/rooms'
  });
  await roomsHandler(pubRoomGetReq, pubRoomGetRes);
  assert(pubRoomGetRes._getStatus() === 200, 'Public GET /api/rooms returns 200');

  // 5.2 Unauthenticated PUT /api/rooms
  const { req: unauthRoomPutReq, res: unauthRoomPutRes } = createMockReqRes({
    method: 'PUT',
    url: 'http://localhost/api/rooms',
    body: { id: 'room-101', pricePKR: 1 }
  });
  await roomsHandler(unauthRoomPutReq, unauthRoomPutRes);
  assert(unauthRoomPutRes._getStatus() === 401, 'Unauthenticated PUT /api/rooms strictly rejected with 401 Unauthorized');

  // 5.3 Unauthenticated POST /api/rooms
  const { req: unauthRoomPostReq, res: unauthRoomPostRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/rooms',
    body: { name: 'Hacker Room', roomNumber: '999' }
  });
  await roomsHandler(unauthRoomPostReq, unauthRoomPostRes);
  assert(unauthRoomPostRes._getStatus() === 401, 'Unauthenticated POST /api/rooms strictly rejected with 401 Unauthorized');

  // 5.4 Unauthenticated DELETE /api/rooms
  const { req: unauthRoomDelReq, res: unauthRoomDelRes } = createMockReqRes({
    method: 'DELETE',
    url: 'http://localhost/api/rooms',
    body: { all: true }
  });
  await roomsHandler(unauthRoomDelReq, unauthRoomDelRes);
  assert(unauthRoomDelRes._getStatus() === 401, 'Unauthenticated DELETE all rooms strictly rejected with 401 Unauthorized');

  // -------------------------------------------------------------------------
  // TEST GROUP 6: Categories & Floors Mutation Protection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Categories & Floors Protection ---');

  // 6.1 Unauthenticated POST /api/categories
  const { req: unauthCatPostReq, res: unauthCatPostRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/categories',
    body: { name: 'Hacked Category' }
  });
  await categoriesHandler(unauthCatPostReq, unauthCatPostRes);
  assert(unauthCatPostRes._getStatus() === 401, 'Unauthenticated POST /api/categories rejected with 401');

  // 6.2 Unauthenticated POST /api/floors
  const { req: unauthFloorPostReq, res: unauthFloorPostRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/floors',
    body: { name: 'Hacked Floor' }
  });
  await floorsHandler(unauthFloorPostReq, unauthFloorPostRes);
  assert(unauthFloorPostRes._getStatus() === 401, 'Unauthenticated POST /api/floors rejected with 401');

  // -------------------------------------------------------------------------
  // TEST GROUP 7: Staff Auth Endpoint & Brute-Force Defense (/api/auth)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Staff Auth & Brute-Force Lockout Defense ---');

  const testIp = '192.168.1.105';

  // 7.1 Incorrect password
  const { req: badLoginReq, res: badLoginRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/auth?action=staff-login',
    headers: { 'x-forwarded-for': testIp },
    body: { password: 'wrong_password_attempt' }
  });
  await authHandler(badLoginReq, badLoginRes);
  assert(badLoginRes._getStatus() === 401, 'Incorrect password returns 401');

  // 7.2 Simulate brute-force attack (5 consecutive failed attempts)
  for (let i = 0; i < 4; i++) {
    const { req: bruteReq, res: bruteRes } = createMockReqRes({
      method: 'POST',
      url: 'http://localhost/api/auth?action=staff-login',
      headers: { 'x-forwarded-for': testIp },
      body: { password: 'bad_password_' + i }
    });
    await authHandler(bruteReq, bruteRes);
  }

  // 6th attempt should be blocked by security lockout with HTTP 429
  const { req: lockedReq, res: lockedRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/auth?action=staff-login',
    headers: { 'x-forwarded-for': testIp },
    body: { password: 'Polar1s@Kalam@Admin@12/26' } // Even if password is correct, locked IP is blocked!
  });
  await authHandler(lockedReq, lockedRes);
  assert(lockedRes._getStatus() === 429, 'Brute-force lockout triggers HTTP 429 Too Many Requests after 5 failures');

  // 7.3 Valid Login from fresh IP
  const cleanIp = '192.168.1.200';
  const { req: goodLoginReq, res: goodLoginRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/auth?action=staff-login',
    headers: { 'x-forwarded-for': cleanIp },
    body: { password: 'Polar1s@Kalam@Admin@12/26' }
  });
  await authHandler(goodLoginReq, goodLoginRes);
  assert(goodLoginRes._getStatus() === 200, 'Valid password returns HTTP 200');
  assert(typeof goodLoginRes._getData()?.token === 'string', 'Login returns signed HMAC session token');

  // -------------------------------------------------------------------------
  // TEST GROUP 8: Master Revenue Look Security (/api/revenue)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: Master Revenue Look Security ---');

  // 8.1 Unauthenticated GET /api/revenue
  const { req: unauthRevGetReq, res: unauthRevGetRes } = createMockReqRes({
    method: 'GET',
    url: 'http://localhost/api/revenue'
  });
  await revenueHandler(unauthRevGetReq, unauthRevGetRes);
  assert(unauthRevGetRes._getStatus() === 401, 'Unauthenticated GET /api/revenue strictly rejected with 401');

  // 8.2 Login with valid portal password
  const { req: revLoginReq, res: revLoginRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/revenue?action=login',
    body: { password: 'Polar1s@Asif@Master@PortalPass26/12' }
  });
  await revenueHandler(revLoginReq, revLoginRes);
  assert(revLoginRes._getStatus() === 200, 'Revenue portal login succeeds with valid password');
  const revenueToken = revLoginRes._getData()?.token;
  assert(typeof revenueToken === 'string', 'Revenue portal issues HMAC session token');

  // 8.3 Authenticated GET /api/revenue with session token
  const { req: authRevGetReq, res: authRevGetRes } = createMockReqRes({
    method: 'GET',
    url: 'http://localhost/api/revenue',
    headers: { 'authorization': `Bearer ${revenueToken}` }
  });
  await revenueHandler(authRevGetReq, authRevGetRes);
  assert(authRevGetRes._getStatus() === 200, 'Authenticated GET /api/revenue succeeds with token');

  // 8.4 DELETE without deletion password
  const { req: noPassDelReq, res: noPassDelRes } = createMockReqRes({
    method: 'DELETE',
    url: 'http://localhost/api/revenue',
    headers: { 'authorization': `Bearer ${revenueToken}` },
    body: { id: 'rev-sample-123' }
  });
  await revenueHandler(noPassDelReq, noPassDelRes);
  assert(noPassDelRes._getStatus() === 401, 'Revenue DELETE without deletion password returns 401');

  // 8.5 DELETE with wrong deletion password
  const { req: wrongPassDelReq, res: wrongPassDelRes } = createMockReqRes({
    method: 'DELETE',
    url: 'http://localhost/api/revenue',
    headers: {
      'authorization': `Bearer ${revenueToken}`,
      'x-delete-password': 'WrongDeletionPassword'
    },
    body: { id: 'rev-sample-123' }
  });
  await revenueHandler(wrongPassDelReq, wrongPassDelRes);
  assert(wrongPassDelRes._getStatus() === 403, 'Revenue DELETE with wrong deletion password returns 403');

  // 8.6 DELETE with correct deletion password
  const { req: goodPassDelReq, res: goodPassDelRes } = createMockReqRes({
    method: 'DELETE',
    url: 'http://localhost/api/revenue',
    headers: {
      'authorization': `Bearer ${revenueToken}`,
      'x-delete-password': 'Polar1s@Asif@Master@26/12'
    },
    body: { id: 'rev-sample-123' }
  });
  await revenueHandler(goodPassDelReq, goodPassDelRes);
  // Returns 404 because sample id was not in db, but passes authorization check!
  assert(goodPassDelRes._getStatus() === 404 || goodPassDelRes._getStatus() === 200, 'Master Deletion Password authorizes deletion attempt');

  // 8.7 Prevent unauthenticated CMS checkout spoofing
  const { req: spoofCmsReq, res: spoofCmsRes } = createMockReqRes({
    method: 'POST',
    url: 'http://localhost/api/revenue',
    headers: { 'x-cms-source': 'polaris-cms' }, // spoofed header without staff token
    body: { amount: 50000 }
  });
  await revenueHandler(spoofCmsReq, spoofCmsRes);
  assert(spoofCmsRes._getStatus() === 401, 'Spoofed CMS checkout without staff token is blocked with 401');

  // Summary
  console.log('\n======================================================');
  console.log(`TOTAL PASSED: ${passedTests}`);
  console.log(`TOTAL FAILED: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
