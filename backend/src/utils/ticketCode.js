const crypto = require('crypto');

/** Generates a short unique ticket code for QR check-in. */
function generateTicketCode() {
  return `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

module.exports = { generateTicketCode };
