/**
 * Smart Campus OS — demo data. Run: npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const CampusResource = require('../models/CampusResource');
const LibraryLoan = require('../models/LibraryLoan');
const ResourceBooking = require('../models/ResourceBooking');
const Note = require('../models/Note');
const LostFound = require('../models/LostFound');
const ForumThread = require('../models/ForumThread');
const ForumComment = require('../models/ForumComment');
const Complaint = require('../models/Complaint');
const HostelAllocation = require('../models/HostelAllocation');
const Notice = require('../models/Notice');
const ApprovalRequest = require('../models/ApprovalRequest');
const MapPin = require('../models/MapPin');
const AppNotification = require('../models/AppNotification');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const demoEmail = /@campus\.edu$/;
  const existingDemoUsers = await User.find({ email: demoEmail }).select('_id').lean();
  const oldDemoIds = existingDemoUsers.map((u) => u._id);
  if (oldDemoIds.length) {
    await Booking.deleteMany({ user: { $in: oldDemoIds } });
  }
  await Event.deleteMany({ $or: [{ title: /^Demo:/ }, { title: /coderush/i }, { title: /^Online:/ }] });
  await User.deleteMany({ email: demoEmail });

  await Promise.all([
    AttendanceSession.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    CampusResource.deleteMany({}),
    LibraryLoan.deleteMany({}),
    ResourceBooking.deleteMany({}),
    Note.deleteMany({}),
    LostFound.deleteMany({}),
    ForumThread.deleteMany({}),
    ForumComment.deleteMany({}),
    Complaint.deleteMany({}),
    HostelAllocation.deleteMany({}),
    Notice.deleteMany({}),
    ApprovalRequest.deleteMany({}),
    MapPin.deleteMany({}),
    AppNotification.deleteMany({}),
  ]);

  const faculty = await User.create({
    name: 'Demo Faculty',
    email: 'demo.faculty@campus.edu',
    password: 'demo1234',
    role: 'faculty',
    department: 'Computer Science',
    walletBalance: 0,
    skills: ['Algorithms', 'AI'],
  });

  const student = await User.create({
    name: 'Demo Student',
    email: 'demo.student@campus.edu',
    password: 'demo1234',
    role: 'student',
    walletBalance: 500,
    interests: ['workshop', 'seminar'],
    department: 'Computer Science',
    studentRoll: 'CS24-001',
    skills: ['React', 'Node.js', 'MongoDB'],
    bio: 'Building Smart Campus OS for the hackathon.',
  });

  const admin = await User.create({
    name: 'Demo Admin',
    email: 'demo.admin@campus.edu',
    password: 'demo1234',
    role: 'admin',
    department: 'Administration',
  });

  const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const campusLat = 28.6139;
  const campusLng = 77.209;

  const now = new Date();
  const sessionStart = new Date(now.getTime() - 60 * 60 * 1000);
  const sessionEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const attSession = await AttendanceSession.create({
    faculty: faculty._id,
    courseCode: 'CS301',
    title: 'Demo: Data Structures (live QR window)',
    geoCenter: { lat: campusLat, lng: campusLng },
    geoRadiusMeters: 200,
    startsAt: sessionStart,
    endsAt: sessionEnd,
    qrSecret: crypto.randomBytes(16).toString('hex'),
    isActive: true,
  });

  await AttendanceRecord.create({
    session: attSession._id,
    user: student._id,
    courseCode: 'CS301',
    location: { lat: campusLat, lng: campusLng },
    deviceFingerprint: 'seed-device-1',
    checks: { geofenceOk: true, timeOk: true, qrOk: true },
    college: 'BBDNIIT',
    branch: 'CSE',
    section: 'CSE-23',
  });

  const coderushDay = new Date(2026, 3, 13);
  coderushDay.setHours(9, 0, 0, 0);

  await Event.insertMany([
    {
      title: 'Online: Cloud Architecture Masterclass',
      description:
        'Live on Zoom — AWS, containers, and serverless. Q&A with industry mentors. Certificate of participation.',
      category: 'seminar',
      date: inDays(4),
      startTime: '17:00',
      endTime: '19:30',
      location: 'Online — Zoom (link emailed after registration)',
      price: 0,
      totalSeats: 500,
      bookedCount: 210,
      trendingScore: 95,
      organizer: faculty._id,
      image: {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80',
        publicId: '',
      },
    },
    {
      title: 'Online: Full-Stack React Weekend Sprint',
      description:
        'Hands-on virtual workshop — Vite, React Router, Node API. Join from anywhere; breakout rooms for pair coding.',
      category: 'workshop',
      date: inDays(6),
      startTime: '10:00',
      endTime: '16:00',
      location: 'Online — Microsoft Teams',
      price: 149,
      totalSeats: 80,
      bookedCount: 52,
      trendingScore: 88,
      organizer: faculty._id,
      image: {
        url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=80',
        publicId: '',
      },
    },
    {
      title: 'Online: Open Mic — Startup & Product Stories',
      description:
        'Evening fireside chat with founders. Streamed live; audience Q&A via Slido.',
      category: 'other',
      date: inDays(2),
      startTime: '18:30',
      endTime: '20:00',
      location: 'Online — YouTube Live + campus watch party',
      price: 0,
      totalSeats: 2000,
      bookedCount: 340,
      trendingScore: 72,
      organizer: faculty._id,
      image: {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80',
        publicId: '',
      },
    },
    {
      title: 'Coderush 2.0 Hackathon',
      description:
        'BBDNIIT — Prize pool worth ₹10,000+. E-certificates for participants. Prove your coding skills at Dr. Akhilesh Das Gupta Auditorium. Sponsors: Pickle Dome, Eat Zone Cafe, GeeksforGeeks.',
      category: 'competition',
      date: coderushDay,
      startTime: '09:00',
      endTime: '21:00',
      location: 'Dr. Akhilesh Das Gupta Auditorium',
      price: 0,
      totalSeats: 300,
      bookedCount: 85,
      trendingScore: 120,
      organizer: faculty._id,
      image: {
        url: '/coderush-2-poster.png',
        publicId: '',
      },
    },
    {
      title: 'Demo: Tech Fest 2026',
      description: 'Hackathons, booths, and keynote — Smart Campus OS launch.',
      category: 'fest',
      date: inDays(14),
      startTime: '09:00',
      endTime: '18:00',
      location: 'Main Auditorium',
      price: 0,
      totalSeats: 200,
      bookedCount: 40,
      trendingScore: 50,
      organizer: faculty._id,
      image: {
        url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
        publicId: '',
      },
    },
    {
      title: 'Demo: AI Workshop',
      description: 'Hands-on LLM apps for students.',
      category: 'workshop',
      date: inDays(3),
      location: 'Lab 2B',
      price: 99,
      totalSeats: 40,
      bookedCount: 12,
      trendingScore: 30,
      organizer: faculty._id,
      image: {
        url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        publicId: '',
      },
    },
    {
      title: 'Demo: Entrepreneurship Seminar',
      category: 'seminar',
      date: inDays(7),
      location: 'Hall C',
      price: 0,
      totalSeats: 120,
      organizer: faculty._id,
    },
  ]);

  const book1 = await CampusResource.create({
    type: 'book',
    name: 'Introduction to Algorithms',
    code: 'BK-CLRS',
    location: 'Central Library — Floor 2',
    totalCopies: 4,
    availableCopies: 2,
    status: 'available',
  });

  await CampusResource.create({
    type: 'lab_equipment',
    name: 'Oscilloscope Rack A',
    code: 'LAB-OSC-01',
    location: 'Electronics Lab',
    status: 'available',
    capacity: 8,
  });

  const room1 = await CampusResource.create({
    type: 'room',
    name: 'Innovation Lab 3C',
    code: 'ROOM-3C',
    location: 'Block C — Level 3',
    status: 'available',
    capacity: 30,
  });

  await LibraryLoan.create({
    resource: book1._id,
    user: student._id,
    issuedBy: faculty._id,
    dueAt: inDays(10),
  });
  book1.availableCopies = 1;
  await book1.save();

  await ResourceBooking.create({
    resource: room1._id,
    user: student._id,
    startAt: inDays(1),
    endAt: inDays(1),
    purpose: 'Project demo rehearsal',
    status: 'confirmed',
  });

  await Note.create({
    author: faculty._id,
    title: 'Demo: OS lecture notes (Week 4)',
    description: 'Processes & threads summary PDF.',
    courseTag: 'CS301',
    downloads: 12,
  });

  const thread = await ForumThread.create({
    author: student._id,
    title: 'Best quiet corners on campus for deep work?',
    body: 'Looking for spots with power outlets near Block C.',
    flair: 'life',
    upvotes: 4,
    commentCount: 1,
  });

  await ForumComment.create({
    thread: thread._id,
    author: faculty._id,
    body: 'Try the library mezzanine after 6pm — usually empty.',
  });

  await LostFound.create({
    author: student._id,
    kind: 'lost',
    title: 'Black water bottle (stickers)',
    description: 'Near cafeteria.',
    locationHint: 'Cafeteria north exit',
    status: 'open',
  });

  await Complaint.create({
    user: student._id,
    category: 'hostel',
    subject: 'Water cooler maintenance',
    body: 'Cooler on floor 2 not cooling properly.',
    status: 'open',
  });

  await HostelAllocation.create({
    student: student._id,
    block: 'H4',
    hostelName: 'H4',
    roomNumber: '204',
    bedNumber: 'A',
    academicYear: '2025-26',
    allocatedBy: admin._id,
  });

  await Notice.create({
    title: 'Campus Wi-Fi maintenance tonight',
    body: 'Brief outage 2:00–3:00 AM for core switch upgrade.',
    priority: 'normal',
    audience: 'all',
    createdBy: admin._id,
  });

  await ApprovalRequest.create({
    requester: student._id,
    type: 'event_budget',
    title: 'Club robotics parts',
    details: 'Request INR 15,000 for motors and controllers.',
    status: 'pending',
  });

  await MapPin.insertMany([
    { label: 'Main Library', category: 'building', lat: campusLat + 0.001, lng: campusLng + 0.001, description: 'Study & book issue' },
    { label: 'Innovation Lab 3C', category: 'lab', lat: campusLat - 0.0008, lng: campusLng + 0.0005, description: 'Book via Resources' },
    { label: 'Hostel H4', category: 'hostel', lat: campusLat + 0.002, lng: campusLng - 0.001, description: 'Demo allocation' },
    { label: 'Central Cafeteria', category: 'food', lat: campusLat, lng: campusLng - 0.0012, description: 'Meals & coffee' },
  ]);

  await AppNotification.create({
    user: student._id,
    title: 'Welcome to Smart Campus OS',
    body: 'Open AI Campus Brain for personalized events, notes, and lab-time hints.',
    type: 'info',
    read: false,
  });

  console.log('Seed complete — Smart Campus OS');
  console.log('Student: demo.student@campus.edu / demo1234');
  console.log('Faculty: demo.faculty@campus.edu / demo1234');
  console.log('Admin: demo.admin@campus.edu / demo1234');
  console.log(`Demo attendance session (CS301) center: ${campusLat}, ${campusLng} — radius 200m`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
