# 🚀 Panduan Deployment SIMRS ZEN

Panduan lengkap untuk men-deploy SIMRS ZEN ke lingkungan production menggunakan Docker dan VPS/Cloud.

---

## Prasyarat

- VPS/Server dengan RAM minimal 2 GB, disk 20 GB
- Docker ≥ 24.x dan Docker Compose v2
- Domain name dengan DNS A record yang sudah diarahkan ke IP server
- SSL certificate (Let's Encrypt / Certbot direkomendasikan)

---

## 1. Persiapan Server

```bash
# Update paket
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker compose version
```

---

## 2. Clone & Konfigurasi

```bash
git clone https://github.com/Jejenzmi/sehat-jelita.git
cd sehat-jelita

# Salin template environment production
cp .env.production.example .env

# Edit .env dengan nilai production yang sesungguhnya
nano .env
```

**Variabel wajib diisi di `.env`:**

| Variabel | Deskripsi |
|---|---|
| `DB_PASSWORD` | Password PostgreSQL yang kuat (≥ 32 karakter) |
| `REDIS_PASSWORD` | Password Redis yang kuat |
| `JWT_SECRET` | Secret JWT acak ≥ 64 karakter |
| `FRONTEND_URL` | URL frontend production, cth: `https://yourdomain.com` |

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot -y

# Dapatkan certificate (non-interactive)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com \
  --email admin@yourdomain.com --agree-tos --non-interactive

# Salin ke folder ssl
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

---

## 4. Build & Deploy

### Opsi A: Build di server (sederhana)

```bash
# Build frontend image
docker build -t simrs-zen-frontend:latest \
  --build-arg VITE_API_MODE=nodejs \
  --build-arg VITE_API_URL=/api \
  -f Dockerfile.frontend .

# Build backend image
docker build -t simrs-zen-api:latest ./backend

# Jalankan semua services
docker compose -f docker-compose.prod.yml up -d
```

### Opsi B: Gunakan image dari Docker Hub (tanpa login)

Image di Docker Hub berstatus **public** dan dapat di-pull tanpa autentikasi.
Workflow CI/CD (`docker-build.yml`) secara otomatis mendorong image ke Docker Hub
setelah setiap push ke `main`, asalkan secrets **`DOCKERHUB_USERNAME`** dan **`DOCKERHUB_TOKEN`** tersedia:

1. Buat Access Token di Docker Hub → Account Settings → Security → New Access Token.
2. Tambahkan sebagai secrets di repository:
   - `DOCKERHUB_USERNAME` — username Docker Hub Anda
   - `DOCKERHUB_TOKEN` — token yang dibuat di langkah 1
   Settings → Secrets and variables → Actions → New repository secret.

```bash
# Jalankan langsung dari Docker Hub (tidak perlu login)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Opsi C: Gunakan image dari GitHub Container Registry (GHCR)

Image GHCR harus berstatus **public** agar VPS dapat menariknya tanpa login.
Workflow CI/CD juga mendorong image ke GHCR sebagai backup.
Ubah visibility secara manual:
GitHub → Profile → Packages → pilih paket → Package Settings → Change visibility → Public.
Atau tambahkan secret **`GH_PAT`** (PAT dengan scope `write:packages`) agar workflow mengubahnya otomatis.

```bash
# Set REGISTRY ke GHCR dan sesuaikan IMAGE_NAMESPACE di .env
REGISTRY=ghcr.io IMAGE_NAMESPACE=jejenzmi/sehat-jelita docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Migrasi Database

```bash
# Jalankan migrations Prisma
docker compose -f docker-compose.prod.yml exec api npm run db:migrate

# (Opsional) Seed data awal
docker compose -f docker-compose.prod.yml exec api npm run db:seed
```

---

## 6. Verifikasi Deployment

```bash
# Cek status containers
docker compose -f docker-compose.prod.yml ps

# Health check API
curl https://yourdomain.com/api/health

# Lihat logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 7. Update Aplikasi

```bash
# Pull perubahan terbaru
git pull origin main

# Rebuild image yang berubah
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml build frontend

# Restart dengan zero-downtime (rolling)
docker compose -f docker-compose.prod.yml up -d --no-deps api
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# Jalankan migrations baru (jika ada)
docker compose -f docker-compose.prod.yml exec api npm run db:migrate
```

---

## 8. Backup & Restore Database

### Backup

```bash
# Backup otomatis dengan timestamp
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER $DB_NAME | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore

```bash
# Restore dari file backup
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $DB_USER $DB_NAME
```

### Backup Otomatis (Cron)

```bash
# Tambahkan ke crontab: crontab -e
# Backup setiap hari jam 02:00
0 2 * * * cd /path/to/sehat-jelita && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U simrs simrs_zen | gzip > /backup/simrs_zen_$(date +\%Y\%m\%d).sql.gz
```

---

## 9. Monitoring

```bash
# Lihat resource usage
docker stats

# Lihat logs real-time
docker compose -f docker-compose.prod.yml logs -f api

# Masuk ke container untuk debug
docker compose -f docker-compose.prod.yml exec api sh
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Container API tidak start | Cek `docker logs simrs-zen-api` - biasanya masalah DATABASE_URL atau JWT_SECRET |
| Database tidak terhubung | Pastikan postgres service sudah healthy: `docker compose ps` |
| Frontend tidak bisa akses API | Pastikan nginx.conf proxy ke `api:3000` dan API container berjalan |
| SSL error | Pastikan file `ssl/cert.pem` dan `ssl/key.pem` ada dan readable |
