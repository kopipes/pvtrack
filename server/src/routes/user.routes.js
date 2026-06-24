const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deactivateUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', updateUser);  // self-update allowed; controller enforces role guards
router.patch('/:id/deactivate', requireRole('ADMIN'), deactivateUser);

module.exports = router;
