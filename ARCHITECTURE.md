# 🏗️ Arsitektur Sistem SIMRS ZEN

Gambaran teknis komprehensif arsitektur SIMRS ZEN (Sistem Informasi Manajemen Rumah Sakit ZEN).

---

## Gambaran Umum

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet / Browser                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS :443 / HTTP :80
┌───────────────────────────▼─────────────────────────────────┐
│                  nginx (Reverse Proxy + Frontend)            │
│   - Serve React SPA (static files)                          │
│   - Proxy /api/* → API Backend :3000                        │
│   - SSL termination                                         │
│   - Gzip compression, security headers                      │
└──────────────┬────────────────────────────────┬─────────────┘
               │ /api/*                         │ WebSocket
┌──────────────▼────────────────────────────────▼─────────────┐
│                  Node.js / Express API (Port 3000)           │
│   - REST API routes (/api/v1/...)                           │
│   - Socket.IO untuk real-time notifications                 │
│   - JWT authentication & RBAC authorization                 │
│   - Rate limiting, security headers (Helmet)                │
│   - Prisma ORM                                              │
└──────────────┬────────────────────────────────┬─────────────┘
               │                                │
┌──────────────▼───────────┐    ┌───────────────▼─────────────┐
│   PostgreSQL :5432       │    │   Redis :6379                │
│   (Primary data store)   │    │   (Caching, rate limiting)  │
└──────────────────────────┘    └─────────────────────────────┘
```

---

## Stack Teknologi

### Frontend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state management & caching |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui + Radix UI | Latest | Accessible UI components |
| React Hook Form + Zod | Latest | Form validation |
| Recharts | 2.x | Charts & data visualization |
| Socket.IO Client | 4.x | Real-time WebSocket |

### Backend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js | ≥ 20 | Runtime |
| Express.js | 4.x | HTTP framework |
| Prisma | 5.x | ORM & database migrations |
| PostgreSQL | 15 | Relational database |
| Redis | 7 | Caching & session store |
| Socket.IO | 4.x | Real-time bidirectional events |
| JWT (jsonwebtoken) | 9.x | Authentication tokens |
| bcryptjs | 2.x | Password hashing |
| Helmet | 7.x | HTTP security headers |
| express-rate-limit | 7.x | Rate limiting |
| Winston | 3.x | Structured logging |
| Zod | 3.x | Input validation |

### Infrastructure
| Teknologi | Kegunaan |
|---|---|
| Docker | Container runtime |
| Docker Compose | Multi-container orchestration |
| nginx | Web server & reverse proxy |
| GitHub Actions | CI/CD pipeline |

---

## Struktur Direktori

```
sehat-jelita/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── ci.yml           # Lint, type check, build
│       ├── docker-build.yml # Docker image builds
│       └── deploy.yml       # Auto-deploy ke hosting
├── src/                    # Frontend React source
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── layout/          # AppLayout, Sidebar, dll
│   │   ├── ErrorBoundary.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level page components
│   ├── lib/                # Utilities & API client
│   └── App.tsx             # Root component & routing
├── backend/                # Node.js API source
│   ├── src/
│   │   ├── app.js           # Express app entry point
│   │   ├── config/          # Config (database, etc.)
│   │   ├── controllers/     # Route handler logic
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   └── socket/          # Socket.IO event handlers
│   └── prisma/             # Prisma schema & migrations
├── docs/                   # Extended documentation
├── docker-compose.yml      # Development stack
├── docker-compose.prod.yml # Production stack
├── Dockerfile.frontend     # Frontend Docker build
├── nginx.conf              # nginx SPA + proxy config
├── DEPLOYMENT.md           # Deployment guide
├── ENVIRONMENT.md          # Environment variables guide
├── ARCHITECTURE.md         # This file
└── SECURITY.md             # Security best practices
```

---

## API Endpoint Struktur

```
/health              → Health check (unauthenticated)
/api/auth/           → Authentication (login, register, refresh)
/api/patients/       → Manajemen pasien
/api/visits/         → Kunjungan & rawat jalan
/api/inpatient/      → Rawat inap
/api/emergency/      → IGD
/api/pharmacy/       → Farmasi
/api/lab/            → Laboratorium
/api/radiology/      → Radiologi
/api/billing/        → Billing & pembayaran
/api/bpjs/           → Integrasi BPJS
/api/satusehat/      → Integrasi SatuSehat
/api/inventory/      → Inventori
/api/hr/             → SDM
/api/accounting/     → Akuntansi
/api/icu/            → ICU
/api/surgery/        → Kamar operasi
/api/dialysis/       → Hemodialisa
/api/bloodbank/      → Bank darah
/api/nutrition/      → Gizi
/api/rehabilitation/ → Rehabilitasi
/api/mcu/            → Medical Check Up
/api/forensic/       → Forensik
/api/education/      → Pendidikan & riset
```

---

## Alur Autentikasi

```
1. POST /api/auth/login  →  {email, password}
2. Backend: bcrypt.compare(password, hash)
3. Backend: jwt.sign({userId, roles}, JWT_SECRET, {expiresIn})
4. Response: {token, refreshToken, user}
5. Frontend: simpan token di localStorage/httpOnly cookie
6. Request berikutnya: Authorization: Bearer <token>
7. Backend middleware: jwt.verify(token, JWT_SECRET)
8. Inject req.user → route handler
```

---

## Real-time Features (Socket.IO)

Events yang didukung:
- `notification:new` — Notifikasi masuk baru
- `patient:registered` — Pasien baru terdaftar
- `queue:update` — Update antrian
- `bed:status` — Perubahan status tempat tidur

---

## Data Flow

```
Browser → React Component
       → TanStack Query (cache layer)
       → api-client.ts (axios)
       → nginx /api/* proxy
       → Express route
       → Middleware (auth, rate limit, validate)
       → Controller
       → Service / Prisma
       → PostgreSQL
```
