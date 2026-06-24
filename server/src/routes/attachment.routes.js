const express = require('express');
const submissionRouter = express.Router({ mergeParams: true });
const uploadRouter = express.Router();
const { uploadFile, getSubmissionAttachments } = require('../controllers/attachment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireNotViewer } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

submissionRouter.use(authenticate);
submissionRouter.get('/', getSubmissionAttachments);

uploadRouter.use(authenticate);
uploadRouter.post('/', requireNotViewer, upload.single('file'), uploadFile);

module.exports = { submissionAttachmentRouter: submissionRouter, uploadRouter };
