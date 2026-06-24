# PVTrack – Full MVP Build Plan

## Overview

PVTrack is a project tracking web application built around two core concepts: **Projects** as containers and **Submission Cards** as work units. This plan covers the full MVP (Phase 1 + Phase 2) with a dual-theme (light/dark), desktop-first responsive design.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, modern tooling |
| Styling | Tailwind CSS v3 | Custom, modern UI without Bootstrap bloat |
| UI Components | shadcn/ui (Radix primitives) | Accessible, themeable, eye-candy cards/modals |
| Icons | Lucide React | Clean, consistent icon set |
| Charts | Recharts | Lightweight, composable charts for dashboard |
| Routing | React Router v6 | SPA routing |
| Forms | React Hook Form + Zod | Lightweight validation |
| HTTP Client | Axios | API communication |
| Backend | Node.js + Express.js | Lightweight REST API |
| ORM | Prisma ORM | Type-safe queries, easy migrations |
| Database | SQLite (dev/MVP) → PostgreSQL-ready | File-based for simplicity |
| Auth | JWT + bcrypt | Secure, stateless auth |
| File Upload | Multer (local /uploads) | Simple file storage for MVP |
| Drag & Drop | @dnd-kit/core | Board view card dragging |

---

## Project Structure

```
pvtrack/
├── client/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── layout/         # Sidebar, TopBar, AppShell
│   │   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── project/        # Project list, detail, form
│   │   │   └── submission/     # Submission card, board, form
│   │   ├── contexts/           # AuthContext, ThemeContext
│   │   ├── hooks/              # useAuth, useProjects, etc.
│   │   ├── lib/                # axios instance, utils
│   │   ├── pages/              # Route-level page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectListPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   └── ReportPage.jsx
│   │   ├── router/             # React Router config
│   │   ├── styles/             # Tailwind globals, theme tokens
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── submission.controller.js
│   │   │   ├── note.controller.js
│   │   │   ├── revision.controller.js
│   │   │   ├── checklist.controller.js
│   │   │   ├── attachment.controller.js
│   │   │   └── report.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── submission.routes.js
│   │   │   ├── note.routes.js
│   │   │   ├── revision.routes.js
│   │   │   ├── checklist.routes.js
│   │   │   ├── attachment.routes.js
│   │   │   └── report.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── response.js
│   │   └── app.js
│   ├── uploads/
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── docs/
└── README.md
```

---

## Database Schema (Prisma)

```prisma
enum Role { ADMIN MANAGER USER VIEWER }
enum ProjectStatus { DRAFT ACTIVE ON_HOLD COMPLETED CANCELLED ARCHIVED }
enum Priority { LOW MEDIUM HIGH URGENT }
enum SubmissionStatus { TODO IN_PROGRESS SUBMITTED REVISION RESUBMITTED APPROVED DONE ON_HOLD }
enum RevisionStatus { OPEN IN_PROGRESS RESOLVED }

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  projectsPIC     Project[]      @relation("PIC")
  projectsCreated Project[]      @relation("Creator")
  submissions     Submission[]
  notes           Note[]
  revisions       Revision[]
  attachments     Attachment[]
  activityLogs    ActivityLog[]
  projectMembers  ProjectMember[]
}

model Project {
  id            String        @id @default(uuid())
  title         String
  description   String?
  status        ProjectStatus @default(DRAFT)
  priority      Priority      @default(MEDIUM)
  startDate     DateTime?
  deadline      DateTime
  progressTotal Float         @default(0)
  picId         String
  createdById   String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  pic           User          @relation("PIC", fields: [picId], references: [id])
  createdBy     User          @relation("Creator", fields: [createdById], references: [id])
  submissions   Submission[]
  attachments   Attachment[]
  activityLogs  ActivityLog[]
  members       ProjectMember[]
}

model ProjectMember {
  id        String  @id @default(uuid())
  projectId String
  userId    String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id])
  @@unique([projectId, userId])
}

model Submission {
  id             String           @id @default(uuid())
  projectId      String
  title          String
  description    String?
  status         SubmissionStatus @default(TODO)
  progress       Int              @default(0)
  deadline       DateTime?
  assignedUserId String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  project        Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedUser   User?            @relation(fields: [assignedUserId], references: [id])
  checklistItems ChecklistItem[]
  notes          Note[]
  revisions      Revision[]
  attachments    Attachment[]
  activityLogs   ActivityLog[]
}

model ChecklistItem {
  id           String     @id @default(uuid())
  submissionId String
  title        String
  isCompleted  Boolean    @default(false)
  dueDate      DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
}

model Note {
  id           String     @id @default(uuid())
  submissionId String
  userId       String
  noteText     String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id])
}

model Revision {
  id             String         @id @default(uuid())
  submissionId   String
  revisionNumber Int
  feedback       String
  status         RevisionStatus @default(OPEN)
  createdById    String
  attachment     String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  submission     Submission     @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  createdBy      User           @relation(fields: [createdById], references: [id])
}

model Attachment {
  id           String      @id @default(uuid())
  projectId    String?
  submissionId String?
  fileName     String
  fileUrl      String
  fileType     String
  uploadedById String
  createdAt    DateTime    @default(now())
  project      Project?    @relation(fields: [projectId], references: [id])
  submission   Submission? @relation(fields: [submissionId], references: [id])
  uploadedBy   User        @relation(fields: [uploadedById], references: [id])
}

model ActivityLog {
  id           String      @id @default(uuid())
  userId       String
  projectId    String?
  submissionId String?
  action       String
  description  String?
  createdAt    DateTime    @default(now())
  user         User        @relation(fields: [userId], references: [id])
  project      Project?    @relation(fields: [projectId], references: [id])
  submission   Submission? @relation(fields: [submissionId], references: [id])
}
```

---

## REST API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Projects
```
GET    /api/projects
POST   /api/projects              [ADMIN, MANAGER]
GET    /api/projects/:id
PUT    /api/projects/:id          [ADMIN, MANAGER]
DELETE /api/projects/:id          [ADMIN]
GET    /api/projects/:id/members
POST   /api/projects/:id/members  [ADMIN, MANAGER]
DELETE /api/projects/:id/members/:userId
```

### Submissions
```
GET    /api/projects/:id/submissions
POST   /api/projects/:id/submissions
GET    /api/submissions/:id
PUT    /api/submissions/:id
DELETE /api/submissions/:id
PATCH  /api/submissions/:id/progress
PATCH  /api/submissions/:id/submit
PATCH  /api/submissions/:id/approve
PATCH  /api/submissions/:id/status
```

### Sub-resources
```
GET/POST/PATCH/DELETE  /api/submissions/:id/checklist
GET/POST               /api/submissions/:id/notes
GET/POST               /api/submissions/:id/revisions
PATCH                  /api/revisions/:id/status
POST                   /api/upload
GET                    /api/reports/summary
GET                    /api/reports/project/:id
GET                    /api/reports/export/:id
```

---

## UI Design System

### Theme
- Dual theme via Tailwind `dark:` classes + ThemeContext toggling `dark` on `<html>`
- Persisted to `localStorage`

### Color Palette
| Context | Light | Dark |
|---|---|---|
| Background | slate-50 | slate-900 |
| Card | white | slate-800 |
| Text primary | slate-900 | slate-100 |
| Text secondary | slate-500 | slate-400 |
| Accent / Primary | indigo-600 | indigo-400 |
| Border | slate-200 | slate-700 |

### Status Color Encoding
| Status | Color |
|---|---|
| Active / In Progress | indigo/blue |
| Approved / Done | emerald/green |
| Revision | amber/orange |
| Overdue | red |
| On Hold / Draft | slate/purple |

### Typography
- Font: **Inter** (Google Fonts)
- Tailwind default scale (sm, base, lg, 2xl, 3xl)

### Eye-Candy Details
- Glass morphism cards in dark mode: `bg-white/5 backdrop-blur border border-white/10`
- Gradient project headers: subtle indigo → purple
- Animated progress bars via CSS `transition` on width
- Card hover: `hover:-translate-y-1 hover:shadow-xl transition-all duration-200`
- SVG circle progress ring on project header
- Sidebar active item: indigo left border + faint bg glow
- Avatar initials with deterministic color from name hash
- Skeleton loaders (pulsing blocks) while fetching
- Smooth modal open/close animations via Radix Dialog
- Recharts custom-themed to match light/dark palette

---

## Pages & Components

### 1. Login Page
- Split layout: brand/illustration left, form right
- Email + password with show/hide toggle
- JWT stored in localStorage, redirect by role on success

### 2. App Shell
- **Sidebar** (collapsible): logo, nav links, user avatar + role, theme toggle, logout
- **TopBar**: page title, breadcrumb, global search, notification bell, user menu
- **Main area**: per-page scrollable content

### 3. Dashboard Page
- 4 stats cards: Active Projects, In Progress, Need Revision, Overdue
- Project progress chart (Recharts horizontal bars)
- "Need Attention" list: overdue + revision-pending items
- "Deadlines This Week" compact panel
- Quick filters: status, PIC, deadline

### 4. Project List Page
- Toolbar: search, filter dropdowns, `+ New Project` button
- Table: Name, PIC avatar, Deadline, Progress bar, Status badge, Submission count, Actions
- Click row → Project Detail Page
- Empty state illustration

### 5. Project Detail Page
- **Header**: title, status badge, priority badge, deadline, PIC avatar, circular progress ring
- **Summary card**: description, background, scope, key deadline
- **Action bar**: `+ Create Submission`, `Edit Project`, `Export Report`, Back button
- **View toggle**: List view / Board view
- **Submission Card Grid** (list view): responsive grid of cards
- **Board View**: Kanban columns with @dnd-kit drag-and-drop

### 6. Submission Card (in list)
- Title + status badge
- Assigned user avatar
- Progress bar + %
- Checklist count badge (e.g. 3/5)
- Notes count + Revision count icon badges
- Deadline chip (red if overdue)
- Hover lift shadow → click opens Slide-over

### 7. Submission Detail Slide-over
Tabbed panel:
- **Overview**: title, description, status, progress slider + quick buttons (0/25/50/75/100%), assignee, deadline
- **To-do List**: inline add/check/delete checklist items
- **Notes**: threaded list + add note form
- **Revisions**: history + feedback + status badges + resubmit CTA
- **Attachments**: file upload + link input + preview grid
- **Activity Log**: action timeline

Role-gated action buttons:
- User: `Submit Work`, `Update Progress`
- Manager/Admin: `Approve`, `Request Revision`, `Put On Hold`

### 8. Board View
- Kanban: To Do / In Progress / Submitted / Revision / Approved / Done
- @dnd-kit/core for drag between columns (role-gated)
- Column count badges

### 9. Reports Page
- Summary stats + project table
- Per-project drill-down: submission breakdown, revision count
- Export CSV button (MVP)

---

## Implementation Order

### Step 1 – Scaffolding
1. Init `client/` with `npm create vite@latest` → React + Tailwind + shadcn/ui
2. Init `server/` with Express + Prisma + SQLite
3. Root `package.json` with `concurrently` dev script
4. `.env.example` files, `README.md`

### Step 2 – Backend Foundation
1. Prisma schema (all models)
2. Seed: admin user, 2 sample projects, sample submissions
3. JWT utils + auth controller (login, me)
4. Auth + role middleware
5. Centralized error handler + response util

### Step 3 – Backend APIs
1. Projects CRUD + members
2. Submissions CRUD + progress + submit + approve/revision
3. Checklist, Notes, Revisions
4. Attachments (Multer)
5. Activity log (auto-created in controllers)
6. Reports endpoint

### Step 4 – Frontend Foundation
1. Tailwind config: dark mode `class`, CSS variables, Inter font
2. AuthContext + axios interceptors (auto-attach JWT, 401 redirect)
3. ThemeContext + toggle
4. React Router v6 layout (protected routes)
5. App Shell (Sidebar + TopBar)

### Step 5 – Frontend Pages
1. Login Page
2. Dashboard Page (stats, chart, attention list)
3. Project List Page (table, filters)
4. Project Detail Page + Card Grid
5. Submission Detail Slide-over (all tabs)
6. Board View (Kanban)
7. Reports Page

### Step 6 – Polish
1. Role-based UI visibility (hide/disable by role)
2. Toast notifications (Sonner or shadcn Toast)
3. Loading skeletons on data fetch
4. Empty states with illustration/icon
5. Responsive tweaks (mobile nav drawer)
6. Theme refinement pass

---

## Environment Variables

**server/.env.example**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret"
JWT_EXPIRES_IN="7d"
PORT=3001
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="./uploads"
```

**client/.env.example**
```
VITE_API_URL="http://localhost:3001/api"
```

---

## Out of Scope (MVP)

- Real-time collaboration / WebSockets
- Email / WhatsApp notifications
- Mobile native app
- Gantt chart
- Calendar view
- PDF export
- AI features
- Client tracking module
- Multi-company enterprise setup
