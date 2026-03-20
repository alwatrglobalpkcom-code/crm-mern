const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOAD_MAX_SIZE } = require('../config/env');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png|gif|webp)$/i;
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safe = ALLOWED_EXT.test(ext) ? ext : '.bin';
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ALLOWED_EXT.test(ext) && ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, GIF, WEBP (max 2MB)'));
    }
  }
});

module.exports = upload;
