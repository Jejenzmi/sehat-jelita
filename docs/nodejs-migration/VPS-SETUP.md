# Panduan Setup VPS untuk SIMRS ZEN

## 📋 Persyaratan Sistem

### Minimum Requirements
- **OS**: Ubuntu 22.04 LTS / Debian 12
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **Network**: Static IP

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Storage**: 100 GB SSD NVMe
- **Network**: Static IP + SSL Certificate

---

## 🚀 Langkah 1: Setup Initial Server

### 1.1 Login SSH dan Update System

```bash
# Login ke VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nano unzip htop ufw
```

### 1.2 Create Non-Root User

```bash
# Create user
adduser simrs
usermod -aG sudo simrs

# Setup SSH key untuk user baru
mkdir -p /home/simrs/.ssh
cp ~/.ssh/authorized_keys /home/simrs/.ssh/
chown -R simrs:simrs /home/simrs/.ssh
chmod 700 /home/simrs/.ssh
chmod 600 /home/simrs/.ssh/authorized_keys

# Login sebagai user baru
su - simrs
```

### 1.3 Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (jika akses remote dibutuhkan)
sudo ufw enable

# Verify
sudo ufw status
```

---

## 🐘 Langkah 2: Install PostgreSQL 15

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql-15 postgresql-contrib-15

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo systemctl status postgresql
```

### 2.1 Configure PostgreSQL

```bash
# Login sebagai postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE simrs_zen;
CREATE USER simrs WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE simrs_zen TO simrs;
ALTER USER simrs CREATEDB;

-- Exit
\q
```

### 2.2 Configure Remote Access (Optional)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Ubah: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Tambahkan: host    all    all    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🟢 Langkah 3: Install Node.js 20

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version

# Install global packages
sudo npm install -g pm2
```

---

## 🔴 Langkah 4: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Ubah: supervised systemd
# Ubah: bind 127.0.0.1 ::1

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Verify
redis-cli ping
# Should return: PONG
```

---

## 📦 Langkah 5: Deploy Aplikasi

### 5.1 Clone Repository

```bash
cd /home/simrs
git clone YOUR_REPOSITORY_URL simrs-zen-backend
cd simrs-zen-backend
```

### 5.2 Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Isi file .env:**
```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://simrs:YOUR_SECURE_PASSWORD@localhost:5432/simrs_zen

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# BPJS Integration
BPJS_CONS_ID=your-cons-id
BPJS_SECRET_KEY=your-secret-key
BPJS_USER_KEY=your-user-key
BPJS_BASE_URL=https://apijkn.bpjs-kesehatan.go.id

# SATU SEHAT
SATU_SEHAT_CLIENT_ID=your-client-id
SATU_SEHAT_CLIENT_SECRET=your-client-secret
SATU_SEHAT_ORG_ID=your-org-id
SATU_SEHAT_ENV=production

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL (untuk CORS)
FRONTEND_URL=https://your-domain.com
```

### 5.3 Install Dependencies & Setup Database

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Import initial data (jika ada)
# psql -U simrs -d simrs_zen -f database/schema.sql
```

### 5.4 Start dengan PM2

```bash
# Start aplikasi
pm2 start src/app.js --name simrs-api

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Jalankan command yang diberikan

# Verify
pm2 status
pm2 logs simrs-api
```

---

## 🌐 Langkah 6: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/simrs-api
```

**Isi konfigurasi Nginx:**
```nginx
upstream simrs_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Certificates (akan disetup oleh Certbot)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript;
    gzip_min_length 1000;

    location / {
        proxy_pass http://simrs_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket support untuk Socket.IO
    location /socket.io/ {
        proxy_pass http://simrs_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/simrs-api /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Langkah 7: Setup SSL dengan Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Langkah 8: Setup Monitoring

### 8.1 PM2 Monitoring

```bash
# Keymetrics (optional, gratis untuk 1 server)
pm2 link YOUR_KEY YOUR_SECRET

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.2 Basic Health Check Script

```bash
nano /home/simrs/health-check.sh
```

```bash
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "API not healthy! Restarting..."
    pm2 restart simrs-api
    # Send notification (optional)
    # curl -X POST "your-webhook-url" -d "SIMRS API restarted"
fi
```

```bash
chmod +x /home/simrs/health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/simrs/health-check.sh
```

---

## 🔄 Langkah 9: Setup Backup

### 9.1 Database Backup Script

```bash
mkdir -p /home/simrs/backups
nano /home/simrs/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/simrs/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="simrs_zen"
DB_USER="simrs"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/simrs_$TIMESTAMP.backup

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: simrs_$TIMESTAMP.backup"
```

```bash
chmod +x /home/simrs/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/simrs/backup-db.sh
```

---

## ✅ Langkah 10: Verifikasi

```bash
# Check all services
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status nginx
pm2 status

# Test API
curl https://api.your-domain.com/health

# Check logs
pm2 logs simrs-api --lines 100
```

---

## 🔧 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Node.js/PM2 Issues
```bash
# Restart PM2
pm2 restart simrs-api

# Check PM2 logs
pm2 logs simrs-api --err

# Flush PM2 logs
pm2 flush
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Support

Untuk bantuan lebih lanjut:
- Email: support@your-domain.com
- Dokumentasi: https://docs.your-domain.com
