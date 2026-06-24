const express = require('express');
const router = express.Router({ mergeParams: true });
const { getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } = require('../controllers/checklist.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireNotViewer } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getChecklist);
router.post('/', requireNotViewer, createChecklistItem);
router.patch('/:itemId', requireNotViewer, updateChecklistItem);
router.delete('/:itemId', requireNotViewer, deleteChecklistItem);

module.exports = router;
