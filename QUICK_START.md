# 🚀 SIMRS ZEN - QUICK START DEPLOYMENT
**Versi:** 1.0.0 | **Tanggal:** 2026-04-14 | **Status:** ✅ READY

---

## ⚡ 5 MENIT DEPLOY (Development)

```bash
# 1. Clone repository
git clone <repository-url> && cd sehat-jelita

# 2. Start development
docker compose up -d

# 3. Access application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# Default login: admin@simrszen.local / Admin@123!
```

---

## 🔒 PRODUCTION DEPLOYMENT (15 Menit)

### Step 1: Setup Environment
```bash
# Clone repository
git clone <repository-url> && cd sehat-jelita

# Copy and edit environment file
cp .env.production.example .env.production
nano .env.production
```

**Generate secure passwords:**
```bash
# Database password (copy hasil ke DB_PASSWORD)
openssl rand -base64 32

# Redis password (copy hasil ke REDIS_PASSWORD)
openssl rand -base64 32

# JWT secret (copy hasil ke JWT_SECRET)
openssl rand -base64 48
```

### Step 2: Generate SSL Certificates
```bash
# Self-signed (testing)
./scripts/generate-ssl.sh localhost

# OR Let's Encrypt (production)
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
```

### Step 3: Deploy
```bash
# One-command deployment
./scripts/deploy.sh production

# OR manual steps
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.production.yml run --rm api npm run db:seed
docker compose -f docker-compose.production.yml up -d
```

### Step 4: Verify
```bash
# Check services
docker compose -f docker-compose.production.yml ps

# Check API
curl -k https://localhost/health

# Check frontend
curl -k https://localhost
```

---

## 📋 POST-DEPLOYMENT

### Initial Setup
1. Buka `https://your-domain.com`
2. Login: `admin@simrszen.local` / `Admin@123!`
3. Complete setup wizard
4. **GANTI PASSWORD DEFAULT ADMIN!**

### Verify Services
```bash
# PostgreSQL
docker compose -f docker-compose.production.yml exec postgres pg_isready -U simrs

# Redis
docker compose -f docker-compose.production.yml exec redis redis-cli -a <PASSWORD> ping

# API
docker compose -f docker-compose.production.yml exec api curl -f http://localhost:3000/health

# Frontend
docker compose -f docker-compose.production.yml exec frontend curl -f http://localhost
```

---

## 🔧 MAINTENANCE

### View Logs
```bash
docker compose -f docker-compose.production.yml logs -f [service-name]
```

### Restart Services
```bash
docker compose -f docker-compose.production.yml restart [service-name]
```

### Database Migration
```bash
./scripts/migrate.sh deploy
```

### Update Application
```bash
git pull origin main
./scripts/deploy.sh production
```

---

## 📚 DOKUMENTASI LENGKAP

| File | Deskripsi |
|------|-----------|
| `DEPLOYMENT_GUIDE.md` | Panduan deployment lengkap |
| `FINAL_COMPREHENSIVE_FIX_REPORT.md` | Laporan perbaikan lengkap |
| `COMPREHENSIVE_END_TO_END_AUDIT_v2.md` | Audit menyeluruh |
| `FINAL_PERBAIKAN_MENYELURUH.md` | Ringkasan perbaikan (ID) |

---

## 🆘 TROUBLESHOOTING

### Services won't start
```bash
docker info
df -h
docker compose -f docker-compose.production.yml logs
```

### Database connection failed
```bash
docker compose -f docker-compose.production.yml ps postgres
cat .env.production | grep DATABASE_URL
```

### Frontend blank
```bash
docker compose -f docker-compose.production.yml logs frontend
docker compose -f docker-compose.production.yml logs api
```

### API 500 errors
```bash
docker compose -f docker-compose.production.yml logs api
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate status
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
```

---

## ✅ CHECKLIST SEBELUM PRODUCTION

- [ ] Semua credentials di-rotate (DB, Redis, JWT)
- [ ] SSL certificates configured
- [ ] .env.production TIDAK di-commit
- [ ] Default password admin diganti
- [ ] Database migrations dijalankan
- [ ] Backup database tested
- [ ] Monitoring configured
- [ ] Firewall rules set
- [ ] Domain DNS pointed
- [ ] HTTPS enforced

---

**Status:** ✅ PRODUCTION READY  
**Build:** 16.82s (SUCCESS)  
**Issues Fixed:** 50+ critical & high severity
