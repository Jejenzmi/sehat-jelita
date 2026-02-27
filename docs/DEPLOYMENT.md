# Deployment Guide - SIMRS ZEN

## Prerequisites

- Docker Engine ≥ 24
- Docker Compose V2
- A Linux VPS/server (Ubuntu 22.04 recommended)

---

## Development Deployment

```bash
# Clone repository
git clone https://github.com/Jejenzmi/sehat-jelita.git
cd sehat-jelita

# Copy env file
cp .env.example .env
# Edit .env as needed

# Start all services
docker compose up -d

# Seed initial data
docker compose exec api npm run db:seed
```

Access at: `http://localhost` (frontend) and `http://localhost:3000` (API)

---

## Production Deployment

### 1. Prepare Environment

```bash
cp .env.production.example .env.production
```

Fill in all required variables, especially:
- `DB_PASSWORD` – use a strong password (≥16 chars)
- `REDIS_PASSWORD` – use a strong password
- `JWT_SECRET` – generate with `openssl rand -base64 64`
- `FRONTEND_URL` – your actual domain

### 2. Build and Start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### 3. Run Database Migrations

```bash
docker compose -f docker-compose.prod.yml exec api npm run db:migrate
docker compose -f docker-compose.prod.yml exec api npm run db:seed
```

### 4. Verify Health

```bash
curl http://localhost:3000/health
docker compose -f docker-compose.prod.yml ps
```

---

## FTP/Static Deployment (Frontend Only)

The GitHub Actions `deploy.yml` workflow builds the Vite app and uploads via FTPS.

Required repository secrets/variables:
| Name | Type | Description |
|---|---|---|
| `FTP_USERNAME` | Secret | FTP username |
| `FTP_PASSWORD` | Secret | FTP password |
| `FTP_SERVER` | Variable | FTP host address |
| `VITE_API_URL` | Variable | Backend API URL |

---

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec api npm run db:migrate
```

---

## Rollback

```bash
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
