# SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit

Sistem Informasi Manajemen Rumah Sakit (SIMRS) berbasis web modern, dibangun dengan React, TypeScript, Node.js, dan PostgreSQL.

## Teknologi

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Deployment**: Docker, Nginx

---

## 🚀 Panduan Instalasi End-to-End ke VPS

### Persyaratan Sistem

| Resource | Minimum | Rekomendasi |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 100 GB NVMe |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Network | Static IP | Static IP + SSL |

---

### Langkah 1: Setup Server

```bash
# Login ke VPS via SSH
ssh root@YOUR_VPS_IP

# Update sistem
apt update && apt upgrade -y
apt install -y curl wget git nano unzip htop ufw

# Buat user non-root
adduser simrs
usermod -aG sudo simrs

# Setup SSH key untuk user baru
mkdir -p /home/simrs/.ssh
cp ~/.ssh/authorized_keys /home/simrs/.ssh/
chown -R simrs:simrs /home/simrs/.ssh
chmod 700 /home/simrs/.ssh
chmod 600 /home/simrs/.ssh/authorized_keys
```

#### Konfigurasi Firewall

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

### Langkah 2: Install Docker

```bash
# Login sebagai user simrs
su - simrs

# Install Docker
curl -fsSL https://get.docker.com | sudo bash

# Tambahkan user ke grup docker
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker compose version
```

---

### Langkah 3: Clone Repository

```bash
cd /home/simrs
git clone https://github.com/Jejenzmi/sehat-jelita.git simrs-zen
cd simrs-zen
```

---

### Langkah 4: Konfigurasi Environment

```bash
# Frontend environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env
```

Edit file `backend/.env` dan isi semua nilai yang diperlukan:

```bash
nano backend/.env
```

**Nilai penting yang harus diisi:**

```env
# Ganti dengan password yang kuat
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT

# Generate JWT secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GANTI_DENGAN_STRING_HEX_64_KARAKTER

# URL frontend Anda
FRONTEND_URL=https://domain-anda.com

# Redis password
REDIS_PASSWORD=GANTI_DENGAN_PASSWORD_REDIS

# Integrasi BPJS (opsional)
BPJS_CONS_ID=
BPJS_SECRET_KEY=
BPJS_USER_KEY=

# Integrasi Satu Sehat (opsional)
SATUSEHAT_CLIENT_ID=
SATUSEHAT_CLIENT_SECRET=
SATUSEHAT_ORGANIZATION_ID=
```

---

### Langkah 5: Build dan Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua layanan
docker compose up -d --build

# Cek status layanan
docker compose ps

# Lihat logs
docker compose logs -f
```

Setelah selesai, layanan tersedia di:

| Layanan | URL |
|---------|-----|
| Frontend (Nginx) | http://YOUR_VPS_IP |
| Backend API | http://YOUR_VPS_IP:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

### Langkah 6: Setup SSL dengan Certbot (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan sertifikat SSL (ganti domain-anda.com)
sudo certbot --nginx -d domain-anda.com

# Certbot akan otomatis memperbarui sertifikat
sudo certbot renew --dry-run
```

---

### Langkah 7: Konfigurasi Nginx untuk Domain

Edit file `nginx.prod.conf` dan sesuaikan nama domain:

```nginx
server_name domain-anda.com www.domain-anda.com;
```

Kemudian restart container:

```bash
docker compose restart frontend
```

---

## 📦 File Docker

| File | Keterangan |
|------|-----------|
| `Dockerfile.frontend` | Build React/Vite → Nginx |
| `backend/Dockerfile` | Build Node.js API |
| `docker-compose.yml` | Orkestrasi semua layanan |
| `nginx.conf` | Konfigurasi Nginx (dev) |
| `nginx.prod.conf` | Konfigurasi Nginx (production) |

---

## 🔧 Development Lokal

### Prasyarat

- Node.js 20+ dan npm
- Docker dan Docker Compose

### Menjalankan secara lokal

```bash
# Clone repository
git clone https://github.com/Jejenzmi/sehat-jelita.git
cd sehat-jelita

# Install dependensi frontend
npm install

# Jalankan seluruh stack dengan Docker (database, backend, frontend)
docker compose up -d

# Atau jalankan frontend saja (gunakan backend via Docker)
npm run dev
```

Frontend akan tersedia di http://localhost:8080

### Perintah berguna

```bash
# Hentikan semua layanan
docker compose down

# Hentikan dan hapus data (reset database)
docker compose down -v

# Lihat log backend
docker compose logs -f backend

# Masuk ke container database
docker compose exec postgres psql -U simrs -d simrs_zen
```

---

## 🔄 Update Aplikasi di VPS

```bash
cd /home/simrs/simrs-zen

# Pull perubahan terbaru
git pull origin main

# Rebuild dan restart layanan
docker compose up -d --build

# Verifikasi
docker compose ps
```

---

## 🔒 Keamanan

- Jangan pernah commit file `.env` ke version control
- Gunakan password yang kuat dan unik untuk semua layanan
- Perbarui sistem secara berkala: `sudo apt update && sudo apt upgrade -y`
- Aktifkan firewall dan batasi akses hanya pada port yang dibutuhkan
- Backup database secara rutin

---

## 📚 Dokumentasi Tambahan

- [Arsitektur Sistem](ARCHITECTURE.md)
- [Panduan Deployment](DEPLOYMENT.md)
- [Konfigurasi Environment](ENVIRONMENT.md)
- [Keamanan](SECURITY.md)
- [VPS Setup Detail](docs/nodejs-migration/VPS-SETUP.md)
- [Docker Deployment Detail](docs/nodejs-migration/DOCKER-DEPLOYMENT.md)
