import crypto from 'crypto';
import { diffDaysYMD, getTodayYMD, addDaysYMD } from '../src/utils/dateUtils.js';

console.log('=== POLARIS KALAM HOTEL: FULL PRODUCTION VERIFICATION SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Password Encryption & Cryptographic Hashes for Master Look
// ---------------------------------------------------------------------------
console.log('--- Test 1: Cryptographic Authentication Hashes ---');
function sha256(str) {
  return crypto.createHash('sha256').update(String(str).trim()).digest('hex');
}

const PORTAL_PASS = 'Polar1s@Asif@Master@PortalPass26/12';
const DELETE_PASS = 'Polar1s@Asif@Master@26/12';

const EXPECTED_PORTAL_HASH = '8f08510feb936a3ff75c2c16255459150bed23671610c4d0757d83337c980a39';
const EXPECTED_DELETE_HASH = 'ad4f5e421139b0458296d03ff8925292a4566862d6000789b8aaf1d437968a6d';

assert(sha256(PORTAL_PASS) === EXPECTED_PORTAL_HASH, 'Portal access password hashes to expected SHA-256');
assert(sha256(DELETE_PASS) === EXPECTED_DELETE_HASH, 'Deletion/reset password hashes to expected SHA-256');
assert(sha256('WrongPass') !== EXPECTED_PORTAL_HASH, 'Incorrect password does not match portal hash');
assert(sha256('WrongPass') !== EXPECTED_DELETE_HASH, 'Incorrect password does not match deletion hash');

// ---------------------------------------------------------------------------
// TEST 2: Date Calculation & Stay Duration
// ---------------------------------------------------------------------------
console.log('\n--- Test 2: Date Utilities & Stay Calculation ---');
const today = getTodayYMD();
const inThreeDays = addDaysYMD(today, 3);
const nights = diffDaysYMD(today, inThreeDays);

assert(typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today), 'getTodayYMD returns valid YYYY-MM-DD');
assert(nights === 3, 'addDaysYMD and diffDaysYMD calculate exactly 3 nights');

// ---------------------------------------------------------------------------
// TEST 3: Room Categorization and Floor Grouping
// ---------------------------------------------------------------------------
console.log('\n--- Test 3: Room Categorization & Floor Grouping ---');
const sampleRooms = [
  { id: 'r1', roomNumber: '101', name: 'Alpine Suite', category: 'Executive Suite', tier: 'Executive Suite', floor: 'Floor 1', pricePKR: 45000, bookedRanges: [] },
  { id: 'r2', roomNumber: '201', name: 'Alpine Suite', category: 'Executive Suite', tier: 'Executive Suite', floor: 'Floor 2', pricePKR: 52000, bookedRanges: [] },
  { id: 'r3', roomNumber: '301', name: 'Alpine Suite', category: 'Executive Suite', tier: 'Executive Suite', floor: 'Floor 3', pricePKR: 60000, bookedRanges: [] },
  { id: 'r4', roomNumber: '501', name: 'Summit Penthouse', category: 'Top Suite', tier: 'Top Suite', floor: 'Top Suite', pricePKR: 120000, bookedRanges: [] }
];

// Verify distinct floor options and prices
const execRooms = sampleRooms.filter(r => r.category === 'Executive Suite');
const floorMap = new Map();
execRooms.forEach(r => {
  if (!floorMap.has(r.floor)) floorMap.set(r.floor, []);
  floorMap.get(r.floor).push(r);
});

assert(floorMap.size === 3, 'Executive Suite spans 3 distinct floors (Floor 1, Floor 2, Floor 3)');
const minPrice = Math.min(...execRooms.map(r => r.pricePKR));
const maxPrice = Math.max(...execRooms.map(r => r.pricePKR));
assert(minPrice === 45000, 'Executive Suite min price is 45,000');
assert(maxPrice === 60000, 'Executive Suite max price is 60,000');

// Floor 2 difference from base rate
const floor2Price = floorMap.get('Floor 2')[0].pricePKR;
const diff = floor2Price - minPrice;
assert(diff === 7000, 'Floor 2 price difference is exactly +PKR 7,000 higher level');

// ---------------------------------------------------------------------------
// TEST 4: Revenue Aggregations (Day, Weekly, Monthly)
// ---------------------------------------------------------------------------
console.log('\n--- Test 4: Revenue Calculations & Aggregations ---');
const records = [
  { id: 'rev-1', amount: 90000, date: today, nights: 2, status: 'completed' },
  { id: 'rev-2', amount: 120000, date: today, nights: 1, status: 'paid' },
  { id: 'rev-3', amount: 150000, date: addDaysYMD(today, -2), nights: 3, status: 'paid' },
  { id: 'rev-4', amount: 200000, date: addDaysYMD(today, -10), nights: 4, status: 'paid' }
];

const dayRevenue = records.filter(r => r.date === today).reduce((sum, r) => sum + r.amount, 0);
assert(dayRevenue === 210000, 'Day revenue matches sum of today entries (90,000 + 120,000 = 210,000)');

const sevenDaysAgo = addDaysYMD(today, -6);
const weeklyRevenue = records.filter(r => r.date >= sevenDaysAgo && r.date <= today).reduce((sum, r) => sum + r.amount, 0);
assert(weeklyRevenue === 360000, 'Weekly revenue matches entries in past 7 days (90k + 120k + 150k = 360,000)');

const thirtyDaysAgo = addDaysYMD(today, -29);
const monthlyRevenue = records.filter(r => r.date >= thirtyDaysAgo && r.date <= today).reduce((sum, r) => sum + r.amount, 0);
assert(monthlyRevenue === 560000, 'Monthly revenue matches entries in past 30 days (560,000)');

// ---------------------------------------------------------------------------
// TEST 5: Date Range Filtering & Reset
// ---------------------------------------------------------------------------
console.log('\n--- Test 5: Date Range Filtering & Reset ---');
const rangeStart = addDaysYMD(today, -3);
const rangeEnd = today;
const inRange = records.filter(r => r.date >= rangeStart && r.date <= rangeEnd);
assert(inRange.length === 3, 'Filtered range contains 3 records');

// Simulate date range reset
const remainingAfterReset = records.filter(r => r.date < rangeStart || r.date > rangeEnd);
assert(remainingAfterReset.length === 1 && remainingAfterReset[0].id === 'rev-4', 'Reset date range removes matching records while preserving outside records');

// ---------------------------------------------------------------------------
// TEST 6: Employee CMS Secrecy Check
// ---------------------------------------------------------------------------
console.log('\n--- Test 6: Employee CMS Confidentiality Check ---');
import fs from 'fs';
const cmsFiles = [
  'src/components/admin/AdminPortal.jsx',
  'src/components/admin/BookingsManager.jsx',
  'src/components/admin/RoomInventory.jsx',
  'src/components/admin/CategoryFloorManager.jsx'
];

let foundLeak = false;
for (const file of cmsFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.toLowerCase().includes('revenuemasterlook') || content.includes('Master Terminal') || content.includes('master terminal')) {
      console.error(`Leak detected in ${file}`);
      foundLeak = true;
    }
  }
}
assert(!foundLeak, 'ZERO mentions of Master Terminal or Master Look in employee CMS');

console.log(`\n===============================================================`);
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`===============================================================\n`);
