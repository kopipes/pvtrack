const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const { projectSubmissionsRouter, submissionsRouter } = require('./routes/submission.routes');
const noteRoutes = require('./routes/note.routes');
const checklistRoutes = require('./routes/checklist.routes');
const { submissionRevisionRouter, revisionsRouter } = require('./routes/revision.routes');
const { submissionAttachmentRouter, uploadRouter } = require('./routes/attachment.routes');
const reportRoutes = require('./routes/report.routes');
const divisionRoutes = require('./routes/division.routes');
const userRoutes = require('./routes/user.routes');
const clientContactRoutes = require('./routes/clientContact.routes');

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/submissions', projectSubmissionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/submissions/:id/notes', noteRoutes);
app.use('/api/submissions/:id/checklist', checklistRoutes);
app.use('/api/submissions/:id/revisions', submissionRevisionRouter);
app.use('/api/revisions', revisionsRouter);
app.use('/api/submissions/:id/attachments', submissionAttachmentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/divisions', divisionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/client-contacts', clientContactRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
