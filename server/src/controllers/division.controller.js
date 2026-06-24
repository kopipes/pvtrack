
const { success, error } = require('../utils/response');

const prisma = require('../lib/prisma');

const getDivisions = async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, divisions);
  } catch (err) {
    return error(res, 'Failed to fetch divisions', 500);
  }
};

const getDivision = async (req, res) => {
  try {
    const division = await prisma.division.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        _count: { select: { users: true } },
      },
    });
    if (!division) return error(res, 'Division not found', 404);
    return success(res, division);
  } catch (err) {
    return error(res, 'Failed to fetch division', 500);
  }
};

const createDivision = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) return error(res, 'name is required', 400);
  try {
    const division = await prisma.division.create({
      data: { name: name.trim(), description: description || null },
      include: { _count: { select: { users: true } } },
    });
    return success(res, division, 'Division created', 201);
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'Division name already exists', 409);
    return error(res, 'Failed to create division', 500);
  }
};

const updateDivision = async (req, res) => {
  const { name, description, isActive } = req.body;
  try {
    const division = await prisma.division.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { _count: { select: { users: true } } },
    });
    return success(res, division, 'Division updated');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Division not found', 404);
    if (err.code === 'P2002') return error(res, 'Division name already exists', 409);
    return error(res, 'Failed to update division', 500);
  }
};

const deleteDivision = async (req, res) => {
  try {
    // Unlink users before delete
    await prisma.user.updateMany({
      where: { divisionId: req.params.id },
      data: { divisionId: null },
    });
    await prisma.division.delete({ where: { id: req.params.id } });
    return success(res, null, 'Division deleted');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Division not found', 404);
    return error(res, 'Failed to delete division', 500);
  }
};

module.exports = { getDivisions, getDivision, createDivision, updateDivision, deleteDivision };
