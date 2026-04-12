const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadDocument = require('../middleware/uploadDocument');

const attendance = require('../controllers/campusAttendanceController');
const resources = require('../controllers/campusResourceController');
const notes = require('../controllers/campusNotesController');
const lostFound = require('../controllers/campusLostFoundController');
const forum = require('../controllers/campusForumController');
const peers = require('../controllers/campusPeerController');
const complaints = require('../controllers/campusComplaintController');
const hostel = require('../controllers/campusHostelController');
const notices = require('../controllers/campusNoticeController');
const approvals = require('../controllers/campusApprovalController');
const ai = require('../controllers/campusAiController');
const adminCampus = require('../controllers/campusAdminAnalyticsController');
const map = require('../controllers/campusMapController');
const appNotifications = require('../controllers/campusAppNotificationController');

const router = express.Router();

// ——— Smart attendance ———
router.post(
  '/attendance/sessions',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  attendance.createSession
);
router.get(
  '/attendance/sessions',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  attendance.listSessions
);
router.get(
  '/attendance/sessions/:id/qr',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  attendance.getSessionQr
);
router.post('/attendance/mark', auth.protect, attendance.markAttendance);
router.get('/attendance/me', auth.protect, attendance.myAttendance);
router.get(
  '/attendance/sessions/:id/analytics',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  attendance.sessionAnalytics
);
router.patch(
  '/attendance/sessions/:id/deactivate',
  auth.protect,
  auth.authorize('faculty', 'organizer', 'admin'),
  attendance.deactivateSession
);

// ——— Resources & library ———
router.get('/resources', resources.listResources);
router.post('/resources', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), resources.createResource);
router.patch('/resources/:id', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), resources.updateResource);
router.post('/library/issue', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), resources.libraryIssue);
router.post('/library/borrow-self', auth.protect, resources.libraryBorrowSelf);
router.post('/library/return/:loanId', auth.protect, auth.authorize('faculty', 'organizer', 'admin'), resources.libraryReturn);
router.get('/library/my-loans', auth.protect, resources.myLoans);
router.post('/lab/log', auth.protect, resources.labLog);
router.post('/resource-bookings', auth.protect, resources.createResourceBooking);
router.get('/resource-bookings/me', auth.protect, resources.listMyResourceBookings);
router.get('/resources/suggest-slots', auth.protect, resources.suggestLabSlots);

// ——— Notes ———
router.get('/notes', notes.listNotes);
router.post('/notes', auth.protect, uploadDocument.single('file'), notes.createNote);
router.get('/notes/:id', notes.getNote);
router.post('/notes/:id/download', auth.protect, notes.trackDownload);

// ——— Lost & found ———
router.get('/lost-found', lostFound.list);
router.post('/lost-found', auth.protect, upload.single('image'), lostFound.create);
router.post('/lost-found/:id/claim', auth.protect, lostFound.claim);
router.patch('/lost-found/:id/close', auth.protect, lostFound.closeMine);

// ——— Forum ———
router.get('/forum/threads', forum.listThreads);
router.post('/forum/threads', auth.protect, forum.createThread);
router.get('/forum/threads/:id', forum.getThread);
router.post('/forum/threads/:id/comments', auth.protect, forum.addComment);
router.post('/forum/threads/:id/upvote', auth.protect, forum.upvoteThread);

// ——— Peers ———
router.get('/peers', auth.protect, peers.directory);

// ——— Complaints ———
router.post('/complaints', auth.protect, complaints.create);
router.get('/complaints/me', auth.protect, complaints.mine);
router.get('/complaints/all', auth.protect, auth.authorize('admin'), complaints.listAll);
router.patch('/complaints/:id', auth.protect, auth.authorize('admin'), complaints.updateStatus);

// ——— Hostel ———
router.get('/hostel/options', auth.protect, hostel.options);
router.post('/hostel/allocate-self', auth.protect, hostel.allocateSelf);
router.post('/hostel/assign', auth.protect, auth.authorize('admin'), hostel.assign);
router.get('/hostel/me', auth.protect, hostel.mine);
router.get('/hostel/all', auth.protect, auth.authorize('admin'), hostel.listAll);

// ——— Notices ———
router.post('/notices', auth.protect, notices.create);
router.get('/notices', auth.protect, notices.list);

// ——— Approvals ———
router.post('/approvals', auth.protect, approvals.create);
router.get('/approvals/me', auth.protect, approvals.mine);
router.get('/approvals/pending', auth.protect, approvals.pendingQueue);
router.patch('/approvals/:id/review', auth.protect, approvals.review);

// ——— AI Campus Brain ———
router.post('/ai/chat', auth.protect, ai.chat);
router.get('/ai/brain-feed', auth.protect, ai.brainFeed);
router.get('/ai/attendance-prediction', auth.protect, ai.attendancePrediction);

// ——— Admin campus analytics ———
router.get('/admin/overview', auth.protect, auth.authorize('admin'), adminCampus.overview);

// ——— Map ———
router.get('/map/pins', map.listPins);
router.post('/map/pins', auth.protect, map.upsertPin);

// ——— In-app notifications (campus) ———
router.get('/notifications', auth.protect, appNotifications.list);
router.patch('/notifications/:id/read', auth.protect, appNotifications.markRead);
router.post('/notifications/read-all', auth.protect, appNotifications.markAllRead);

module.exports = router;
