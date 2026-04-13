# SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit

Sistem Informasi Manajemen Rumah Sakit (SIMRS) berbasis web modern, dibangun dengan React, TypeScript, Node.js, dan PostgreSQL.

## Teknologi

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Deployment**: Docker, Nginx

---

## 💻 Panduan Penggunaan Terminal VPS (Tanpa SSH)

Jika Anda tidak dapat menggunakan SSH dari komputer lokal, Anda bisa mengakses terminal VPS langsung melalui browser menggunakan fitur konsol/terminal yang disediakan oleh penyedia VPS (Hostinger, DigitalOcean, Vultr, Linode, dll.).

### Cara Mengakses Terminal VPS via Browser

#### Hostinger
1. Login ke [hPanel Hostinger](https://hpanel.hostinger.com)
2. Klik menu **VPS** → pilih server Anda
3. Di bagian **Overview**, klik tombol **Terminal** (ikon layar hitam) atau **Browser Terminal**
4. Terminal akan terbuka langsung di tab browser — Anda sudah login sebagai `root`

#### DigitalOcean
1. Login ke [Cloud DigitalOcean](https://cloud.digitalocean.com)
2. Pilih **Droplets** → klik nama server Anda
3. Klik tab **Access** → klik **Launch Droplet Console**
4. Terminal browser akan terbuka otomatis

#### Vultr
1. Login ke [Vultr My Servers](https://my.vultr.com)
2. Klik server yang ingin diakses
3. Klik ikon **View Console** (ikon layar) di pojok kanan atas
4. Masukkan username `root` dan password server Anda

#### Linode / Akamai Cloud
1. Login ke [Linode Manager](https://cloud.linode.com)
2. Pilih **Linodes** → klik nama server Anda
3. Klik tombol **Launch LISH Console**

---

### Instalasi SIMRS ZEN via Terminal VPS (Browser Console)

Setelah terminal VPS terbuka di browser, jalankan perintah-perintah berikut secara berurutan:

#### Langkah 1: Update Sistem & Install Paket Dasar

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano unzip htop ufw
```

#### Langkah 2: Install Docker

```bash
curl -fsSL https://get.docker.com | bash
usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker compose version
```

#### Langkah 3: Clone Repository

```bash
cd /opt
mkdir -p simrs-zen && cd simrs-zen
git clone https://github.com/Jejenzmi/sehat-jelita.git .
```

#### Langkah 4: Konfigurasi Environment

```bash
# Frontend
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Isi nilai penting di `backend/.env`:

```env
DB_USER=simrs
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT
DB_NAME=simrs_zen
DATABASE_URL=postgresql://simrs:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/simrs_zen
JWT_SECRET=GANTI_DENGAN_STRING_HEX_64_KARAKTER
FRONTEND_URL=https://domain-anda.com
REDIS_PASSWORD=GANTI_DENGAN_PASSWORD_REDIS
REDIS_URL=redis://:GANTI_DENGAN_PASSWORD_REDIS@redis:6379
```

Generate `JWT_SECRET` (pilih salah satu perintah):

```bash
# Menggunakan openssl (tersedia di semua server Ubuntu)
openssl rand -hex 64

# Atau menggunakan Node.js jika sudah terinstall
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Langkah 5: Konfigurasi Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

> **Catatan**: Tidak perlu membuka port 22 (SSH) jika Anda hanya menggunakan terminal browser.

#### Langkah 6: Build dan Jalankan Aplikasi

```bash
docker compose up -d --build

# Cek status
docker compose ps

# Lihat log (tekan Ctrl+C untuk keluar)
docker compose logs -f
```

#### Langkah 6a: Jalankan Migrasi Database

Setelah semua container berjalan, jalankan migrasi Prisma:

```bash
docker compose exec api npx prisma migrate deploy
```

#### Langkah 7: Setup SSL (Opsional — jika domain sudah terhubung)

> **Catatan**: Nginx sudah termasuk di dalam Docker Compose (`frontend` container). Langkah ini memasang Certbot di **host** untuk mendapatkan sertifikat SSL dan dikonfigurasi sebagai reverse proxy.

```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx && systemctl start nginx
certbot --nginx -d domain-anda.com
certbot renew --dry-run
```

---

### Tips Penggunaan Terminal Browser

| Tips | Keterangan |
|------|-----------|
| **Copy-Paste** | Gunakan klik kanan → Paste (atau Shift+Insert) untuk menempelkan perintah |
| **Sesi terputus** | Gunakan `tmux` atau `screen` agar proses tetap berjalan jika koneksi browser terputus |
| **Jalankan tmux** | `tmux new -s simrs` → jalankan perintah → `Ctrl+B, D` untuk detach |
| **Sambung kembali** | `tmux attach -t simrs` untuk melanjutkan sesi sebelumnya |

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
DB_USER=simrs
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT
DB_NAME=simrs_zen
DATABASE_URL=postgresql://simrs:GANTI_DENGAN_PASSWORD_KUAT@postgres:5432/simrs_zen

# Generate JWT secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GANTI_DENGAN_STRING_HEX_64_KARAKTER

# URL frontend Anda
FRONTEND_URL=https://domain-anda.com

# Redis password
REDIS_PASSWORD=GANTI_DENGAN_PASSWORD_REDIS
REDIS_URL=redis://:GANTI_DENGAN_PASSWORD_REDIS@redis:6379

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

### Langkah 5a: Jalankan Migrasi Database

Setelah semua container berjalan, jalankan migrasi Prisma:

```bash
docker compose exec api npx prisma migrate deploy
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

## 🔐 Prisma & OpenSSL Configuration

### Mengapa OpenSSL 3.x Compatibility Penting?

Ubuntu 24.04 (Noble) dan Debian Bookworm menggunakan **OpenSSL 3.x** secara default. Prisma Client memerlukan binary engine yang dikompilasi untuk versi OpenSSL yang sesuai agar tidak terjadi error runtime seperti:

```
Error: Cannot find module: libssl.so.1.1
```

### Konfigurasi di `prisma/schema.prisma`

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

Dengan `binaryTargets = ["native", "debian-openssl-3.0.x"]`, Prisma akan menghasilkan binary yang kompatibel dengan lingkungan Docker berbasis Debian/Ubuntu dengan OpenSSL 3.0.x.

### Base Image Requirements

| Base Image | OpenSSL Version | Prisma binaryTarget |
|-----------|----------------|---------------------|
| `node:20-bookworm-slim` | OpenSSL 3.0.x | `debian-openssl-3.0.x` ✅ |
| `node:20-bullseye-slim` | OpenSSL 1.1.x | `debian-openssl-1.1.x` |
| `node:20-alpine` | LibreSSL / musl | `linux-musl-openssl-3.0.x` |

### Troubleshooting OpenSSL Version Mismatch

Jika terjadi error terkait OpenSSL:

```bash
# Cek versi OpenSSL di container
docker exec <container> openssl version

# Pastikan paket libssl3 terpasang
docker exec <container> dpkg -l | grep libssl

# Rebuild image dengan cache bersih
docker build --no-cache -t simrs-zen-api ./backend
```

Variabel `PRISMA_SKIP_ENGINE_CHECK=true` di `backend/Dockerfile` memastikan inisialisasi engine lebih aman saat build.

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
