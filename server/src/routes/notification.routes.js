const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../lib/prisma');
const { success, error } = require('../utils/response');

// GET /api/notifications — revisions on submissions assigned to current user
router.get('/', authenticate, async (req, res) => {
  try {
    const revisions = await prisma.revision.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        submission: {
          assignedUserId: req.user.id,
          status: 'REVISION',
        },
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, title: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return success(res, revisions);
  } catch (err) {
    console.error('notifications error:', err);
    return error(res, 'Failed to fetch notifications', 500);
  }
});

module.exports = router;
