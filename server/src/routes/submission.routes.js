const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSubmissions,
  createSubmission,
  getSubmission,
  updateSubmission,
  deleteSubmission,
  updateProgress,
  submitWork,
  approveSubmission,
  updateStatus,
} = require('../controllers/submission.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, requireNotViewer } = require('../middleware/role.middleware');

router.use(authenticate);

// Mounted at /api/projects/:id/submissions
router.get('/', getSubmissions);
router.post('/', requireNotViewer, createSubmission);

// Standalone submission routes (mounted at /api/submissions)
const standaloneRouter = express.Router();
standaloneRouter.use(authenticate);
standaloneRouter.get('/:id', getSubmission);
standaloneRouter.put('/:id', requireNotViewer, updateSubmission);
standaloneRouter.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteSubmission);
standaloneRouter.patch('/:id/progress', requireNotViewer, updateProgress);
standaloneRouter.patch('/:id/submit', requireNotViewer, submitWork);
standaloneRouter.patch('/:id/approve', requireRole('ADMIN', 'MANAGER'), approveSubmission);
standaloneRouter.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateStatus);

module.exports = { projectSubmissionsRouter: router, submissionsRouter: standaloneRouter };
