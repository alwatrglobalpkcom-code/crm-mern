const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware, roleMiddleware('admin', 'manager', 'agent'));

const uploadWithErrorHandler = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Max 2MB.' });
      return res.status(400).json({ message: err.message || 'Upload failed.' });
    }
    next();
  });
};

router.get('/', documentController.list);
router.post('/', uploadWithErrorHandler, documentController.upload);
router.delete('/:id', documentController.delete);
router.get('/:id/download', documentController.download);

module.exports = router;
