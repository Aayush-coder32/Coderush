/**
 * Allowed hostel names for student self-allocation (must match frontend).
 */
const HOSTEL_NAMES = [
  'NBH C & D Block',
  'NBH A & B Block',
  'Shail Gupta Girls Hostel',
  'Nirmala Devi Girls Hostel',
  'DP Gupta Girls Hostel',
];

function isValidHostelName(name) {
  return typeof name === 'string' && HOSTEL_NAMES.includes(name.trim());
}

function isValidRoomNumber(room) {
  const n = Number.parseInt(String(room).trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= 300;
}

module.exports = { HOSTEL_NAMES, isValidHostelName, isValidRoomNumber };
