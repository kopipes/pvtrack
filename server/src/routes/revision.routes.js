const express = require('express');
const submissionRouter = express.Router({ mergeParams: true });
const standaloneRouter = express.Router();
const { getRevisions, createRevision, updateRevisionStatus } = require('../controllers/revision.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

submissionRouter.use(authenticate);
submissionRouter.get('/', getRevisions);
submissionRouter.post('/', requireRole('ADMIN', 'MANAGER'), createRevision);

standaloneRouter.use(authenticate);
standaloneRouter.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), updateRevisionStatus);

module.exports = { submissionRevisionRouter: submissionRouter, revisionsRouter: standaloneRouter };
