const express = require('express');
const router = express.Router();
const { getDivisions, getDivision, createDivision, updateDivision, deleteDivision } = require('../controllers/division.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getDivisions);
router.get('/:id', getDivision);
router.post('/', requireRole('ADMIN'), createDivision);
router.put('/:id', requireRole('ADMIN'), updateDivision);
router.delete('/:id', requireRole('ADMIN'), deleteDivision);

module.exports = router;
