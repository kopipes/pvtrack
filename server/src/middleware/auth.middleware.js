const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) {
      return error(res, 'User not found', 401);
    }
    if (!user.isActive) {
      return error(res, 'Account is deactivated', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

module.exports = { authenticate };
