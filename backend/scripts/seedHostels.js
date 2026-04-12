/**
 * Hostel gallery seed script
 * Run with: node backend/scripts/seedHostels.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const Hostel = require('../src/models/Hostel');

const HOSTELS_DATA = [
  {
    name: 'Boys Hostel',
    type: 'boys',
    description: 'Main boys hostel with modern facilities and spacious rooms.',
    capacity: 150,
    featured: true,
    warden: {
      name: 'Mr. Rajesh Kumar',
      phone: '+91-98765-43210',
      email: 'warden.boys@campus.edu',
    },
    location: {
      address: 'Campus Main Gate, Near Admin Building',
      coordinates: {
        latitude: 28.5921,
        longitude: 77.0490,
      },
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Sports Ground',
      'Laundry',
      'Security',
      'Power Backup',
      'Water Facility',
    ],
    rules: [
      'Report-in time: 10 PM',
      'Lights off: 11 PM',
      'No outside guests after 8 PM',
      'Maintain cleanliness',
      'Silent hours: 10 PM - 8 AM',
    ],
    images: [
      {
        url: '/images/hostels/boys-hostel-exterior.jpg',
        caption: 'Boys Hostel - Main entrance with modern infrastructure',
      },
    ],
  },
  {
    name: 'Vidyawati Devi Girls Hostel',
    type: 'girls',
    description: 'Premium girls hostel with all modern amenities and comfortable living spaces.',
    capacity: 120,
    featured: true,
    warden: {
      name: 'Mrs. Priya Sharma',
      phone: '+91-98765-43211',
      email: 'warden.girls1@campus.edu',
    },
    location: {
      address: 'Campus Central Area, Administrative Zone',
      coordinates: {
        latitude: 28.5925,
        longitude: 77.0495,
      },
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Recreation Room',
      'Study Lounge',
      'Laundry',
      'Security (24x7)',
      'Power Backup',
      'Medical Room',
      'Yoga Room',
    ],
    rules: [
      'Report-in time: 9 PM',
      'Lights off: 10:30 PM',
      'No outside guests',
      'Zero tolerance for alcohol',
      'Silent hours: 9 PM - 7 AM',
    ],
    images: [
      {
        url: '/images/hostels/vidyawati-girls-hostel.jpg',
        caption: 'Vidyawati Devi Girls Hostel - Front elevation with facilities',
      },
    ],
  },
  {
    name: 'Nirmala Devi Girls Hostel',
    type: 'girls',
    description: 'Traditional girls hostel with essential facilities for comfortable stay.',
    capacity: 100,
    featured: true,
    warden: {
      name: 'Mrs. Anjali Verma',
      phone: '+91-98765-43212',
      email: 'warden.girls2@campus.edu',
    },
    location: {
      address: 'Campus Secondary Zone, Near Sports Complex',
      coordinates: {
        latitude: 28.5910,
        longitude: 77.0480,
      },
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Study Area',
      'Laundry',
      'Security',
      'Power Backup',
      'Water Cooler',
    ],
    rules: [
      'Report-in time: 9 PM',
      'Lights off: 10 PM',
      'No outside guests after 7 PM',
      'Maintain discipline',
      'Silent hours: 9 PM - 7 AM',
    ],
    images: [
      {
        url: '/images/hostels/nirmala-girls-hostel.jpg',
        caption: 'Nirmala Devi Girls Hostel - Campus location',
      },
    ],
  },
  {
    name: 'NBH C & D Block',
    type: 'boys',
    description: 'Boys hostel blocks C & D with well-maintained rooms and facilities.',
    capacity: 100,
    featured: true,
    warden: {
      name: 'Mr. Vikram Singh',
      phone: '+91-98765-43213',
      email: 'warden.nbh@campus.edu',
    },
    location: {
      address: 'NBH Campus Area',
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Sports Facility',
      'Laundry',
      'Security',
    ],
    rules: [
      'Report-in time: 10 PM',
      'Lights off: 11 PM',
      'No outside guests after 8 PM',
    ],
    images: [],
  },
  {
    name: 'NBH A & B Block',
    type: 'boys',
    description: 'Boys hostel blocks A & B with standard amenities.',
    capacity: 90,
    featured: false,
    warden: {
      name: 'Mr. Arjun Patel',
      phone: '+91-98765-43214',
      email: 'warden.nbh2@campus.edu',
    },
    location: {
      address: 'NBH Campus Area',
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Laundry',
      'Security',
    ],
    rules: [
      'Report-in time: 10 PM',
      'Lights off: 11 PM',
      'No outside guests after 8 PM',
    ],
    images: [],
  },
  {
    name: 'Shail Gupta Girls Hostel',
    type: 'girls',
    description: 'Girls hostel with comprehensive facilities and support services.',
    capacity: 80,
    featured: false,
    warden: {
      name: 'Mrs. Meera Iyer',
      phone: '+91-98765-43215',
      email: 'warden.shail@campus.edu',
    },
    location: {
      address: 'Campus Educational Zone',
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Laundry',
      'Security',
    ],
    rules: [
      'Report-in time: 9 PM',
      'Lights off: 10 PM',
      'No outside guests',
    ],
    images: [],
  },
  {
    name: 'DP Gupta Girls Hostel',
    type: 'girls',
    description: 'Girls hostel with comfortable rooms and dedicated staff.',
    capacity: 75,
    featured: false,
    warden: {
      name: 'Mrs. Neha Kapoor',
      phone: '+91-98765-43216',
      email: 'warden.dp@campus.edu',
    },
    location: {
      address: 'Campus Residential Area',
    },
    amenities: [
      'WiFi',
      'Mess Facility',
      'Common Room',
      'Laundry',
      'Security',
    ],
    rules: [
      'Report-in time: 9 PM',
      'Lights off: 10 PM',
      'No outside guests',
    ],
    images: [],
  },
];

async function seedHostels() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing hostels
    await Hostel.deleteMany({});
    console.log('Cleared existing hostels');

    // Insert new hostels
    const created = await Hostel.insertMany(HOSTELS_DATA);
    console.log(`Created ${created.length} hostels`);

    created.forEach((h) => {
      console.log(`  ✓ ${h.name} (${h.type})`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

// Run seed
seedHostels();
