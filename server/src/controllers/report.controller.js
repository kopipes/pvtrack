const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const getSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo, divisionId } = req.query;

    // Build date range filter for project deadline
    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    const projectWhere = {};
    if (dateFrom || dateTo) projectWhere.deadline = dateFilter;
    // Filter by PIC's division
    if (divisionId) projectWhere.pic = { divisionId };

    const submissionWhere = {};
    if (dateFrom || dateTo) submissionWhere.deadline = dateFilter;
    if (divisionId) submissionWhere.assignedUser = { divisionId };

    const [totalProjects, activeProjects, totalSubmissions] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.project.count({ where: { ...projectWhere, status: 'ACTIVE' } }),
      prisma.submission.count({ where: submissionWhere }),
    ]);

    const inProgressSubmissions = await prisma.submission.count({
      where: { ...submissionWhere, status: { in: ['IN_PROGRESS', 'SUBMITTED', 'RESUBMITTED'] } },
    });

    const needRevision = await prisma.submission.count({
      where: { ...submissionWhere, status: 'REVISION' },
    });

    const now = new Date();
    const overdue = await prisma.submission.count({
      where: {
        ...submissionWhere,
        deadline: { ...(submissionWhere.deadline || {}), lt: now },
        status: { notIn: ['APPROVED', 'DONE'] },
      },
    });

    // Projects with recent activity
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        pic: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Ongoing projects with submission details
    const ongoingProjects = await prisma.project.findMany({
      where: { ...projectWhere, status: 'ACTIVE' },
      include: {
        pic: { select: { id: true, name: true, division: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
        submissions: {
          include: {
            assignedUser: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    // Submission contributors: count per assignedUser across all active projects
    const contributorWhere = {
      assignedUserId: { not: null },
      project: { status: 'ACTIVE', ...projectWhere },
    };
    if (divisionId) contributorWhere.assignedUser = { divisionId };
    const submissionContributors = await prisma.submission.groupBy({
      by: ['assignedUserId'],
      where: contributorWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch user details + their submissions for contributors
    const contributorIds = submissionContributors.map((c) => c.assignedUserId).filter(Boolean);
    const contributorUsers = await prisma.user.findMany({
      where: { id: { in: contributorIds } },
      select: { id: true, name: true, division: { select: { name: true } } },
    });
    const contributorSubmissions = await prisma.submission.findMany({
      where: {
        assignedUserId: { in: contributorIds },
        project: { status: 'ACTIVE' },
      },
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        deadline: true,
        assignedUserId: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const submissionsByUser = contributorIds.reduce((acc, uid) => {
      acc[uid] = contributorSubmissions.filter((s) => s.assignedUserId === uid);
      return acc;
    }, {});
    const contributorMap = Object.fromEntries(contributorUsers.map((u) => [u.id, u]));
    const contributors = submissionContributors.map((c) => ({
      user: contributorMap[c.assignedUserId],
      count: c._count.id,
      submissions: submissionsByUser[c.assignedUserId] || [],
    })).filter((c) => c.user);

    // Submissions needing attention
    const needAttentionBase = {};
    if (divisionId) needAttentionBase.assignedUser = { divisionId };
    if (dateFrom || dateTo) needAttentionBase.deadline = dateFilter;
    const needAttention = await prisma.submission.findMany({
      where: {
        ...needAttentionBase,
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
    const deadlinesWhere = {};
    if (divisionId) deadlinesWhere.assignedUser = { divisionId };
    const deadlinesThisWeek = await prisma.submission.findMany({
      where: {
        ...deadlinesWhere,
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
      ongoingProjects,
      contributors,
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
