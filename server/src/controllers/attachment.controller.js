
const { success, error } = require('../utils/response');
const prisma = require('../lib/prisma');

const uploadFile = async (req, res) => {
  if (!req.file) return error(res, 'No file uploaded', 400);

  const { projectId, submissionId } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const attachment = await prisma.attachment.create({
      data: {
        projectId: projectId || null,
        submissionId: submissionId || null,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype,
        uploadedById: req.user.id,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
    return success(res, attachment, 'File uploaded', 201);
  } catch (err) {
    return error(res, 'Failed to save attachment', 500);
  }
};

const getSubmissionAttachments = async (req, res) => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { submissionId: req.params.id },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, attachments);
  } catch (err) {
    return error(res, 'Failed to fetch attachments', 500);
  }
};

module.exports = { uploadFile, getSubmissionAttachments };
