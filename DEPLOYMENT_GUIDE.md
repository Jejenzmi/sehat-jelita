# SIMRS ZEN - Production Deployment Guide
**Versi:** 1.0.0  
**Tanggal:** 2026-04-14  
**Status:** ✅ READY FOR DEPLOYMENT

---

## 📋 PREREQUISITES

### System Requirements
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **RAM:** Minimum 4GB (recommended 8GB)
- **Storage:** Minimum 20GB
- **OS:** Linux (Ubuntu 20.04+), macOS, Windows (WSL2)

### Required Software
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose (if not included)
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd sehat-jelita
```

### Step 2: Remove .env.production from Git History (If Previously Committed)
```bash
# Remove from git tracking (keeps local file)
git rm --cached .env.production

# Add to .gitignore (already done)
echo ".env.production" >> .gitignore

# Commit the change
git commit -m "chore: remove .env.production from git tracking"
```

### Step 3: Configure Environment Variables
```bash
# Copy example file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required Environment Variables:**
```bash
# Database
DB_USER=simrs
DB_PASSWORD=<generate-strong-password>
DB_NAME=simrs_zen

# Redis
REDIS_PASSWORD=<generate-strong-password>

# JWT
JWT_SECRET=<generate-random-string-32-chars>

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

**Generate Secure Passwords:**
```bash
# Database password
openssl rand -base64 32

# Redis password
openssl rand -base64 32

# JWT secret
openssl rand -base64 48
```

### Step 4: Generate SSL Certificates

**Option A: Self-Signed (Development/Testing)**
```bash
chmod +x scripts/generate-ssl.sh
./scripts/generate-ssl.sh localhost
```

**Option B: Let's Encrypt (Production - Recommended)**
```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chmod 600 ./ssl/key.pem
sudo chmod 644 ./ssl/cert.pem
```

### Step 5: Build and Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh production
```

**Or Manual Deployment:**
```bash
# Build images
docker compose -f docker-compose.production.yml build

# Run migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy

# Seed database (first-run only)
docker compose -f docker-compose.production.yml run --rm api npm run db:seed

# Start services
docker compose -f docker-compose.production.yml up -d
```

### Step 6: Verify Deployment
```bash
# Check service status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Check API health
curl -k https://localhost/health

# Check frontend
curl -k https://localhost
```

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### Step 7: Initial Setup
1. Open browser: `https://your-domain.com`
2. Login with default credentials:
   - **Email:** admin@simrszen.local
   - **Password:** Admin@123!
3. Complete setup wizard:
   - Hospital name
   - Hospital code
   - Hospital type
   - Address and contact info
4. **IMPORTANT:** Change default admin password immediately!

### Step 8: Verify All Services
```bash
# Check PostgreSQL
docker compose -f docker-compose.production.yml exec postgres pg_isready -U simrs

# Check Redis
docker compose -f docker-compose.production.yml exec redis redis-cli -a <REDIS_PASSWORD> ping

# Check API
docker compose -f docker-compose.production.yml exec api curl -f http://localhost:3000/health

# Check Frontend
docker compose -f docker-compose.production.yml exec frontend curl -f http://localhost
```

### Step 9: Database Backup Setup
```bash
# Manual backup
docker compose -f docker-compose.production.yml exec api node -e "
  require('./dist/workers/report.worker.js').processReportJob({
    name: 'db-backup',
    data: {}
  })
"

# Verify backup
ls -lh ./backups/
```

---

## 📊 MONITORING & MAINTENANCE

### View Logs
```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f frontend
docker compose -f docker-compose.production.yml logs -f postgres
docker compose -f docker-compose.production.yml logs -f redis
```

### Restart Services
```bash
# All services
docker compose -f docker-compose.production.yml restart

# Specific service
docker compose -f docker-compose.production.yml restart api
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./scripts/deploy.sh production
```

### Database Maintenance
```bash
# Run migrations
./scripts/migrate.sh deploy

# Check migration status
./scripts/migrate.sh status

# Open Prisma Studio (database GUI)
./scripts/migrate.sh studio
```

---

## 🔒 SECURITY CHECKLIST

- [x] `.env.production` added to `.gitignore`
- [x] All default passwords changed
- [x] SSL certificates configured
- [x] JWT secret is cryptographically random
- [x] Database credentials are strong
- [x] Redis password is set and strong
- [x] Default admin password changed after setup
- [x] CORS configured for production domain
- [x] Rate limiting enabled
- [x] HTTPS enforced

---

## 🐛 TROUBLESHOOTING

### Issue: Services won't start
```bash
# Check Docker
docker info

# Check disk space
df -h

# Check logs
docker compose -f docker-compose.production.yml logs
```

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
docker compose -f docker-compose.production.yml ps postgres

# Check DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test connection
docker compose -f docker-compose.production.yml exec postgres pg_isready -U simrs
```

### Issue: Frontend shows blank page
```bash
# Check frontend logs
docker compose -f docker-compose.production.yml logs frontend

# Rebuild frontend
docker compose -f docker-compose.production.yml build frontend
docker compose -f docker-compose.production.yml up -d frontend

# Check nginx config
docker compose -f docker-compose.production.yml exec frontend cat /etc/nginx/conf.d/default.conf
```

### Issue: API returns 500 errors
```bash
# Check API logs
docker compose -f docker-compose.production.yml logs api

# Check database migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate status

# Run pending migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy
```

---

## 📞 SUPPORT

- **Documentation:** See `COMPREHENSIVE_END_TO_END_AUDIT_v2.md`
- **Bug Reports:** Create issue in repository
- **Emergency Contact:** PT Zen Multimedia Indonesia

---

## 📝 USEFUL COMMANDS REFERENCE

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Stop all services
docker compose -f docker-compose.production.yml down

# Rebuild all services
docker compose -f docker-compose.production.yml build --no-cache

# View service status
docker compose -f docker-compose.production.yml ps

# View service logs
docker compose -f docker-compose.production.yml logs -f [service-name]

# Execute command in container
docker compose -f docker-compose.production.yml exec [service-name] [command]

# Run database shell
docker compose -f docker-compose.production.yml exec postgres psql -U simrs -d simrs_zen

# Run Redis CLI
docker compose -f docker-compose.production.yml exec redis redis-cli -a <REDIS_PASSWORD>

# Backup database
docker compose -f docker-compose.production.yml exec api npx prisma db dump

# Restore database
docker compose -f docker-compose.production.yml exec api npx prisma db push

# Reset database (WARNING: removes all data)
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate reset
```

---

**Last Updated:** 2026-04-14  
**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY
