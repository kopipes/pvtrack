const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const getNotes = async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { submissionId: req.params.id },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, notes);
  } catch (err) {
    return error(res, 'Failed to fetch notes', 500);
  }
};

const createNote = async (req, res) => {
  const { noteText } = req.body;
  if (!noteText || !noteText.trim()) return error(res, 'noteText is required', 400);

  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return error(res, 'Submission not found', 404);

    const note = await prisma.note.create({
      data: { submissionId: req.params.id, userId: req.user.id, noteText: noteText.trim() },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        projectId: submission.projectId,
        submissionId: submission.id,
        action: 'NOTE_ADDED',
        description: 'Note added to submission',
      },
    });

    return success(res, note, 'Note created', 201);
  } catch (err) {
    return error(res, 'Failed to create note', 500);
  }
};

module.exports = { getNotes, createNote };
