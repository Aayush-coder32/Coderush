const { cloudinary, isConfigured } = require('../config/cloudinary');

/**
 * Uploads a buffer to Cloudinary. Returns placeholder if not configured.
 */
function uploadBuffer(buffer, folder = 'smart_campus_events') {
  return new Promise((resolve, reject) => {
    if (!isConfigured() || !buffer?.length) {
      return resolve({
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        publicId: '',
      });
    }
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer };
