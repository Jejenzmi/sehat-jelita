# SECURITY.md - Panduan Keamanan SIMRS ZEN

## Ringkasan Kontrol Keamanan

### Backend

| Kontrol | Status | Keterangan |
|---------|--------|------------|
| Helmet.js security headers | ✅ | CSP, X-Frame-Options, dll. |
| Rate limiting | ✅ | 100 req/15 min umum, 5 req/15 min auth |
| JWT authentication | ✅ | Access + refresh token |
| Password hashing | ✅ | bcryptjs |
| Input validation | ✅ | Zod schema validation |
| SQL injection protection | ✅ | Prisma ORM (parameterized queries) |
| CORS policy | ✅ | Whitelist FRONTEND_URL saja |
| Error message sanitization | ✅ | Pesan generik di production |

### Frontend

| Kontrol | Status | Keterangan |
|---------|--------|------------|
| Protected routes | ✅ | JWT check sebelum render |
| Error boundary | ✅ | Tidak expose stack trace di production |
| HTTPS (production) | ✅ | Via nginx + SSL |

---

## Praktik Terbaik Production

### 1. Secrets Management

```bash
# JANGAN simpan secret di kode atau repository
# Gunakan environment variables atau secret manager

# Generate JWT secret yang aman
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate password database yang aman
openssl rand -base64 32
```

### 2. Konfigurasi Database

```sql
-- Buat user database dengan privilege minimal
CREATE USER simrs_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE simrs_zen TO simrs_app;
GRANT USAGE ON SCHEMA public TO simrs_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO simrs_app;
```

### 3. Firewall

```bash
# Hanya buka port yang diperlukan
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp   # PostgreSQL (internal only)
ufw deny 6379/tcp   # Redis (internal only)
ufw deny 3000/tcp   # Backend API (internal only)
ufw enable
```

### 4. SSL/TLS

- Gunakan TLS 1.2+ saja
- Konfigurasi Let's Encrypt dengan auto-renewal
- Redirect semua HTTP ke HTTPS

### 5. Update Berkala

```bash
# Update dependencies secara rutin
npm audit
npm audit fix

# Update base Docker images
docker compose -f docker-compose.prod.yml pull
```

---

## Respons Insiden

1. **Deteksi**: Monitor logs dengan `docker compose logs -f`
2. **Isolasi**: Stop service yang terkompromi
3. **Investigasi**: Periksa access logs nginx dan backend
4. **Recovery**: Restore dari backup jika diperlukan
5. **Dokumentasi**: Catat kronologi dan tindakan perbaikan

---

## Melaporkan Kerentanan

Jika menemukan kerentanan keamanan, laporkan secara bertanggung jawab melalui GitHub Security Advisories di repository ini. Jangan buat issue publik untuk kerentanan keamanan.
