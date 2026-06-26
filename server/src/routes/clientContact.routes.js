const express = require('express');
const router = express.Router();
const { getClientContacts, getClientContact, createClientContact, updateClientContact, deleteClientContact } = require('../controllers/clientContact.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getClientContacts);
router.get('/:id', getClientContact);
router.post('/', requireRole('ADMIN', 'MANAGER'), createClientContact);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateClientContact);
router.delete('/:id', requireRole('ADMIN'), deleteClientContact);

module.exports = router;
