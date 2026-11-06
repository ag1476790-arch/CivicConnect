# Vercel + Railway Deployment Guide

This repository is prepared for a split deployment:

- Vercel serves the Vite frontend from `frontend/`.
- Railway serves Django from `backend/` and hosts a MySQL service.

This guide does not deploy services or transfer local MySQL data. Review current platform pricing and limits before creating services.

## 1. Push the project to GitHub

Before pushing, inspect the files being staged and confirm `backend/.env`, `frontend/.env.local`, local media, and database exports are not included. `.gitignore` excludes local env files and media. Never commit production credentials, demo passwords, or screenshots/query logs containing secrets.

All passwords previously exposed in screenshots/chat must be changed before deployment. Use new, unique production credentials.

## 2. Create Railway MySQL

1. Create a Railway project and add a MySQL service.
2. Use Railway's private service connection values for the Django service. Railway MySQL typically exposes `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`; Django settings accept these directly.
3. Keep the database private. Do not expose it publicly unless you have a specific operational need.
4. Do not run `seed_data` on a public deployment: it creates known demo accounts and passwords.

## 3. Deploy Django on Railway

1. Create a Railway service from the GitHub repository.
2. Set its **Root Directory** to `/backend`. The `Procfile` runs migrations, collects static files, and starts Gunicorn.
3. Add variables to the Django service:

   | Variable | Value |
   |---|---|
   | `SECRET_KEY` | A new, randomly generated secret kept only in Railway |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | Railway API hostname (host only, no scheme), e.g. `your-api.up.railway.app` |
   | `CORS_ALLOWED_ORIGINS` | Vercel frontend origin, e.g. `https://your-app.vercel.app` |
   | `CSRF_TRUSTED_ORIGINS` | Vercel origin if Django admin/session forms are used |
   | `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` | Reference the corresponding Railway MySQL service variables |

   Alternatively, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. The explicit `DB_*` values take precedence over `MYSQL*`.
   Generate a new Django secret locally with `python -c "import secrets; print(secrets.token_urlsafe(50))"`, then save it directly as Railway's `SECRET_KEY`. Do not commit it or reuse a password shown in prior screenshots/chat.
4. Set Railway's health check path to `/health/`. It checks database connectivity and returns HTTP 503 when MySQL is unavailable.
5. After deploy, create the initial administrator through Railway's service shell:

   ```sh
   python manage.py createsuperuser
   ```

The start command applies migrations. Keep a single backend replica while using this automatic migration approach.

## 4. Configure uploaded images before accepting real reports

`backend/Procfile` does not seed data or enable public media serving. The default Railway filesystem is ephemeral; uploaded images can be lost when a deployment is replaced. Do not accept real complaint uploads until persistent media storage is configured.

For a portfolio demo, attach a Railway volume, set `MEDIA_ROOT` to its mount path, and set `SERVE_MEDIA_FILES=True`. **This serves uploaded images publicly**; use only non-sensitive demo images. For real citizen reports, use private object storage with authenticated/signed media access rather than public media URLs. The current image URL design is suitable for a demo, not private evidence.

## 5. Deploy the frontend on Vercel

1. Import the GitHub repository in Vercel.
2. Set the **Root Directory** to `frontend`.
3. Use Vite defaults (`npm run build`, output directory `dist`). `frontend/vercel.json` rewrites client-side routes to `index.html`.
4. Set the build environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-api.up.railway.app/api` |

5. Redeploy after setting the variable. Add the final Vercel origin to Railway's `CORS_ALLOWED_ORIGINS`.

## 6. Verify the deployment

- Visit `https://your-api.up.railway.app/health/`; expect `{"status":"ok"}`.
- Open the Vercel URL and register a citizen account.
- Sign in, submit a non-sensitive test complaint, and verify it appears in the citizen dashboard.
- Sign in as the provisioned administrator, assign a worker, and verify worker status updates and notification/history behavior.
- Delete test records through the app/admin UI if needed; do not run destructive SQL against a production database.

## Production limitations

- CivicConnect currently uses DRF token authentication and browser session storage; it is a portfolio/demo authentication model, not a complete production identity solution.
- Uploaded complaint media requires the persistent/private storage decision above.
- Configure backups, monitoring, rate limits, email delivery, privacy/retention policies, HTTPS and secret rotation before handling public data.
