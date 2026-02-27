# Panduan Instalasi SIMRS ZEN di Hostinger Cloud (VPS)

## 📋 Persyaratan

Hostinger Cloud VPS yang direkomendasikan:
- **Plan**: Cloud Startup (atau lebih tinggi)
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimal 4 GB (disarankan 8 GB)
- **Storage**: Minimal 40 GB SSD

---

## 🚀 Langkah 1: Akses Server via SSH

1. Login ke panel Hostinger → **VPS** → pilih server Anda → **SSH Access**
2. Salin IP dan port SSH, lalu jalankan di terminal:

```bash
ssh root@YOUR_VPS_IP
```

Update sistem:

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano unzip ufw
```

---

## 🐳 Langkah 2: Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Tambahkan user saat ini ke group docker
usermod -aG docker $USER

# Verifikasi
docker --version
docker compose version
```

---

## 📁 Langkah 3: Clone Repository

```bash
cd /opt
mkdir -p simrs-zen && cd simrs-zen

# Clone repositori
git clone https://github.com/Jejenzmi/sehat-jelita.git .
```

---

## ⚙️ Langkah 4: Konfigurasi Environment

### 4.1 Frontend (.env)

```bash
cp .env.example .env
nano .env
```

Isi dengan nilai berikut:

```env
# Mode API: gunakan nodejs untuk database lokal
VITE_API_MODE=nodejs
# Contoh: VITE_API_URL=https://simrs.example.com/api
VITE_API_URL=https://YOUR_DOMAIN/api
```

### 4.2 Backend (backend/.env)

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Isi dengan nilai berikut (ganti semua `YOUR_*` dengan nilai nyata):

```env
NODE_ENV=production
PORT=3000

# Database
DB_USER=simrs
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
DB_NAME=simrs_zen
DATABASE_URL=postgresql://simrs:YOUR_SECURE_DB_PASSWORD@postgres:5432/simrs_zen

# JWT (minimal 32 karakter, gunakan password generator)
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARS
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD
REDIS_URL=redis://:YOUR_SECURE_REDIS_PASSWORD@redis:6379
# Pastikan nilai REDIS_PASSWORD di atas sama persis di kedua variabel

# URL frontend (untuk CORS)
FRONTEND_URL=https://YOUR_DOMAIN
```

---

## 🔥 Langkah 5: Konfigurasi Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

ufw status
```

---

## 🐘 Langkah 6: Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua service
docker compose up -d --build

# Cek status
docker compose ps

# Lihat log
docker compose logs -f
```

> **Catatan**: Proses build pertama kali memakan waktu 5–10 menit.

### Jalankan Migrasi Database

Setelah semua container berjalan:

```bash
docker compose exec api npx prisma migrate deploy
```

---

## 🌐 Langkah 7: Setup Domain & SSL di Hostinger

### 7.1 Pointing Domain

1. Login ke panel Hostinger → **Domains** → pilih domain Anda
2. Buka **DNS / Nameservers**
3. Tambahkan record:
   - **Type**: A
   - **Name**: @ (atau subdomain, misalnya `simrs`)
   - **Points to**: IP VPS Anda
   - **TTL**: 3600

### 7.2 Install Nginx & Certbot di Host

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Buat konfigurasi Nginx untuk reverse proxy:

```bash
nano /etc/nginx/sites-available/simrs-zen
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Aktifkan site
ln -s /etc/nginx/sites-available/simrs-zen /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Dapatkan SSL certificate
certbot --nginx -d YOUR_DOMAIN

# Test auto-renewal
certbot renew --dry-run
```

---

## ✅ Langkah 8: Verifikasi

```bash
# Cek semua container berjalan
docker compose ps

# Cek health API
curl http://localhost:3000/health

# Cek log backend
docker compose logs api --tail=50

# Cek log database
docker compose logs postgres --tail=20
```

---

## 🔄 Langkah 9: Update Aplikasi

```bash
cd /opt/simrs-zen

# Pull update terbaru
git pull origin main

# Rebuild dan restart
docker compose up -d --build

# Jalankan migrasi database jika ada perubahan skema
docker compose exec api npx prisma migrate deploy
```

---

## 💾 Langkah 10: Backup Otomatis

```bash
# Buat script backup
cat > /opt/simrs-zen/backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/opt/simrs-zen/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker compose -f /opt/simrs-zen/docker-compose.yml exec -T postgres \
    pg_dump -U simrs simrs_zen | gzip > $BACKUP_DIR/simrs_zen_$DATE.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "Backup selesai: simrs_zen_$DATE.sql.gz"
EOF

chmod +x /opt/simrs-zen/backup.sh

# Jadwalkan backup harian pukul 02:00
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/simrs-zen/backup.sh >> /var/log/simrs-backup.log 2>&1") | crontab -
```

---

## 🔧 Troubleshooting

### Container tidak bisa start

```bash
docker compose logs api
docker compose logs postgres
```

### Tidak bisa akses dari browser

```bash
# Cek Nginx
nginx -t
systemctl status nginx

# Cek port yang digunakan
ss -tlnp | grep -E '80|443|3000'
```

### Database connection error

```bash
# Cek apakah PostgreSQL ready
docker compose exec postgres pg_isready -U simrs

# Cek environment variable DATABASE_URL
docker compose exec api env | grep DATABASE
```

### Reset instalasi (PERHATIAN: menghapus semua data!)

```bash
docker compose down -v
docker compose up -d --build
```

---

---

## 🤖 Langkah 11: Setup Auto-Deploy dari GitHub

Setelah repository sudah tersinkron dengan GitHub, setiap push ke branch `main` akan otomatis men-deploy ulang aplikasi di server VPS.

### 11.1 Buat SSH Key untuk GitHub Actions

Jalankan di server VPS:

```bash
# Buat SSH key khusus untuk GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# Tambahkan public key ke authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Tampilkan private key (akan dimasukkan ke GitHub Secrets)
cat ~/.ssh/github_actions
```

### 11.2 Tambahkan Secrets ke GitHub Repository

1. Buka repository GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Tambahkan secrets berikut:

| Secret | Nilai |
|--------|-------|
| `VPS_HOST` | IP address VPS Anda (contoh: `123.456.789.0`) |
| `VPS_USER` | Username SSH (biasanya `root`) |
| `VPS_SSH_KEY` | Isi dari private key `~/.ssh/github_actions` |
| `DEPLOY_PATH` | Path instalasi di VPS (opsional, default: `/opt/simrs-zen`) |

### 11.3 Cara Kerja Auto-Deploy

Setelah setup selesai, setiap kali Anda push ke branch `main`:

```
Push ke main → GitHub Actions berjalan → SSH ke VPS → git pull → docker compose up --build
```

Workflow terdapat di `.github/workflows/deploy.yml`.

### 11.4 Cek Status Deploy

- Buka tab **Actions** di repository GitHub untuk melihat status setiap deployment
- Notifikasi gagal akan muncul di tab Actions jika ada error

---

## 📞 Support

- Dokumentasi Docker: `docs/nodejs-migration/DOCKER-DEPLOYMENT.md`
- Dokumentasi VPS umum: `docs/nodejs-migration/VPS-SETUP.md`
