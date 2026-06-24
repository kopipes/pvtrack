const { success, error } = require('../utils/response');
const prisma = require('../lib/prisma');

const getDivisions = async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      include: { _count: { select: { userDivisions: true } } },
      orderBy: { name: 'asc' },
    });
    // Normalize count field name
    const result = divisions.map((d) => ({ ...d, _count: { users: d._count.userDivisions } }));
    return success(res, result);
  } catch (err) {
    return error(res, 'Failed to fetch divisions', 500);
  }
};

const getDivision = async (req, res) => {
  try {
    const division = await prisma.division.findUnique({
      where: { id: req.params.id },
      include: {
        userDivisions: {
          include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
        },
        _count: { select: { userDivisions: true } },
      },
    });
    if (!division) return error(res, 'Division not found', 404);
    const result = {
      ...division,
      users: division.userDivisions.map((ud) => ud.user),
      _count: { users: division._count.userDivisions },
    };
    return success(res, result);
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
      include: { _count: { select: { userDivisions: true } } },
    });
    return success(res, { ...division, _count: { users: division._count.userDivisions } }, 'Division created', 201);
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
      include: { _count: { select: { userDivisions: true } } },
    });
    return success(res, { ...division, _count: { users: division._count.userDivisions } }, 'Division updated');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Division not found', 404);
    if (err.code === 'P2002') return error(res, 'Division name already exists', 409);
    return error(res, 'Failed to update division', 500);
  }
};

const deleteDivision = async (req, res) => {
  try {
    // UserDivision rows cascade delete automatically
    await prisma.division.delete({ where: { id: req.params.id } });
    return success(res, null, 'Division deleted');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Division not found', 404);
    return error(res, 'Failed to delete division', 500);
  }
};

module.exports = { getDivisions, getDivision, createDivision, updateDivision, deleteDivision };
