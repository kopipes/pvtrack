# PVTrack

A project and submission tracking system for teams managing deliverables through a structured review and approval workflow.

## Features

- **Project management** — create and track projects with statuses, priorities, deadlines, and a Person In Charge (PIC)
- **Submission workflow** — deliverables move through a pipeline: `TODO → IN_PROGRESS → SUBMITTED → REVISION → RESUBMITTED → APPROVED → DONE`
- **Revision tracking** — numbered revision feedback with its own lifecycle (`OPEN → IN_PROGRESS → RESOLVED`)
- **Checklists** — per-submission task checklists with completion tracking
- **Notes** — threaded notes per submission for team communication
- **File attachments** — files uploadable at project and submission level
- **Notifications** — in-app notifications for pending revisions
- **Reports** — summary stats and per-project CSV export
- **Master data** — manage users, divisions, and client contacts
- **Role-based access** — four roles: `ADMIN`, `MANAGER`, `USER`, `VIEWER`
- **Activity log** — every action on projects and submissions is recorded
- **Dark / light theme**

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| UI primitives | Radix UI |
| Forms | React Hook Form |
| Charts | Recharts |
| Drag & drop | dnd-kit |
| HTTP client | Axios |
| Toasts | Sonner |
| Icons | Lucide React |

### Backend
| | |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | SQLite |
| Auth | JWT + bcryptjs |
| File uploads | Multer |

## Project Structure

```
pvtrack/
├── package.json          # Root scripts (runs client + server concurrently)
├── client/               # React frontend (Vite)
│   └── src/
│       ├── pages/        # Dashboard, Login, ProjectList, ProjectDetail, Report, MasterData
│       ├── components/   # Organized by domain: layout/, project/, submission/, masterdata/, ui/
│       ├── contexts/     # AuthContext, ThemeContext
│       ├── hooks/        # useProjects, useSubmissions, useNotifications
│       ├── router/       # Route definitions + protected routes
│       └── lib/          # axios instance, utility functions
└── server/               # Express backend
    ├── server.js         # Entry point
    └── src/
        ├── app.js        # Express app + route registration
        ├── controllers/  # One controller per domain (12 total)
        ├── routes/       # One route file per domain (12 total)
        ├── middleware/   # auth, role, upload
        ├── utils/        # response helpers, JWT, activityLog
        └── lib/          # Prisma singleton client
    └── prisma/
        ├── schema.prisma # Data models
        └── seed.js       # Seed script with demo accounts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install all dependencies
npm install
npm install --prefix server
npm install --prefix client

# Configure environment
cp server/.env.example server/.env   # edit JWT_SECRET at minimum
cp client/.env.example client/.env

# Set up the database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:3001`.

### Environment Variables

**`server/.env`**
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-here"
JWT_EXPIRES_IN="7d"
PORT=3001
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="./uploads"
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:3001/api
```

## Demo Accounts

After seeding, the following accounts are available (password: `password123`):

| Role | Email |
|---|---|
| Admin | admin@pvtrack.com |
| Manager | manager@pvtrack.com |
| User | alex@pvtrack.com |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both client and server |
| `npm run dev:server` | Server only (nodemon) |
| `npm run dev:client` | Client only (Vite) |
| `npm run build` | Production build of client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |

## Data Model

| Model | Purpose |
|---|---|
| `User` | App users with role and hashed password |
| `Division` | Organizational units (many-to-many with users) |
| `ClientContact` | External client records linked to projects |
| `Project` | Core entity with status, priority, deadline, PIC |
| `ProjectMember` | Team members with per-project `canCreateSubmission` flag |
| `Submission` | Deliverable within a project (0–100 progress) |
| `ChecklistItem` | Per-submission to-do items |
| `Note` | Text notes on a submission |
| `Revision` | Numbered feedback on a submission |
| `Attachment` | Files attached to a project or submission |
| `ActivityLog` | Audit trail for all actions |

## License

MIT
