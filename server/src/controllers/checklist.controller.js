const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const getChecklist = async (req, res) => {
  try {
    const items = await prisma.checklistItem.findMany({
      where: { submissionId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, items);
  } catch (err) {
    return error(res, 'Failed to fetch checklist', 500);
  }
};

const createChecklistItem = async (req, res) => {
  const { title, dueDate } = req.body;
  if (!title || !title.trim()) return error(res, 'title is required', 400);

  try {
    const item = await prisma.checklistItem.create({
      data: {
        submissionId: req.params.id,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return success(res, item, 'Checklist item created', 201);
  } catch (err) {
    return error(res, 'Failed to create checklist item', 500);
  }
};

const updateChecklistItem = async (req, res) => {
  const { title, isCompleted, dueDate } = req.body;

  try {
    const item = await prisma.checklistItem.update({
      where: { id: req.params.itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });
    return success(res, item, 'Checklist item updated');
  } catch (err) {
    return error(res, 'Failed to update checklist item', 500);
  }
};

const deleteChecklistItem = async (req, res) => {
  try {
    await prisma.checklistItem.delete({ where: { id: req.params.itemId } });
    return success(res, null, 'Checklist item deleted');
  } catch (err) {
    return error(res, 'Failed to delete checklist item', 500);
  }
};

module.exports = { getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem };
