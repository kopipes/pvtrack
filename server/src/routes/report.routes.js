const express = require('express');
const router = express.Router();
const { getSummary, getProjectReport, exportProjectReport } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/project/:id', getProjectReport);
router.get('/export/:id', exportProjectReport);

module.exports = router;
