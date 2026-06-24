
const { success, error } = require('../utils/response');

const prisma = require('../lib/prisma');

const projectInclude = {
  pic: { select: { id: true, name: true, email: true, divisions: { include: { division: { select: { id: true, name: true } } } } } },
  createdBy: { select: { id: true, name: true } },
  clientContact: { select: { id: true, name: true, company: true, email: true, phone: true } },
  _count: { select: { submissions: true, members: true } },
};

const logActivity = async (userId, action, description, projectId = null, submissionId = null) => {
  try {
    await prisma.activityLog.create({
      data: { userId, projectId, submissionId, action, description },
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

const getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    // Non-admin users only see projects they are members of or PIC
    if (req.user.role !== 'ADMIN') {
      where.OR = [
        { picId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return success(res, projects);
  } catch (err) {
    console.error('getProjects error:', err);
    return error(res, 'Failed to fetch projects', 500);
  }
};

const createProject = async (req, res) => {
  const { title, description, status, priority, startDate, deadline, picId, clientContactId } = req.body;

  if (!title || !deadline) {
    return error(res, 'title and deadline are required', 400);
  }

  // Creator is automatically the PIC
  const effectivePicId = req.user.id;

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        deadline: new Date(deadline),
        picId: effectivePicId,
        createdById: req.user.id,
        clientContactId: clientContactId || null,
      },
      include: projectInclude,
    });

    // Auto-add creator as member (upsert to avoid duplicate error)
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: req.user.id } },
      create: { projectId: project.id, userId: req.user.id, canCreateSubmission: true },
      update: {},
    });

    await logActivity(req.user.id, 'PROJECT_CREATED', `Project "${title}" created`, project.id);

    return success(res, project, 'Project created', 201);
  } catch (err) {
    console.error('createProject error:', err);
    return error(res, 'Failed to create project', 500);
  }
};

const getProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        ...projectInclude,
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    if (!project) return error(res, 'Project not found', 404);
    return success(res, project);
  } catch (err) {
    console.error('getProject error:', err);
    return error(res, 'Failed to fetch project', 500);
  }
};

const updateProject = async (req, res) => {
  const { title, description, status, priority, startDate, deadline, picId, clientContactId } = req.body;

  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Project not found', 404);

    // Build change description
    const changes = [];
    if (title && title !== existing.title) changes.push(`title: "${existing.title}" → "${title}"`);
    if (status && status !== existing.status) changes.push(`status: ${existing.status} → ${status}`);
    if (priority && priority !== existing.priority) changes.push(`priority: ${existing.priority} → ${priority}`);
    if (deadline) {
      const newD = new Date(deadline).toDateString();
      const oldD = existing.deadline ? existing.deadline.toDateString() : 'none';
      if (newD !== oldD) changes.push(`deadline: ${oldD} → ${newD}`);
    }
    if (description !== undefined && description !== existing.description) changes.push('description updated');

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(picId && { picId }),
        ...(clientContactId !== undefined && { clientContactId: clientContactId || null }),
      },
      include: projectInclude,
    });

    const changeDesc = changes.length > 0
      ? `Project "${project.title}" updated by ${req.user.name}: ${changes.join(', ')}`
      : `Project "${project.title}" updated by ${req.user.name}`;

    await logActivity(req.user.id, 'PROJECT_UPDATED', changeDesc, project.id);

    return success(res, project, 'Project updated');
  } catch (err) {
    console.error('updateProject error:', err);
    return error(res, 'Failed to update project', 500);
  }
};

const deleteProject = async (req, res) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Project not found', 404);

    await prisma.project.delete({ where: { id: req.params.id } });

    return success(res, null, 'Project deleted');
  } catch (err) {
    console.error('deleteProject error:', err);
    return error(res, 'Failed to delete project', 500);
  }
};

const getMembers = async (req, res) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return success(res, members);
  } catch (err) {
    return error(res, 'Failed to fetch members', 500);
  }
};

const addMember = async (req, res) => {
  const { userId, canCreateSubmission } = req.body;
  if (!userId) return error(res, 'userId is required', 400);

  try {
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      create: {
        projectId: req.params.id,
        userId,
        canCreateSubmission: canCreateSubmission ?? false,
      },
      update: {
        canCreateSubmission: canCreateSubmission ?? false,
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return success(res, member, 'Member saved', 200);
  } catch (err) {
    return error(res, 'Failed to save member', 500);
  }
};

const removeMember = async (req, res) => {
  try {
    await prisma.projectMember.deleteMany({
      where: { projectId: req.params.id, userId: req.params.userId },
    });
    return success(res, null, 'Member removed');
  } catch (err) {
    return error(res, 'Failed to remove member', 500);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, getMembers, addMember, removeMember };
