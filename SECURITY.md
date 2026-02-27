# 🔒 Panduan Keamanan SIMRS ZEN

Dokumentasi praktik keamanan dan konfigurasi yang diterapkan di SIMRS ZEN.

---

## Security Headers (Helmet.js)

Backend menggunakan Helmet.js untuk mengatur HTTP security headers:

| Header | Nilai | Tujuan |
|---|---|---|
| `Content-Security-Policy` | Restricted directives | Mencegah XSS |
| `X-Frame-Options` | `SAMEORIGIN` | Mencegah clickjacking |
| `X-Content-Type-Options` | `nosniff` | Mencegah MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Kontrol referrer info |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS (production) |

---

## Autentikasi & Otorisasi

### JWT Token
- Token di-sign dengan `JWT_SECRET` (minimal 64 karakter, random)
- Access token masa berlaku: **7 hari** (dapat dikonfigurasi)
- Refresh token masa berlaku: **30 hari**
- Algoritma default: `HS256`

### Password Hashing
- Menggunakan `bcryptjs` dengan **salt rounds = 12**
- Plain text password **tidak pernah** disimpan atau di-log

### RBAC (Role-Based Access Control)
Roles yang didefinisikan:
`admin`, `dokter`, `perawat`, `kasir`, `farmasi`, `laboratorium`, `radiologi`, `pendaftaran`, `keuangan`, `gizi`, `icu`, `bedah`, `rehabilitasi`, `mcu`, `forensik`, `cssd`, `manajemen`, `bank_darah`

- Role `admin` memiliki akses ke semua resource
- Setiap endpoint dilindungi middleware `roleMiddleware`

---

## Rate Limiting

| Limiter | Max Requests | Window |
|---|---|---|
| General API | 100 req | 15 menit |
| Auth (login/register) | 5 req | 15 menit |
| External API (BPJS, SatuSehat) | 30 req | 1 menit |
| File Upload | 10 req | 1 jam |
| Report Generation | 5 req | 1 jam |

---

## CORS Configuration

- Origin diwhitelist sesuai `FRONTEND_URL` environment variable
- Di production, pastikan `FRONTEND_URL` diset ke domain yang benar
- Credentials diizinkan untuk cookie-based auth
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

---

## Validasi Input

- Backend menggunakan **Zod** untuk validasi semua input request body
- Prisma ORM mencegah SQL injection secara native
- File upload dibatasi ukuran (`10mb`) dan tipe file

---

## Database Security

- PostgreSQL menggunakan user dedicated (bukan `postgres` superuser)
- Password database minimal 32 karakter random di production
- Database tidak expose port ke public (hanya internal Docker network)
- Backup terenkripsi direkomendasikan untuk production

---

## Checklist Security Production

### Konfigurasi
- [ ] `JWT_SECRET` diset dengan nilai random ≥ 64 karakter
- [ ] `DB_PASSWORD` diset dengan nilai kuat ≥ 32 karakter
- [ ] `REDIS_PASSWORD` diset untuk instance Redis production
- [ ] `NODE_ENV=production` diset
- [ ] HTTPS/SSL aktif (nginx dengan Certbot)
- [ ] File `.env` tidak ada di repository

### Network
- [ ] Database port (5432) tidak expose ke internet
- [ ] Redis port (6379) tidak expose ke internet
- [ ] API port (3000) hanya diakses melalui nginx
- [ ] Firewall: hanya port 80 dan 443 yang terbuka

### Deployment
- [ ] Docker images menggunakan base image resmi dan up-to-date
- [ ] Container berjalan sebagai non-root user
- [ ] Volume mounts menggunakan `:ro` (read-only) untuk config files

### Monitoring
- [ ] Log level: `info` di production (bukan `debug`)
- [ ] Log tidak mengandung password, token, atau data sensitif
- [ ] Alert untuk failed login attempts yang berulang

---

## Melaporkan Vulnerability

Jika menemukan vulnerability keamanan, harap laporkan secara bertanggung jawab melalui:
- GitHub Security Advisories: https://github.com/Jejenzmi/sehat-jelita/security/advisories/new (jangan buat public issue)

Informasikan:
1. Deskripsi vulnerability
2. Langkah reproduksi
3. Dampak potensial
4. Saran mitigasi (jika ada)

---

## Dependensi & Audit

```bash
# Audit npm dependencies
npm audit

# Backend
cd backend && npm audit

# Update dependencies dengan patch fixes
npm audit fix
```

Jalankan audit secara berkala dan update dependensi yang memiliki vulnerability kritis.
