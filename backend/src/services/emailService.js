const nodemailer = require('nodemailer');

/**
 * Sends a simple HTML email when SMTP is configured.
 * For hackathons without SMTP, logs to console instead.
 */
async function sendMail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('[email stub]', { to, subject, text: text || html?.slice(0, 200) });
    return { sent: false, stub: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Smart Campus <noreply@local>',
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed (booking still valid):', err.message);
    return { sent: false, error: err.message };
  }
}

async function notifyBookingConfirmed(userEmail, eventTitle, ticketCode) {
  return sendMail({
    to: userEmail,
    subject: `Booking confirmed: ${eventTitle}`,
    text: `Your ticket code is ${ticketCode}. Show the QR at entry.`,
    html: `<p>Your booking for <strong>${eventTitle}</strong> is confirmed.</p><p>Ticket: <code>${ticketCode}</code></p>`,
  });
}

async function notifyEventReminder(userEmail, eventTitle, when) {
  return sendMail({
    to: userEmail,
    subject: `Reminder: ${eventTitle}`,
    text: `Event reminder: ${eventTitle} — ${when}`,
    html: `<p>Reminder: <strong>${eventTitle}</strong></p><p>${when}</p>`,
  });
}

module.exports = { sendMail, notifyBookingConfirmed, notifyEventReminder };
