const { success, error } = require('../utils/response');
const { logActivity } = require('../utils/activityLog');
const prisma = require('../lib/prisma');

const getRevisions = async (req, res) => {
  try {
    const revisions = await prisma.revision.findMany({
      where: { submissionId: req.params.id },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { revisionNumber: 'asc' },
    });
    return success(res, revisions);
  } catch (err) {
    return error(res, 'Failed to fetch revisions', 500);
  }
};

const createRevision = async (req, res) => {
  const { feedback, attachment, newDeadline } = req.body;
  if (!feedback || !feedback.trim()) return error(res, 'feedback is required', 400);

  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return error(res, 'Submission not found', 404);

    // Auto-increment revision number per submission
    const count = await prisma.revision.count({ where: { submissionId: req.params.id } });
    const revisionNumber = count + 1;

    const revision = await prisma.revision.create({
      data: {
        submissionId: req.params.id,
        revisionNumber,
        feedback: feedback.trim(),
        status: 'OPEN',
        createdById: req.user.id,
        attachment: attachment || null,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    // Build submission update: always set status to REVISION, optionally update deadline
    const submissionUpdate = { status: 'REVISION' };
    const logParts = [`Revision #${revisionNumber} requested`];

    if (newDeadline) {
      const oldDeadline = submission.deadline
        ? new Date(submission.deadline).toLocaleDateString('en-CA') // YYYY-MM-DD
        : 'none';
      const parsedNew = new Date(newDeadline);
      const newDeadlineStr = parsedNew.toLocaleDateString('en-CA');
      submissionUpdate.deadline = parsedNew;
      logParts.push(`deadline changed: ${oldDeadline} → ${newDeadlineStr}`);
    }

    await prisma.submission.update({
      where: { id: req.params.id },
      data: submissionUpdate,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        projectId: submission.projectId,
        submissionId: submission.id,
        action: 'REVISION_REQUESTED',
        description: logParts.join('; '),
      },
    });

    return success(res, revision, 'Revision created', 201);
  } catch (err) {
    console.error('createRevision error:', err);
    return error(res, 'Failed to create revision', 500);
  }
};

const updateRevisionStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return error(res, 'status is required', 400);

  try {
    // Fetch revision with submission context for logging
    const existing = await prisma.revision.findUnique({
      where: { id: req.params.id },
      include: {
        submission: { select: { id: true, title: true, projectId: true } },
      },
    });
    if (!existing) return error(res, 'Revision not found', 404);

    const revision = await prisma.revision.update({
      where: { id: req.params.id },
      data: { status },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    // Log submit (IN_PROGRESS) or approve (RESOLVED)
    if (status === 'IN_PROGRESS') {
      await logActivity(
        req.user.id,
        'REVISION_SUBMITTED',
        `Revision #${existing.revisionNumber} submitted by ${req.user.name}`,
        existing.submission.projectId,
        existing.submission.id,
      );
    } else if (status === 'RESOLVED') {
      await logActivity(
        req.user.id,
        'REVISION_APPROVED',
        `Revision #${existing.revisionNumber} approved by ${req.user.name}`,
        existing.submission.projectId,
        existing.submission.id,
      );
    }

    return success(res, revision, 'Revision status updated');
  } catch (err) {
    console.error('updateRevisionStatus error:', err);
    return error(res, 'Failed to update revision status', 500);
  }
};

module.exports = { getRevisions, createRevision, updateRevisionStatus };
