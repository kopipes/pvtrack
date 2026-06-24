const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const getSummary = async (req, res) => {
  try {
    const [totalProjects, activeProjects, totalSubmissions] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.submission.count(),
    ]);

    const inProgressSubmissions = await prisma.submission.count({
      where: { status: { in: ['IN_PROGRESS', 'SUBMITTED', 'RESUBMITTED'] } },
    });

    const needRevision = await prisma.submission.count({
      where: { status: 'REVISION' },
    });

    const now = new Date();
    const overdue = await prisma.submission.count({
      where: {
        deadline: { lt: now },
        status: { notIn: ['APPROVED', 'DONE'] },
      },
    });

    // Projects with recent activity
    const projects = await prisma.project.findMany({
      include: {
        pic: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Submissions needing attention
    const needAttention = await prisma.submission.findMany({
      where: {
        OR: [
          { status: 'REVISION' },
          { deadline: { lt: now }, status: { notIn: ['APPROVED', 'DONE'] } },
        ],
      },
      include: {
        project: { select: { id: true, title: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
      take: 10,
    });

    // Deadlines this week
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const deadlinesThisWeek = await prisma.submission.findMany({
      where: {
        deadline: { gte: now, lte: weekEnd },
        status: { notIn: ['APPROVED', 'DONE'] },
      },
      include: {
        project: { select: { id: true, title: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    return success(res, {
      stats: { totalProjects, activeProjects, totalSubmissions, inProgressSubmissions, needRevision, overdue },
      projects,
      needAttention,
      deadlinesThisWeek,
    });
  } catch (err) {
    console.error('getSummary error:', err);
    return error(res, 'Failed to fetch summary', 500);
  }
};

const getProjectReport = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        pic: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, role: true } } } },
        submissions: {
          include: {
            assignedUser: { select: { id: true, name: true } },
            _count: { select: { revisions: true, checklistItems: true, notes: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) return error(res, 'Project not found', 404);

    const statusBreakdown = project.submissions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const totalRevisions = project.submissions.reduce((sum, s) => sum + s._count.revisions, 0);

    return success(res, { project, statusBreakdown, totalRevisions });
  } catch (err) {
    console.error('getProjectReport error:', err);
    return error(res, 'Failed to fetch project report', 500);
  }
};

const exportProjectReport = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        pic: { select: { name: true, email: true } },
        submissions: {
          include: {
            assignedUser: { select: { name: true } },
            _count: { select: { revisions: true, checklistItems: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) return error(res, 'Project not found', 404);

    // Build CSV
    const rows = [
      ['Project Report: ' + project.title],
      ['PIC', project.pic.name, project.pic.email],
      ['Status', project.status],
      ['Deadline', project.deadline.toISOString().split('T')[0]],
      ['Overall Progress', project.progressTotal + '%'],
      [],
      ['Submissions'],
      ['Title', 'Status', 'Progress', 'Assigned To', 'Deadline', 'Revisions', 'Checklist Items'],
      ...project.submissions.map((s) => [
        s.title,
        s.status,
        s.progress + '%',
        s.assignedUser?.name || 'Unassigned',
        s.deadline ? s.deadline.toISOString().split('T')[0] : '',
        s._count.revisions,
        s._count.checklistItems,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/[^a-z0-9]/gi, '_')}_report.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportProjectReport error:', err);
    return error(res, 'Failed to export report', 500);
  }
};

module.exports = { getSummary, getProjectReport, exportProjectReport };
