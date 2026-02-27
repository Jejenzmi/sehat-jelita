# DEPLOYMENT.md - Panduan Deployment SIMRS ZEN

## Prasyarat

- Docker >= 24 & Docker Compose >= 2.20
- Domain dengan DNS yang sudah dikonfigurasi
- SSL certificate (Let's Encrypt direkomendasikan)
- Server: minimum 2 CPU, 4 GB RAM, 20 GB disk

---

## 1. Clone Repository & Konfigurasi

```bash
git clone https://github.com/Jejenzmi/sehat-jelita.git
cd sehat-jelita

# Buat file environment dari contoh
cp .env.production.example .env
```

Edit `.env` dan **isi semua nilai** (terutama password dan JWT secret):

```bash
nano .env
```

Generate JWT secret yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 2. Build & Start Containers

```bash
# Build images dari source
docker compose -f docker-compose.prod.yml build

# Atau pull dari registry (setelah CI/CD push)
docker compose -f docker-compose.prod.yml pull

# Start semua services
docker compose -f docker-compose.prod.yml up -d
```

---

## 3. Migrasi Database

Setelah containers berjalan, jalankan migrasi Prisma:

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

Opsional - seed data awal:

```bash
docker compose -f docker-compose.prod.yml exec api node src/scripts/seed.js
```

---

## 4. SSL/HTTPS Setup (Let's Encrypt)

```bash
# Install certbot
apt install -y certbot

# Generate certificate
certbot certonly --standalone -d yourdomain.com

# Copy ke direktori ssl/
mkdir -p ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

Update `nginx.conf` untuk menambah blok HTTPS dan redirect HTTP→HTTPS.

Auto-renew:

```bash
echo "0 12 * * * root certbot renew --quiet && docker compose -f /opt/sehat-jelita/docker-compose.prod.yml restart frontend" >> /etc/cron.d/certbot-renew
# Replace /opt/sehat-jelita with your actual deployment directory
```

---

## 5. Verifikasi Deployment

```bash
# Cek status semua services
docker compose -f docker-compose.prod.yml ps

# Cek logs
docker compose -f docker-compose.prod.yml logs -f

# Test health endpoint
curl https://yourdomain.com/api/health
```

---

## 6. Update / Re-deploy

```bash
# Pull image terbaru
docker compose -f docker-compose.prod.yml pull

# Restart dengan zero-downtime (rolling update)
docker compose -f docker-compose.prod.yml up -d --no-deps --build api
docker compose -f docker-compose.prod.yml up -d --no-deps --build frontend

# Jalankan migrasi jika ada perubahan schema
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

## 7. Backup Database

```bash
# Backup manual
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $DB_USER $DB_NAME < backup_file.sql
```

Jadwalkan backup otomatis dengan cron:

```bash
echo "0 2 * * * cd /opt/sehat-jelita && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U \$DB_USER \$DB_NAME > /backups/simrs_\$(date +\%Y\%m\%d).sql" >> /etc/cron.d/simrs-backup
# Replace /opt/sehat-jelita with your actual deployment directory and /backups with your backup directory
```

---

## 8. Monitoring

```bash
# Resource usage
docker stats

# Logs real-time
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart service yang bermasalah
docker compose -f docker-compose.prod.yml restart api
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| API tidak merespons | `docker compose logs api` untuk melihat error |
| Database connection failed | Periksa `DATABASE_URL` di `.env` |
| Frontend blank | `docker compose logs frontend` dan periksa nginx config |
| JWT error | Pastikan `JWT_SECRET` sama antara restart |
