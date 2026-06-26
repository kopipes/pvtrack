const prisma = require('../lib/prisma');

/**
 * Log an activity event. Failures are swallowed so they never break
 * the calling request.
 */
const logActivity = async (userId, action, description, projectId = null, submissionId = null) => {
  try {
    await prisma.activityLog.create({
      data: { userId, projectId, submissionId, action, description },
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

module.exports = { logActivity };
