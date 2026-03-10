const express = require('express');
const { createDraft, getCertificates, getCertificateById, updateState } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/create', protect, upload.single('document'), createDraft);
router.get('/', protect, getCertificates);
router.get('/:hash', protect, getCertificateById);
router.get('/verify/:hash', getCertificateById);
router.put('/:hash/state', protect, updateState);

module.exports = router;
