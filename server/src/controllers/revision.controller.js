
const { success, error } = require('../utils/response');

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
  const { feedback, attachment } = req.body;
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

    // Update submission status to REVISION
    await prisma.submission.update({
      where: { id: req.params.id },
      data: { status: 'REVISION' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        projectId: submission.projectId,
        submissionId: submission.id,
        action: 'REVISION_REQUESTED',
        description: `Revision #${revisionNumber} requested`,
      },
    });

    return success(res, revision, 'Revision created', 201);
  } catch (err) {
    return error(res, 'Failed to create revision', 500);
  }
};

const updateRevisionStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return error(res, 'status is required', 400);

  try {
    const revision = await prisma.revision.update({
      where: { id: req.params.id },
      data: { status },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return success(res, revision, 'Revision status updated');
  } catch (err) {
    return error(res, 'Failed to update revision status', 500);
  }
};

module.exports = { getRevisions, createRevision, updateRevisionStatus };
