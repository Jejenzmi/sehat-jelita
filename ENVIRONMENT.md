# 🔐 Panduan Environment Variables SIMRS ZEN

Daftar lengkap semua environment variables yang digunakan SIMRS ZEN beserta penjelasan dan contoh nilai.

---

## Backend (`backend/.env`)

### Wajib (Required)

| Variabel | Contoh | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `postgresql://simrs:pass@localhost:5432/simrs_zen` | Connection string PostgreSQL |
| `JWT_SECRET` | *(64+ karakter random)* | Secret key untuk signing JWT token |

### Opsional dengan Default

| Variabel | Default | Deskripsi |
|---|---|---|
| `NODE_ENV` | `development` | Mode aplikasi: `development` / `production` |
| `PORT` | `3000` | Port HTTP server |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku access token |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Masa berlaku refresh token |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend untuk CORS whitelist |
| `REDIS_URL` | *(tidak wajib)* | URL Redis untuk caching (opsional) |

### Integrasi Eksternal (Opsional)

| Variabel | Deskripsi |
|---|---|
| `BPJS_CONS_ID` | Consumer ID dari portal BPJS Kesehatan |
| `BPJS_SECRET_KEY` | Secret Key BPJS |
| `BPJS_USER_KEY` | User Key BPJS |
| `BPJS_BASE_URL` | Base URL API BPJS (default: production URL) |
| `SATUSEHAT_CLIENT_ID` | Client ID dari Platform SatuSehat |
| `SATUSEHAT_CLIENT_SECRET` | Client Secret SatuSehat |
| `SATUSEHAT_ORGANIZATION_ID` | ID Organisasi Fasilitas Kesehatan di SatuSehat |

---

## Frontend (`/.env`)

| Variabel | Contoh | Deskripsi |
|---|---|---|
| `VITE_API_MODE` | `nodejs` | Mode API: `nodejs` untuk backend Express |
| `VITE_API_URL` | `/api` | Base URL API (proxy nginx di production, `http://localhost:3000/api` untuk dev langsung) |

---

## Cara Generate Secret yang Aman

```bash
# JWT Secret (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Secret (OpenSSL)
openssl rand -hex 64

# Database Password
openssl rand -base64 32
```

---

## Docker Compose Variables

Digunakan di `docker-compose.yml` dan `docker-compose.prod.yml`:

| Variabel | Default (Dev) | Deskripsi |
|---|---|---|
| `DB_USER` | `simrs` | Username PostgreSQL |
| `DB_PASSWORD` | `simrs2024` | Password PostgreSQL (wajib diganti di production!) |
| `DB_NAME` | `simrs_zen` | Nama database |
| `REDIS_PASSWORD` | *(kosong di dev)* | Password Redis (wajib di production) |
| `JWT_SECRET` | `change-this-secret-in-production` | JWT secret (WAJIB diganti!) |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend untuk CORS |
| `REGISTRY` | `ghcr.io` | Docker image registry |
| `IMAGE_NAMESPACE` | `jejenzmi/sehat-jelita` | Namespace image di registry |
| `IMAGE_TAG` | `latest` | Tag versi image |

---

## Checklist Sebelum Deploy Production

- [ ] `DB_PASSWORD` sudah diganti (bukan nilai default)
- [ ] `REDIS_PASSWORD` sudah diset
- [ ] `JWT_SECRET` minimal 64 karakter random (bukan nilai default)
- [ ] `FRONTEND_URL` sudah diset ke domain production
- [ ] `NODE_ENV=production` sudah diset
- [ ] File `.env` **tidak** dicommit ke Git
- [ ] BPJS credentials sudah diisi (jika menggunakan integrasi BPJS)
- [ ] SatuSehat credentials sudah diisi (jika menggunakan integrasi SatuSehat)

---

## File .env untuk Berbagai Environment

```
.env                    → Development lokal (di .gitignore)
.env.example            → Template untuk development
.env.production.example → Template untuk production
```

> ⚠️ **PENTING**: Jangan pernah commit file `.env` yang berisi nilai nyata ke repository!
