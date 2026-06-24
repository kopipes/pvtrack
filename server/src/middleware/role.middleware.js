const { error } = require('../utils/response');

// Role hierarchy: ADMIN > MANAGER > USER > VIEWER
const ROLE_LEVELS = { ADMIN: 4, MANAGER: 3, USER: 2, VIEWER: 1 };

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Unauthorized', 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Unauthorized', 401);
    }
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minLevel = ROLE_LEVELS[minRole] || 0;
    if (userLevel < minLevel) {
      return error(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

const requireNotViewer = (req, res, next) => {
  if (req.user && req.user.role === 'VIEWER') {
    return error(res, 'Forbidden: viewers cannot perform write operations', 403);
  }
  next();
};

module.exports = { requireRole, requireMinRole, requireNotViewer };
