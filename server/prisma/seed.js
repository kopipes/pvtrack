const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data in dependency order
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.note.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.division.deleteMany();
  await prisma.clientContact.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Divisions
  const divEngineering = await prisma.division.create({
    data: { name: 'Engineering', description: 'Software development and infrastructure' },
  });
  const divDesign = await prisma.division.create({
    data: { name: 'Design', description: 'UI/UX design and branding' },
  });
  const divPM = await prisma.division.create({
    data: { name: 'Project Management', description: 'Project coordination and delivery' },
  });
  const divMarketing = await prisma.division.create({
    data: { name: 'Marketing', description: 'Marketing and communications' },
  });

  console.log('Divisions created.');

  // Client Contacts
  const client1 = await prisma.clientContact.create({
    data: {
      name: 'Diana Prince',
      company: 'Acme Corp',
      email: 'diana@acmecorp.com',
      phone: '+62 812-3456-7890',
      position: 'Head of Digital',
      notes: 'Prefers communication via email. Decision maker for all digital projects.',
    },
  });
  const client2 = await prisma.clientContact.create({
    data: {
      name: 'Bruce Wayne',
      company: 'Wayne Enterprises',
      email: 'bruce@wayneent.com',
      phone: '+62 821-9876-5432',
      position: 'CTO',
      notes: 'Very detail-oriented. Requires weekly progress reports.',
    },
  });
  const client3 = await prisma.clientContact.create({
    data: {
      name: 'Clark Kent',
      company: 'Daily Planet Media',
      email: 'clark@dailyplanet.com',
      phone: '+62 857-1122-3344',
      position: 'Marketing Director',
    },
  });

  console.log('Client contacts created.');

  // Users
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@pvtrack.com', passwordHash, role: 'ADMIN', divisionId: divPM.id },
  });
  const manager = await prisma.user.create({
    data: { name: 'Sarah Manager', email: 'manager@pvtrack.com', passwordHash, role: 'MANAGER', divisionId: divPM.id },
  });
  const user1 = await prisma.user.create({
    data: { name: 'Alex Developer', email: 'alex@pvtrack.com', passwordHash, role: 'USER', divisionId: divEngineering.id },
  });
  const user2 = await prisma.user.create({
    data: { name: 'Jordan Designer', email: 'jordan@pvtrack.com', passwordHash, role: 'USER', divisionId: divDesign.id },
  });
  const viewer = await prisma.user.create({
    data: { name: 'Pat Viewer', email: 'viewer@pvtrack.com', passwordHash, role: 'VIEWER', divisionId: divMarketing.id },
  });

  console.log('Users created.');

  // Project 1 - Active
  const project1 = await prisma.project.create({
    data: {
      title: 'Website Redesign 2024',
      description: 'Full redesign of the company website including new branding, improved UX, and mobile responsiveness.',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      deadline: new Date('2026-08-31'),
      progressTotal: 45,
      picId: manager.id,
      createdById: admin.id,
      clientContactId: client1.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: manager.id, canCreateSubmission: true },
      { projectId: project1.id, userId: user1.id, canCreateSubmission: true },
      { projectId: project1.id, userId: user2.id, canCreateSubmission: true },
      { projectId: project1.id, userId: viewer.id, canCreateSubmission: false },
    ],
  });

  // Project 2
  const project2 = await prisma.project.create({
    data: {
      title: 'Mobile App Development',
      description: 'Develop a cross-platform mobile application for Android and iOS.',
      status: 'ACTIVE',
      priority: 'URGENT',
      startDate: new Date('2024-03-01'),
      deadline: new Date('2026-07-15'),
      progressTotal: 30,
      picId: admin.id,
      createdById: admin.id,
      clientContactId: client2.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: admin.id, canCreateSubmission: true },
      { projectId: project2.id, userId: user1.id, canCreateSubmission: true },
      { projectId: project2.id, userId: user2.id, canCreateSubmission: false },
    ],
  });

  console.log('Projects created.');

  // Submissions for Project 1
  const sub1 = await prisma.submission.create({
    data: {
      projectId: project1.id,
      title: 'Design System & Component Library',
      description: 'Create a comprehensive design system with reusable components, color tokens, and typography.',
      status: 'APPROVED',
      progress: 100,
      deadline: new Date('2026-03-31'),
      assignedUserId: user2.id,
    },
  });

  const sub2 = await prisma.submission.create({
    data: {
      projectId: project1.id,
      title: 'Homepage & Landing Page',
      description: 'Redesign the homepage with new hero section, feature highlights, and call-to-action areas.',
      status: 'IN_PROGRESS',
      progress: 60,
      deadline: new Date('2026-07-20'),
      assignedUserId: user1.id,
    },
  });

  const sub3 = await prisma.submission.create({
    data: {
      projectId: project1.id,
      title: 'Navigation & Header Redesign',
      description: 'Redesign top navigation with mega menu, mobile hamburger menu, and sticky scroll behavior.',
      status: 'REVISION',
      progress: 75,
      deadline: new Date('2026-06-30'),
      assignedUserId: user2.id,
    },
  });

  const sub4 = await prisma.submission.create({
    data: {
      projectId: project1.id,
      title: 'Contact & Forms Section',
      description: 'Build contact form with validation, success states, and backend integration.',
      status: 'TODO',
      progress: 0,
      deadline: new Date('2026-08-15'),
      assignedUserId: user1.id,
    },
  });

  // Submissions for Project 2
  const sub5 = await prisma.submission.create({
    data: {
      projectId: project2.id,
      title: 'User Authentication Module',
      description: 'Implement login, registration, forgot password, and social auth.',
      status: 'SUBMITTED',
      progress: 90,
      deadline: new Date('2026-06-25'),
      assignedUserId: user1.id,
    },
  });

  const sub6 = await prisma.submission.create({
    data: {
      projectId: project2.id,
      title: 'Push Notifications System',
      description: 'Integrate FCM for push notifications with topic subscriptions.',
      status: 'IN_PROGRESS',
      progress: 40,
      deadline: new Date('2026-07-10'),
      assignedUserId: user1.id,
    },
  });

  console.log('Submissions created.');

  // Checklist items
  await prisma.checklistItem.createMany({
    data: [
      { submissionId: sub2.id, title: 'Create wireframes', isCompleted: true },
      { submissionId: sub2.id, title: 'Get design approval', isCompleted: true },
      { submissionId: sub2.id, title: 'Implement HTML/CSS', isCompleted: false },
      { submissionId: sub2.id, title: 'Cross-browser testing', isCompleted: false },
      { submissionId: sub2.id, title: 'Performance optimization', isCompleted: false },
      { submissionId: sub3.id, title: 'Desktop nav design', isCompleted: true },
      { submissionId: sub3.id, title: 'Mobile nav design', isCompleted: true },
      { submissionId: sub3.id, title: 'Implement mega menu', isCompleted: true },
      { submissionId: sub3.id, title: 'Fix accessibility issues from revision', isCompleted: false },
      { submissionId: sub5.id, title: 'Login screen UI', isCompleted: true },
      { submissionId: sub5.id, title: 'Registration flow', isCompleted: true },
      { submissionId: sub5.id, title: 'JWT token handling', isCompleted: true },
      { submissionId: sub5.id, title: 'Google OAuth integration', isCompleted: false },
    ],
  });

  // Notes
  await prisma.note.createMany({
    data: [
      { submissionId: sub2.id, userId: manager.id, noteText: 'Looking good! Please ensure the hero is above the fold on 1280px screens.' },
      { submissionId: sub2.id, userId: user1.id, noteText: "Noted. I'll adjust the breakpoints. Should be ready for review by end of week." },
      { submissionId: sub3.id, userId: manager.id, noteText: 'Revision feedback sent. Please address keyboard nav and ARIA labels.' },
      { submissionId: sub5.id, userId: admin.id, noteText: 'Good progress. Waiting on Apple OAuth credentials from the client.' },
    ],
  });

  // Revision
  await prisma.revision.create({
    data: {
      submissionId: sub3.id,
      revisionNumber: 1,
      feedback: 'Mobile navigation has accessibility issues. Add ARIA labels, fix keyboard navigation, and ensure 44x44px touch targets on the close button.',
      status: 'OPEN',
      createdById: manager.id,
    },
  });

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, projectId: project1.id, action: 'PROJECT_CREATED', description: 'Project "Website Redesign 2024" created' },
      { userId: manager.id, projectId: project1.id, submissionId: sub1.id, action: 'SUBMISSION_APPROVED', description: 'Submission "Design System & Component Library" approved' },
      { userId: manager.id, projectId: project1.id, submissionId: sub3.id, action: 'REVISION_REQUESTED', description: 'Revision requested on "Navigation & Header Redesign"' },
      { userId: user1.id, projectId: project2.id, submissionId: sub5.id, action: 'SUBMISSION_SUBMITTED', description: 'Submission "User Authentication Module" submitted for review' },
    ],
  });

  console.log('Seed data created successfully!');
  console.log('\nTest accounts (password: password123):');
  console.log('  admin@pvtrack.com    (ADMIN  / Project Management)');
  console.log('  manager@pvtrack.com  (MANAGER / Project Management)');
  console.log('  alex@pvtrack.com     (USER   / Engineering)');
  console.log('  jordan@pvtrack.com   (USER   / Design)');
  console.log('  viewer@pvtrack.com   (VIEWER / Marketing)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
