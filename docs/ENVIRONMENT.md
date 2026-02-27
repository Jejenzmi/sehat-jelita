# Environment Variables Reference - SIMRS ZEN

## Frontend (Vite)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_MODE` | Yes | `nodejs` | API mode (`nodejs`) |
| `VITE_API_URL` | Yes | `/api` | Base URL for API calls |

Copy `.env.example` to `.env` for local development.

---

## Backend (Node.js)

Copy `backend/.env.example` to `backend/.env` for local development, or `./env.production.example` to `.env.production` for production.

### Application

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | `development` or `production` |
| `PORT` | No | `3000` | HTTP listen port |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `DB_USER` | Prod only | DB username (used in compose) |
| `DB_PASSWORD` | Prod only | DB password (use strong value) |
| `DB_NAME` | Prod only | DB name |

### Authentication

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Access token TTL (default `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default `30d`) |

### Redis

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | No | Redis connection string |
| `REDIS_PASSWORD` | Prod only | Redis auth password |

### BPJS Integration

| Variable | Description |
|---|---|
| `BPJS_CONS_ID` | Consumer ID from BPJS |
| `BPJS_SECRET_KEY` | Secret key from BPJS |
| `BPJS_USER_KEY` | User key from BPJS |
| `BPJS_BASE_URL` | BPJS API base URL |
| `BPJS_VCLAIM_URL` | VClaim endpoint |
| `BPJS_APLICARE_URL` | Aplicare endpoint |

### Satu Sehat Integration

| Variable | Description |
|---|---|
| `SATUSEHAT_CLIENT_ID` | OAuth2 client ID |
| `SATUSEHAT_CLIENT_SECRET` | OAuth2 client secret |
| `SATUSEHAT_ORGANIZATION_ID` | Organization ID |
| `SATU_SEHAT_ENV` | `sandbox` or `production` |

### Email

| Variable | Default | Description |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | – | SMTP username |
| `SMTP_PASS` | – | SMTP password / app password |
| `SMTP_FROM` | – | From address |

### Logging & Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `debug` | Logging level (`debug`, `info`, `warn`, `error`) |
| `LOG_FORMAT` | `dev` | Log format (`dev` or `json`) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window per IP |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
