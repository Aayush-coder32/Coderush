const multer = require('multer');

const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok =
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!ok) return cb(new Error('Allowed: images, PDF, DOC/DOCX'), false);
    cb(null, true);
  },
});
