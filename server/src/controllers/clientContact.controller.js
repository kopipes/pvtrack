const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

const getClientContacts = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ];

    const contacts = await prisma.clientContact.findMany({
      where,
      include: { _count: { select: { projects: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, contacts);
  } catch (err) {
    return error(res, 'Failed to fetch client contacts', 500);
  }
};

const getClientContact = async (req, res) => {
  try {
    const contact = await prisma.clientContact.findUnique({
      where: { id: req.params.id },
      include: {
        projects: {
          select: { id: true, title: true, status: true, deadline: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { projects: true } },
      },
    });
    if (!contact) return error(res, 'Client contact not found', 404);
    return success(res, contact);
  } catch (err) {
    return error(res, 'Failed to fetch client contact', 500);
  }
};

const createClientContact = async (req, res) => {
  const { name, company, email, phone, position, notes } = req.body;
  if (!name || !name.trim()) return error(res, 'name is required', 400);

  try {
    const contact = await prisma.clientContact.create({
      data: {
        name: name.trim(),
        company: company || null,
        email: email ? email.trim().toLowerCase() : null,
        phone: phone || null,
        position: position || null,
        notes: notes || null,
      },
      include: { _count: { select: { projects: true } } },
    });
    return success(res, contact, 'Client contact created', 201);
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'Email already in use', 409);
    return error(res, 'Failed to create client contact', 500);
  }
};

const updateClientContact = async (req, res) => {
  const { name, company, email, phone, position, notes, isActive } = req.body;
  try {
    const contact = await prisma.clientContact.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(company !== undefined && { company }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone !== undefined && { phone }),
        ...(position !== undefined && { position }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { _count: { select: { projects: true } } },
    });
    return success(res, contact, 'Client contact updated');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Client contact not found', 404);
    if (err.code === 'P2002') return error(res, 'Email already in use', 409);
    return error(res, 'Failed to update client contact', 500);
  }
};

const deleteClientContact = async (req, res) => {
  try {
    // Unlink projects before delete
    await prisma.project.updateMany({
      where: { clientContactId: req.params.id },
      data: { clientContactId: null },
    });
    await prisma.clientContact.delete({ where: { id: req.params.id } });
    return success(res, null, 'Client contact deleted');
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Client contact not found', 404);
    return error(res, 'Failed to delete client contact', 500);
  }
};

module.exports = { getClientContacts, getClientContact, createClientContact, updateClientContact, deleteClientContact };
