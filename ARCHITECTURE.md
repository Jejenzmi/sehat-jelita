# ARCHITECTURE.md - Arsitektur Sistem SIMRS ZEN

## Gambaran Umum

SIMRS ZEN adalah Sistem Informasi Manajemen Rumah Sakit berbasis web yang terdiri dari:

- **Frontend**: React + Vite SPA (TypeScript)
- **Backend**: Node.js/Express REST API
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis (rate limiting, sesi)
- **Realtime**: Socket.IO

---

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                    Browser / Client                 │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (80/443)
┌────────────────────▼────────────────────────────────┐
│              nginx (Reverse Proxy)                  │
│   /          → React SPA (static files)             │
│   /api/*     → Backend API (proxy)                  │
│   /socket.io → Socket.IO (proxy)                    │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
┌──────────▼──────────┐  ┌───────▼──────────────────┐
│   React Frontend    │  │   Node.js/Express API     │
│   (port 80)         │  │   (port 3000)             │
│                     │  │                           │
│  - React Router v6  │  │  - REST endpoints /api/*  │
│  - React Query      │  │  - JWT authentication     │
│  - Radix UI         │  │  - Socket.IO server       │
│  - Tailwind CSS     │  │  - Rate limiting          │
└─────────────────────┘  └──────────┬────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼──────────┐    ┌──────────────▼─────┐
         │     PostgreSQL      │    │        Redis        │
         │   (port 5432)       │    │    (port 6379)      │
         │                     │    │                     │
         │  - Prisma ORM       │    │  - Rate limiting    │
         │  - Migrations       │    │  - Session cache    │
         └─────────────────────┘    └────────────────────┘
```

---

## Struktur Direktori

```
sehat-jelita/
├── src/                    # Frontend React source
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components (50+ modules)
│   ├── lib/                # Utilities
│   └── App.tsx             # Root component & routing
│
├── backend/                # Backend Node.js/Express
│   └── src/
│       ├── app.js          # Entry point
│       ├── controllers/    # Request handlers
│       ├── middleware/     # Auth, rate limit, error handling
│       ├── routes/         # API route definitions
│       ├── services/       # Business logic
│       └── prisma/         # Database schema & migrations
│
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Development stack
├── docker-compose.prod.yml # Production stack
├── Dockerfile.frontend     # Frontend Docker image
├── backend/Dockerfile      # Backend Docker image
└── nginx.conf              # nginx configuration
```

---

## Modul Fungsional

| Modul | Rute | Keterangan |
|-------|------|------------|
| Pendaftaran | `/pendaftaran` | Registrasi pasien & antrian |
| Rawat Jalan | `/rawat-jalan` | Poliklinik & konsultasi |
| Rawat Inap | `/rawat-inap` | Manajemen kamar & perawatan |
| IGD | `/igd` | Instalasi Gawat Darurat |
| Farmasi | `/farmasi` | Resep & stok obat |
| Laboratorium | `/laboratorium` | Pemeriksaan lab |
| Radiologi | `/radiologi` | Pemeriksaan radiologi & DICOM |
| Billing | `/billing` | Tagihan & pembayaran |
| BPJS | `/bpjs` | Integrasi BPJS Kesehatan |
| SatuSehat | `/satu-sehat` | Integrasi platform Kemenkes |
| Rekam Medis | `/rekam-medis` | Electronic Health Records |
| Laporan | `/laporan` | Pelaporan & analitik |

---

## Alur Autentikasi

```
1. User POST /api/auth/login (username + password)
2. Backend verifikasi bcrypt hash
3. Backend return JWT access token + refresh token
4. Frontend simpan token di localStorage
5. Setiap request berikutnya: Authorization: Bearer <token>
6. Backend middleware validasi JWT di setiap protected endpoint
7. Token expired → frontend kirim refresh token ke /api/auth/refresh
```

---

## Teknologi Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Frontend Framework | React | 18 |
| Build Tool | Vite | 5 |
| UI Components | Radix UI + Tailwind CSS | - |
| State Management | React Query (TanStack) | 5 |
| Form Handling | React Hook Form + Zod | - |
| Backend Framework | Express.js | 4 |
| ORM | Prisma | 5 |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7 |
| Realtime | Socket.IO | 4 |
| Container | Docker + nginx | - |
| CI/CD | GitHub Actions | - |
