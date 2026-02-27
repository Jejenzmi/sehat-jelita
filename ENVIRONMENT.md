# ENVIRONMENT.md - Daftar Environment Variables

## Frontend (Vite)

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `VITE_API_MODE` | Ya | `nodejs` | Mode API: `nodejs` |
| `VITE_API_URL` | Ya | `/api` | Base URL untuk API calls |

## Backend (Node.js)

### Database

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | **Ya** | PostgreSQL connection string |
| `DB_USER` | Ya | Username database |
| `DB_PASSWORD` | **Ya** | Password database (gunakan yang kuat) |
| `DB_NAME` | Ya | Nama database |

### Redis

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `REDIS_URL` | Tidak | Redis connection URL (opsional) |
| `REDIS_PASSWORD` | Tidak | Password Redis (wajib di production) |

### Autentikasi

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `JWT_SECRET` | **Ya** | Secret key JWT - min 64 karakter random |
| `JWT_EXPIRES_IN` | Tidak | Masa berlaku access token (default: `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | Tidak | Masa berlaku refresh token (default: `30d`) |

### Server

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `NODE_ENV` | Tidak | `development` | Set ke `production` di produksi |
| `PORT` | Tidak | `3000` | Port server backend |
| `FRONTEND_URL` | Ya | - | URL frontend untuk CORS |

### Integrasi BPJS (Opsional)

| Variable | Keterangan |
|----------|------------|
| `BPJS_CONS_ID` | Consumer ID dari BPJS Kesehatan |
| `BPJS_SECRET_KEY` | Secret Key dari BPJS Kesehatan |
| `BPJS_USER_KEY` | User Key dari BPJS Kesehatan |
| `BPJS_BASE_URL` | Base URL API BPJS |

### Integrasi SatuSehat (Opsional)

| Variable | Keterangan |
|----------|------------|
| `SATUSEHAT_CLIENT_ID` | Client ID dari Kemenkes |
| `SATUSEHAT_CLIENT_SECRET` | Client Secret dari Kemenkes |
| `SATUSEHAT_ORGANIZATION_ID` | Organization ID fasilitas kesehatan |
| `SATUSEHAT_BASE_URL` | Base URL API SatuSehat |

---

## Checklist Sebelum Deploy ke Production

- [ ] `DATABASE_URL` diisi dengan connection string yang valid
- [ ] `JWT_SECRET` minimal 64 karakter dan dibuat secara random
- [ ] `DB_PASSWORD` bukan password default
- [ ] `REDIS_PASSWORD` diisi (jika Redis digunakan)
- [ ] `NODE_ENV=production` sudah diset
- [ ] `FRONTEND_URL` diisi dengan URL produksi
- [ ] File `.env` **tidak** di-commit ke repository
- [ ] Backup `.env` disimpan di tempat yang aman
