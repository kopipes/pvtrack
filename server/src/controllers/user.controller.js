const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');
const prisma = require('../lib/prisma');

const userSelect = {
  id: true, name: true, email: true, role: true,
  isActive: true, createdAt: true, updatedAt: true,
  divisions: {
    include: { division: { select: { id: true, name: true } } },
  },
};

const getUsers = async (req, res) => {
  try {
    const { role, divisionId, isActive, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (divisionId) where.divisions = { some: { divisionId } };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { name: 'asc' },
    });
    return success(res, users);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch users', 500);
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userSelect,
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) {
    return error(res, 'Failed to fetch user', 500);
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, divisionIds } = req.body;
  if (!name || !email || !password) return error(res, 'name, email and password are required', 400);
  if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role || 'USER',
        divisions: divisionIds?.length
          ? { create: divisionIds.map((id) => ({ divisionId: id })) }
          : undefined,
      },
      select: userSelect,
    });
    return success(res, user, 'User created', 201);
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'Email already in use', 409);
    return error(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  const { name, email, role, divisionIds, isActive, password } = req.body;

  if (req.user.role !== 'ADMIN' && req.params.id !== req.user.id) {
    return error(res, 'Forbidden', 403);
  }

  try {
    const data = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.trim().toLowerCase();
    if (role && req.user.role === 'ADMIN') data.role = role;
    if (isActive !== undefined && req.user.role === 'ADMIN') data.isActive = isActive;
    if (password) {
      if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update divisions if provided (admin only)
    if (divisionIds !== undefined && req.user.role === 'ADMIN') {
      data.divisions = {
        deleteMany: {},
        create: (divisionIds || []).map((id) => ({ divisionId: id })),
      };
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: userSelect,
    });
    return success(res, user, 'User updated');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'User not found', 404);
    if (err.code === 'P2002') return error(res, 'Email already in use', 409);
    console.error(err);
    return error(res, 'Failed to update user', 500);
  }
};

const deactivateUser = async (req, res) => {
  if (req.params.id === req.user.id) return error(res, 'Cannot deactivate your own account', 400);
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: userSelect,
    });
    return success(res, user, 'User deactivated');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'User not found', 404);
    return error(res, 'Failed to deactivate user', 500);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deactivateUser };
