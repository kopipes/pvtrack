
const { success, error } = require('../utils/response');

const prisma = require('../lib/prisma');

const submissionInclude = {
  assignedUser: { select: { id: true, name: true, email: true } },
  _count: { select: { checklistItems: true, notes: true, revisions: true, attachments: true } },
  checklistItems: { orderBy: { createdAt: 'asc' } },
};

const logActivity = async (userId, action, description, projectId = null, submissionId = null) => {
  try {
    await prisma.activityLog.create({
      data: { userId, projectId, submissionId, action, description },
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

// Recalculate project progress from all its submissions
const recalcProjectProgress = async (projectId) => {
  const submissions = await prisma.submission.findMany({
    where: { projectId },
    select: { progress: true },
  });
  if (submissions.length === 0) return;
  const avg = submissions.reduce((sum, s) => sum + s.progress, 0) / submissions.length;
  await prisma.project.update({
    where: { id: projectId },
    data: { progressTotal: Math.round(avg) },
  });
};

const getSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { projectId: req.params.id };
    if (status) where.status = status;

    const submissions = await prisma.submission.findMany({
      where,
      include: submissionInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return success(res, submissions);
  } catch (err) {
    console.error('getSubmissions error:', err);
    return error(res, 'Failed to fetch submissions', 500);
  }
};

const createSubmission = async (req, res) => {
  const { title, description, deadline, assignedUserId } = req.body;
  const projectId = req.params.id;

  if (!title) return error(res, 'title is required', 400);

  try {
    // VIEWER can never create submissions
    if (req.user.role === 'VIEWER') {
      return error(res, 'Viewers cannot create submissions', 403);
    }

    // Check if user has permission (admin, manager, or canCreateSubmission member)
    if (req.user.role === 'USER') {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } },
      });
      if (!member || !member.canCreateSubmission) {
        return error(res, 'You do not have permission to create submissions in this project', 403);
      }
    }

    const submission = await prisma.submission.create({
      data: {
        projectId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        assignedUserId: assignedUserId || null,
      },
      include: submissionInclude,
    });

    await logActivity(req.user.id, 'SUBMISSION_CREATED', `Submission "${title}" created`, projectId, submission.id);

    return success(res, submission, 'Submission created', 201);
  } catch (err) {
    console.error('createSubmission error:', err);
    return error(res, 'Failed to create submission', 500);
  }
};

const getSubmission = async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        ...submissionInclude,
        notes: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        revisions: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { revisionNumber: 'asc' },
        },
        attachments: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        project: { select: { id: true, title: true } },
      },
    });
    if (!submission) return error(res, 'Submission not found', 404);
    return success(res, submission);
  } catch (err) {
    console.error('getSubmission error:', err);
    return error(res, 'Failed to fetch submission', 500);
  }
};

const updateSubmission = async (req, res) => {
  const { title, description, deadline, assignedUserId, status } = req.body;

  try {
    const existing = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { picId: true, createdById: true } } },
    });
    if (!existing) return error(res, 'Submission not found', 404);

    // Allow: admin, manager, project PIC, project creator, or member with canCreateSubmission
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user.role);
    const isProjectOwner = existing.project.picId === req.user.id || existing.project.createdById === req.user.id;
    if (!isAdminOrManager && !isProjectOwner) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
      });
      if (!member) return error(res, 'Forbidden: not a project member', 403);
    }

    // Build change description
    const changes = [];
    if (title && title !== existing.title) changes.push(`title: "${existing.title}" → "${title}"`);
    if (status && status !== existing.status) changes.push(`status: ${existing.status} → ${status}`);
    if (deadline !== undefined) {
      const newDeadline = deadline ? new Date(deadline).toDateString() : 'none';
      const oldDeadline = existing.deadline ? existing.deadline.toDateString() : 'none';
      if (newDeadline !== oldDeadline) changes.push(`deadline: ${oldDeadline} → ${newDeadline}`);
    }
    if (assignedUserId !== undefined && assignedUserId !== existing.assignedUserId) {
      // Resolve new and old assignee names
      const [oldUser, newUser] = await Promise.all([
        existing.assignedUserId
          ? prisma.user.findUnique({ where: { id: existing.assignedUserId }, select: { name: true } })
          : Promise.resolve(null),
        assignedUserId
          ? prisma.user.findUnique({ where: { id: assignedUserId }, select: { name: true } })
          : Promise.resolve(null),
      ]);
      const oldName = oldUser?.name || 'Unassigned';
      const newName = newUser?.name || 'Unassigned';
      changes.push(`assignee: ${oldName} → ${newName}`);
    }
    if (description !== undefined && description !== existing.description) changes.push('description updated');

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(assignedUserId !== undefined && { assignedUserId: assignedUserId || null }),
        ...(status && { status }),
      },
      include: submissionInclude,
    });

    const changeDesc = changes.length > 0
      ? `Submission "${submission.title}" updated by ${req.user.name}: ${changes.join(', ')}`
      : `Submission "${submission.title}" updated by ${req.user.name}`;

    await logActivity(req.user.id, 'SUBMISSION_UPDATED', changeDesc, submission.projectId, submission.id);

    return success(res, submission);
  } catch (err) {
    console.error('updateSubmission error:', err);
    return error(res, 'Failed to update submission', 500);
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Submission not found', 404);

    await prisma.submission.delete({ where: { id: req.params.id } });
    await recalcProjectProgress(existing.projectId);

    return success(res, null, 'Submission deleted');
  } catch (err) {
    console.error('deleteSubmission error:', err);
    return error(res, 'Failed to delete submission', 500);
  }
};

const updateProgress = async (req, res) => {
  const { progress } = req.body;
  if (progress === undefined || progress < 0 || progress > 100) {
    return error(res, 'progress must be between 0 and 100', 400);
  }

  try {
    const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Submission not found', 404);

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { progress: parseInt(progress) },
      include: submissionInclude,
    });

    await recalcProjectProgress(submission.projectId);
    await logActivity(req.user.id, 'PROGRESS_UPDATED', `Progress updated to ${progress}%`, submission.projectId, submission.id);

    return success(res, submission, 'Progress updated');
  } catch (err) {
    console.error('updateProgress error:', err);
    return error(res, 'Failed to update progress', 500);
  }
};

const submitWork = async (req, res) => {
  try {
    const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Submission not found', 404);

    const validFromStatuses = ['TODO', 'IN_PROGRESS', 'REVISION'];
    if (!validFromStatuses.includes(existing.status)) {
      return error(res, `Cannot submit from status: ${existing.status}`, 400);
    }

    const newStatus = existing.status === 'REVISION' ? 'RESUBMITTED' : 'SUBMITTED';

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status: newStatus },
      include: submissionInclude,
    });

    await logActivity(req.user.id, 'SUBMISSION_SUBMITTED', `Submission "${submission.title}" submitted for review`, submission.projectId, submission.id);

    return success(res, submission, 'Work submitted');
  } catch (err) {
    console.error('submitWork error:', err);
    return error(res, 'Failed to submit work', 500);
  }
};

const approveSubmission = async (req, res) => {
  try {
    const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Submission not found', 404);

    // Mark all open/in-progress revisions as RESOLVED
    await prisma.revision.updateMany({
      where: {
        submissionId: req.params.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      data: { status: 'RESOLVED' },
    });

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', progress: 100 },
      include: submissionInclude,
    });

    await recalcProjectProgress(submission.projectId);
    await logActivity(req.user.id, 'SUBMISSION_APPROVED', `Submission "${submission.title}" approved by ${req.user.name}`, submission.projectId, submission.id);

    return success(res, submission, 'Submission approved');
  } catch (err) {
    console.error('approveSubmission error:', err);
    return error(res, 'Failed to approve submission', 500);
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return error(res, 'status is required', 400);

  try {
    const existing = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Submission not found', 404);

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status },
      include: submissionInclude,
    });

    await logActivity(req.user.id, 'STATUS_CHANGED', `Status changed to ${status}`, submission.projectId, submission.id);

    return success(res, submission, 'Status updated');
  } catch (err) {
    console.error('updateStatus error:', err);
    return error(res, 'Failed to update status', 500);
  }
};

module.exports = { getSubmissions, createSubmission, getSubmission, updateSubmission, deleteSubmission, updateProgress, submitWork, approveSubmission, updateStatus };
