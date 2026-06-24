const express = require('express');
const router = express.Router();
const { getProjects, createProject, getProject, updateProject, deleteProject, getMembers, addMember, removeMember } = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, requireNotViewer } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', requireRole('ADMIN', 'MANAGER'), createProject);
router.get('/:id', getProject);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateProject);
router.delete('/:id', requireRole('ADMIN'), deleteProject);

router.get('/:id/members', getMembers);
router.post('/:id/members', requireRole('ADMIN', 'MANAGER'), addMember);
router.delete('/:id/members/:userId', requireRole('ADMIN', 'MANAGER'), removeMember);

module.exports = router;
