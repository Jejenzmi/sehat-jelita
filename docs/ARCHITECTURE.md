# Architecture Overview - SIMRS ZEN

## System Components

```
┌─────────────────────────────────────────────────┐
│                  User / Browser                 │
└────────────────────────┬────────────────────────┘
                         │ HTTPS (port 80/443)
┌────────────────────────▼────────────────────────┐
│           Frontend (React + Vite)               │
│           served via nginx container            │
│  - React Router (SPA)                           │
│  - React Query (server state)                   │
│  - Tailwind CSS + shadcn/ui                     │
└────────────────────────┬────────────────────────┘
                         │ /api/* (proxied by nginx)
┌────────────────────────▼────────────────────────┐
│           Backend API (Node.js + Express)       │
│           port 3000                             │
│  - REST API routes (/api/v1/*)                  │
│  - Socket.IO for real-time features             │
│  - JWT authentication                           │
│  - Helmet + CORS + Rate limiting                │
└──────────┬──────────────────────┬───────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼──────────────┐
│  PostgreSQL 15      │  │  Redis 7               │
│  (primary data)     │  │  (cache, rate limits,  │
│                     │  │   sessions)            │
└─────────────────────┘  └───────────────────────┘
```

## Directory Structure

```
sehat-jelita/
├── .github/
│   └── workflows/         # CI/CD pipelines
│       ├── ci.yml         # Lint, build & test on every PR
│       ├── docker-build.yml
│       └── deploy.yml     # FTP deploy to hosting on push to main
├── backend/
│   ├── src/
│   │   ├── app.js         # Express entry point
│   │   ├── config/        # DB, env validation
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, error, rate-limit, logging
│   │   ├── routes/        # Express router definitions
│   │   ├── services/      # Business logic
│   │   └── socket/        # Socket.IO handlers
│   ├── prisma/            # DB schema & migrations
│   ├── database/          # Raw SQL schema
│   └── Dockerfile
├── src/                   # React frontend
│   ├── components/        # Reusable UI components (shadcn + custom)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route-level page components
│   ├── integrations/      # API client helpers
│   └── App.tsx
├── docs/                  # Documentation
├── public/
├── docker-compose.yml     # Local development
├── docker-compose.prod.yml # Production
├── Dockerfile.frontend
└── nginx.conf
```

## Data Flow

1. **Authentication**: Browser → POST `/api/auth/login` → JWT returned → stored in `localStorage` / HTTP-only cookie.
2. **Authenticated requests**: `Authorization: Bearer <token>` header validated by `authenticateToken` middleware.
3. **Real-time**: Socket.IO over the same HTTP port; clients subscribe to rooms by module (e.g., `antrian`, `igd`).
4. **BPJS / Satu Sehat**: Backend calls external government APIs via `services/bpjs.js` and `services/satusehat.js`; credentials never exposed to the frontend.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite + SWC |
| UI library | shadcn/ui + Tailwind CSS |
| State management | TanStack React Query |
| Routing | React Router v6 |
| Backend framework | Node.js 20 + Express 4 |
| Database ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Cache / sessions | Redis 7 |
| Real-time | Socket.IO 4 |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
