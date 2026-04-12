const Hostel = require('../models/Hostel');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Get all hostels (public endpoint)
 */
exports.getAll = async (req, res) => {
  try {
    const hostels = await Hostel.find().lean();
    res.json({ success: true, data: hostels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get hostel by ID
 */
exports.getById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    res.json({ success: true, data: hostel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get hostel by name
 */
exports.getByName = async (req, res) => {
  try {
    const hostel = await Hostel.findOne({ name: req.params.name });
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    res.json({ success: true, data: hostel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get gallery (featured hostels)
 */
exports.getGallery = async (req, res) => {
  try {
    const hostels = await Hostel.find({ featured: true }).lean();
    res.json({ success: true, data: hostels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create new hostel (admin only)
 */
exports.create = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { name, type, description, capacity, warden, location, amenities, rules, featured } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type required' });
    }

    const hostel = await Hostel.create({
      name,
      type,
      description,
      capacity,
      warden,
      location,
      amenities,
      rules,
      featured,
    });

    res.status(201).json({ success: true, data: hostel });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Hostel already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update hostel (admin only)
 */
exports.update = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    res.json({ success: true, data: hostel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add image to hostel
 * Expects either:
 * - req.file (from multer middleware) for file upload
 * - req.body.url for direct URL
 */
exports.addImage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    let imageUrl = req.body.url;

    // If file uploaded, upload to Cloudinary
    if (req.file && isConfigured()) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'coderush/hostels',
          resource_type: 'auto',
        });
        imageUrl = result.secure_url;

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL required' });
    }

    const caption = req.body.caption || '';

    hostel.images.push({
      url: imageUrl,
      caption,
    });

    await hostel.save();

    res.status(201).json({
      success: true,
      data: hostel,
      message: 'Image added successfully',
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete image from hostel
 */
exports.deleteImage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { hostelId, imageIndex } = req.params;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    const idx = parseInt(imageIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= hostel.images.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    hostel.images.splice(idx, 1);
    await hostel.save();

    res.json({ success: true, data: hostel, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete hostel (admin only)
 */
exports.delete = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const hostel = await Hostel.findByIdAndDelete(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    res.json({ success: true, message: 'Hostel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
