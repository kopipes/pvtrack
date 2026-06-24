const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 'Email and password are required', 400);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return error(res, 'Account is deactivated. Contact your administrator.', 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return success(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
};

const logout = (req, res) => {
  // JWT is stateless; logout is handled client-side by removing the token
  return success(res, null, 'Logged out successfully');
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        createdAt: true, divisionId: true,
        division: { select: { id: true, name: true } },
      },
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) {
    console.error('Me error:', err);
    return error(res, 'Failed to fetch user', 500);
  }
};

module.exports = { login, logout, me };
