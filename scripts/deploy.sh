#!/bin/bash
# =============================================================
# deploy.sh – Deployment script for Sehat Jelita (SIMRS ZEN)
# Run on VPS: bash scripts/deploy.sh
# =============================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.production.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/simrs-zen"

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error(){ echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# Helper: extract and strip quotes from .env value
get_env_var() {
  grep -E "^${1}=" "${REPO_DIR}/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'"
}

# -----------------------------------------------
# Rollback function
# -----------------------------------------------
rollback() {
  error "Deployment gagal – memulai rollback..."
  cd "${REPO_DIR}"

  # Rollback ke image sebelumnya jika tersedia
  if docker compose -f "${COMPOSE_FILE}" ps --quiet api 2>/dev/null | grep -q .; then
    log "Container masih berjalan, tidak perlu rollback lebih lanjut."
  else
    log "Mencoba restart containers dari state sebelumnya..."
    docker compose -f "${COMPOSE_FILE}" up -d --no-build 2>/dev/null || true
  fi

  error "Rollback selesai. Periksa log dengan: docker compose -f ${COMPOSE_FILE} logs"
  exit 1
}

trap rollback ERR

# -----------------------------------------------
# 1. Pull kode terbaru
# -----------------------------------------------
log "==> Menarik perubahan terbaru dari GitHub..."
cd "${REPO_DIR}"
git fetch origin main
git reset --hard origin/main
log "Kode diperbarui ke commit: $(git rev-parse --short HEAD)"

# -----------------------------------------------
# 2. Konfigurasi environment variables
# -----------------------------------------------
log "==> Memeriksa konfigurasi environment..."
if [ ! -f "${REPO_DIR}/.env" ]; then
  if [ -f "${REPO_DIR}/.env.production.example" ]; then
    cp "${REPO_DIR}/.env.production.example" "${REPO_DIR}/.env"
    error "File .env dibuat dari template. Harap isi nilai-nilainya sebelum melanjutkan!"
    exit 1
  else
    error "File .env tidak ditemukan dan tidak ada template .env.production.example."
    exit 1
  fi
fi

# Validasi variabel wajib
for VAR in DB_USER DB_PASSWORD DB_NAME JWT_SECRET REDIS_PASSWORD FRONTEND_URL; do
  value=$(get_env_var "${VAR}")
  if [ -z "${value}" ] || echo "${value}" | grep -qiE "CHANGE_THIS|your_"; then
    error "Variabel ${VAR} belum dikonfigurasi di .env"
    exit 1
  fi
done
log "Konfigurasi environment valid."

# -----------------------------------------------
# 3. Backup database sebelum deploy
# -----------------------------------------------
log "==> Membuat backup database..."
mkdir -p "${BACKUP_DIR}"
if docker compose -f "${COMPOSE_FILE}" ps --quiet postgres 2>/dev/null | grep -q .; then
  DB_USER_VAL=$(get_env_var "DB_USER")
  DB_NAME_VAL=$(get_env_var "DB_NAME")
  docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    pg_dump -U "${DB_USER_VAL}" "${DB_NAME_VAL}" \
    | gzip > "${BACKUP_DIR}/pre-deploy_${TIMESTAMP}.sql.gz" && \
    log "Backup berhasil: ${BACKUP_DIR}/pre-deploy_${TIMESTAMP}.sql.gz" || \
    log "Backup gagal (melanjutkan deployment)..."

  # Hapus backup lebih dari 7 hari
  find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
else
  log "Postgres belum berjalan, backup dilewati."
fi

# -----------------------------------------------
# 4. Pull Docker images terbaru
# -----------------------------------------------
log "==> Menarik Docker images terbaru..."
docker compose -f "${COMPOSE_FILE}" pull --quiet
log "Images berhasil diperbarui."

# -----------------------------------------------
# 5. Jalankan migrasi database
# -----------------------------------------------
log "==> Menjalankan migrasi database..."
# Pastikan postgres berjalan sebelum migrasi
docker compose -f "${COMPOSE_FILE}" up -d postgres redis
log "Menunggu PostgreSQL siap..."
for pg_i in $(seq 1 30); do
  if docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -q 2>/dev/null; then
    log "PostgreSQL siap (percobaan ${pg_i})."
    break
  fi
  if [ "${pg_i}" -eq 30 ]; then
    error "PostgreSQL tidak siap setelah 60 detik."
    exit 1
  fi
  log "Menunggu PostgreSQL... (${pg_i}/30)"
  sleep 2
done

# Jalankan migrasi menggunakan container API sementara
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps \
  -e NODE_ENV=production \
  api npm run db:migrate && \
  log "Migrasi database berhasil." || \
  log "Migrasi gagal atau tidak ada migrasi baru (melanjutkan)..."

# -----------------------------------------------
# 6. Deploy aplikasi (rolling update)
# -----------------------------------------------
log "==> Men-deploy aplikasi dengan rolling update..."

# Update API service tanpa downtime
docker compose -f "${COMPOSE_FILE}" up -d --no-deps --remove-orphans api
log "API service diperbarui, menunggu health check..."

# Tunggu API sehat
API_HEALTHY=false
for i in $(seq 1 12); do
  if docker compose -f "${COMPOSE_FILE}" exec -T api \
      curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    API_HEALTHY=true
    log "API health check berhasil (percobaan ${i})."
    break
  fi
  log "Menunggu API siap... (${i}/12)"
  sleep 5
done

if [ "${API_HEALTHY}" = "false" ]; then
  error "API gagal merespons health check setelah 60 detik."
  exit 1
fi

# Update frontend setelah API sehat
docker compose -f "${COMPOSE_FILE}" up -d --no-deps --remove-orphans frontend
log "Frontend service diperbarui."

# -----------------------------------------------
# 7. Verifikasi deployment
# -----------------------------------------------
log "==> Memverifikasi deployment..."

# Cek semua containers berjalan
FAILED_CONTAINERS=""
for SVC in postgres redis api frontend; do
  STATUS=$(docker compose -f "${COMPOSE_FILE}" ps --status running --quiet "${SVC}" 2>/dev/null)
  if [ -z "${STATUS}" ]; then
    FAILED_CONTAINERS="${FAILED_CONTAINERS} ${SVC}"
  fi
done

if [ -n "${FAILED_CONTAINERS}" ]; then
  error "Container berikut tidak berjalan:${FAILED_CONTAINERS}"
  exit 1
fi

# Final health check via HTTP
FRONTEND_URL_VAL=$(get_env_var "FRONTEND_URL")
if curl -sf --max-time 10 "${FRONTEND_URL_VAL}/api/health" > /dev/null 2>&1; then
  log "Health check eksternal berhasil: ${FRONTEND_URL_VAL}/api/health"
else
  log "Health check eksternal gagal (mungkin belum ada SSL atau domain). Memeriksa secara internal..."
  if docker compose -f "${COMPOSE_FILE}" exec -T api \
      curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    log "Health check internal API berhasil."
  else
    error "Health check internal API gagal."
    exit 1
  fi
fi

# -----------------------------------------------
# 8. Ringkasan deployment
# -----------------------------------------------
log "============================================"
log "✅ Deployment berhasil!"
log "   Commit : $(git rev-parse --short HEAD)"
log "   Waktu  : $(date '+%Y-%m-%d %H:%M:%S')"
log "   URL    : ${FRONTEND_URL_VAL}"
log "============================================"
docker compose -f "${COMPOSE_FILE}" ps
