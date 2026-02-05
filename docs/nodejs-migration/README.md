# SIMRS ZEN - Node.js/Express Migration Guide

## 📋 Overview

Panduan lengkap untuk migrasi backend SIMRS ZEN dari Lovable Cloud ke Node.js/Express dengan PostgreSQL.

## 🏗️ Struktur Folder

```
simrs-zen-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection
│   │   ├── auth.js           # JWT configuration
│   │   └── cors.js           # CORS settings
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── patients.routes.js
│   │   ├── visits.routes.js
│   │   ├── billing.routes.js
│   │   └── ... (all modules)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── patients.controller.js
│   │   └── ...
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── bpjs-vclaim.service.js
│   │   ├── bpjs-antrean.service.js
│   │   ├── satusehat.service.js
│   │   └── ...
│   ├── models/
│   │   └── index.js          # Prisma/Sequelize models
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   ├── hash.utils.js
│   │   └── generators.js
│   ├── socket/
│   │   ├── index.js
│   │   └── handlers/
│   │       ├── chat.handler.js
│   │       ├── notification.handler.js
│   │       └── queue.handler.js
│   └── app.js
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
└── docker-compose.yml
```

## 🚀 Quick Start

```bash
# 1. Clone & Install
git clone <your-repo>
cd simrs-zen-backend
npm install

# 2. Setup Environment
cp .env.example .env
# Edit .env dengan credentials Anda

# 3. Setup Database
npx prisma migrate dev

# 4. Run Development
npm run dev

# 5. Run Production
npm run build
npm start
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "prisma": "^5.10.0",
    "@prisma/client": "^5.10.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.7.4",
    "axios": "^1.6.7",
    "zod": "^3.22.4",
    "dotenv": "^16.4.5",
    "winston": "^3.11.0",
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.3",
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21"
  }
}
```

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/simrs_zen

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# BPJS Integration
BPJS_CONS_ID=your-cons-id
BPJS_SECRET_KEY=your-secret-key
BPJS_USER_KEY=your-user-key
BPJS_BASE_URL=https://apijkn.bpjs-kesehatan.go.id

# SATU SEHAT
SATU_SEHAT_CLIENT_ID=your-client-id
SATU_SEHAT_CLIENT_SECRET=your-client-secret
SATU_SEHAT_ORG_ID=your-org-id
SATU_SEHAT_ENV=sandbox

# Redis (for session/rate limiting)
REDIS_URL=redis://localhost:6379
```

## 📊 API Endpoints Overview

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | `/api/auth/*` | Partial |
| Patients | `/api/patients/*` | Yes |
| Visits | `/api/visits/*` | Yes |
| Medical Records | `/api/medical-records/*` | Yes |
| Pharmacy | `/api/pharmacy/*` | Yes |
| Laboratory | `/api/lab/*` | Yes |
| Billing | `/api/billing/*` | Yes |
| BPJS | `/api/bpjs/*` | Yes |
| SATU SEHAT | `/api/satusehat/*` | Yes |

## 🔄 Migration Checklist

- [ ] Export PostgreSQL schema dari Lovable Cloud
- [ ] Setup VPS dengan Node.js 20+ dan PostgreSQL 15+
- [ ] Import schema ke database baru
- [ ] Migrate data (jika diperlukan)
- [ ] Deploy backend dengan PM2/Docker
- [ ] Update frontend API base URL
- [ ] Test semua endpoints
- [ ] Setup SSL/HTTPS
- [ ] Configure firewall
- [ ] Setup monitoring (PM2/Grafana)
