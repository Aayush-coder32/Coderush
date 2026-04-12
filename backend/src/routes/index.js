/**
 * Central route map — keeps `app.js` readable for beginners.
 */
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');
const organizerController = require('../controllers/organizerController');
const campusRoutes = require('./campusRoutes');
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');
const bookmarkController = require('../controllers/bookmarkController');
const recommendationController = require('../controllers/recommendationController');
const notificationController = require('../controllers/notificationController');

// Health
router.get('/health', (req, res) => res.json({ ok: true, service: 'Smart Campus OS API' }));

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth.protect, authController.me);
router.patch('/auth/profile', auth.protect, authController.updateProfile);

// Public events (static paths must come before `/:id` or Express treats "trending" as an id)
router.get('/events', eventController.listEvents);
router.get('/events/trending', eventController.trending);
router.get('/events/upcoming', eventController.upcoming);
router.get(
  '/events/mine/list',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  eventController.myEvents
);
router.get('/events/:id', eventController.getById);

// Organizer / admin event CRUD
router.post(
  '/events',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  upload.single('poster'),
  eventController.create
);
router.put(
  '/events/:id',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  upload.single('poster'),
  eventController.update
);
router.delete('/events/:id', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), eventController.remove);

// Bookings (students)
router.post(
  '/bookings',
  auth.protect,
  auth.authorize('student', 'faculty', 'organizer', 'admin'),
  bookingController.create
);
router.get('/bookings/mine', auth.protect, bookingController.mine);
router.get('/bookings/:id', auth.protect, bookingController.getOne);

// Payments
router.get('/payments/config', paymentController.getConfig);
router.post('/payments/create-checkout-session', auth.protect, paymentController.createCheckoutSession);
router.get('/payments/verify-session', auth.protect, paymentController.verifySession);
router.post('/payments/razorpay/create-order', auth.protect, paymentController.createRazorpayOrder);
router.post('/payments/razorpay/verify', auth.protect, paymentController.verifyRazorpayPayment);
router.post('/payments/wallet-pay', auth.protect, paymentController.walletPay);

// Faculty tools (events + QR check-in)
router.get(
  '/faculty/dashboard',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  organizerController.dashboard
);
router.post(
  '/faculty/checkin',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  organizerController.checkIn
);
router.get(
  '/faculty/events/:eventId/attendees',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  organizerController.attendees
);
/** @deprecated Use `/faculty/*` — kept for older clients */
router.get('/organizer/dashboard', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), organizerController.dashboard);
router.post('/organizer/checkin', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), organizerController.checkIn);
router.get(
  '/organizer/events/:eventId/attendees',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  organizerController.attendees
);

// Admin
router.get('/admin/users', auth.protect, auth.authorize('admin'), adminController.listUsers);
router.patch('/admin/users/:id/role', auth.protect, auth.authorize('admin'), adminController.setRole);
router.post('/admin/wallet', auth.protect, auth.authorize('admin'), adminController.creditWallet);

// Reviews
router.post('/reviews', auth.protect, reviewController.create);
router.get('/reviews/event/:eventId', reviewController.forEvent);

// Bookmarks
router.post('/bookmarks/toggle', auth.protect, bookmarkController.toggle);
router.get('/bookmarks', auth.protect, bookmarkController.list);
router.get('/bookmarks/status/:eventId', auth.protect, bookmarkController.status);

// AI / smart recommendations
router.get('/recommendations', auth.protect, recommendationController.forUser);

// Notifications
router.post('/notifications/remind', auth.protect, notificationController.sendReminder);
router.get('/notifications/in-app', auth.protect, notificationController.inApp);

router.use('/campus', campusRoutes);

module.exports = router;
