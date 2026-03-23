const express = require('express');
const router = express.Router();
const path = require('path');

// Serve uploaded files (development only)
router.use('/', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;
