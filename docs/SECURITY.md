# Security Guide - SIMRS ZEN

## Secret Management

- **Never commit** `.env`, `.env.production`, or any file containing real credentials.
- `.env*` files (except `*.example`) are listed in `.gitignore`.
- Rotate `JWT_SECRET` and database passwords periodically.
- Use `openssl rand -base64 64` to generate strong secrets.

## Authentication & Authorization

- Passwords are hashed with **bcrypt** (cost factor 10).
- Access tokens are short-lived JWTs (`JWT_EXPIRES_IN`, default 7 days).
- Refresh tokens are stored server-side and invalidated on logout.
- All protected endpoints require `Authorization: Bearer <token>`.

## Network Security

- **Helmet** sets security HTTP headers (CSP, HSTS, X-Frame-Options, etc.).
- **CORS** is restricted to `FRONTEND_URL` / `CORS_ORIGIN`.
- **Rate limiting** (express-rate-limit) prevents brute-force: 100 req / 15 min per IP by default.
- The PostgreSQL and Redis containers are **not** exposed to the host in production (`docker-compose.prod.yml`).

## Input Validation

- Backend uses **Zod** schemas to validate all incoming request bodies.
- Prisma parameterized queries prevent SQL injection.
- File uploads are size-limited (`10 MB`) and type-checked.

## Frontend Security

- API base URL and mode are the only frontend env vars; no secrets in Vite build.
- **ErrorBoundary** prevents full app crash and never exposes stack traces in production UI.
- External links use `rel="noopener noreferrer"`.

## Dependency Security

- Run `npm audit` regularly to detect vulnerabilities.
- Dependabot (or `npm audit --fix`) should be used to patch critical CVEs.

## Production Checklist

- [ ] Changed default `DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS/TLS is terminated at the reverse proxy (nginx or load balancer)
- [ ] Docker containers run as non-root users
- [ ] Log level set to `warn` or `error` in production
- [ ] Database backups are scheduled (e.g., `pg_dump` cron)
- [ ] Firewall allows only ports 80 and 443 externally

## Reporting Vulnerabilities

Please report security issues privately to the maintainers via GitHub's private vulnerability reporting feature rather than opening a public issue.
