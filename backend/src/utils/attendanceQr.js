const crypto = require('crypto');

const WINDOW_MS = 30_000;

function timeBucket(ts = Date.now()) {
  return Math.floor(ts / WINDOW_MS);
}

/** HMAC token for rolling QR windows (current + previous window accepted). */
function tokenForSession(sessionId, qrSecret, bucket) {
  return crypto
    .createHmac('sha256', qrSecret)
    .update(`${sessionId}:${bucket}`)
    .digest('hex')
    .slice(0, 20);
}

function verifyToken(sessionId, qrSecret, clientToken) {
  const now = Date.now();
  for (let i = 0; i < 3; i += 1) {
    const b = timeBucket(now - i * WINDOW_MS);
    if (tokenForSession(sessionId, qrSecret, b) === clientToken) return { ok: true, bucket: b };
  }
  return { ok: false };
}

function qrPayload(sessionId, token, validUntil) {
  return JSON.stringify({ s: String(sessionId), t: token, v: validUntil });
}

module.exports = { WINDOW_MS, timeBucket, tokenForSession, verifyToken, qrPayload };
