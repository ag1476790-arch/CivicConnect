# CivicConnect

CivicConnect is a full-stack civic issue reporting and resolution portal for citizens, municipal administrators, and field workers.

## Features

- Citizen registration, login, complaint reporting, photo evidence, status tracking, and complaint history.
- Administrator complaint search and filtering, priority/status updates, worker assignment, dashboard statistics, and user/workforce views.
- Field-worker task queue, status updates, work notes, and supporting evidence.
- Token-authenticated Django REST APIs, role-scoped access, and in-app notifications.
- MySQL as the only configured database backend.

## Technology

- Frontend: React, JavaScript/JSX, Vite, React Router, Tailwind CSS, React Icons, Axios.
- Backend: Python, Django, Django REST Framework, Django Token Authentication.
- Database: MySQL.

## Quick start (Windows PowerShell)

1. Install Python 3.12+, Node.js LTS, and MySQL Server.
2. Copy `backend\.env.example` to `backend\.env`. Set MySQL connection values and replace `SECRET_KEY` with a random value.
3. From the project root:

   ```powershell
   py -3.12 -m venv backend\venv
   .\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
   .\backend\venv\Scripts\python.exe setup_db.py
   .\backend\venv\Scripts\python.exe backend\manage.py migrate
   .\backend\venv\Scripts\python.exe backend\manage.py createsuperuser
   .\backend\venv\Scripts\python.exe backend\manage.py seed_data
   .\backend\venv\Scripts\python.exe backend\manage.py runserver
   ```

4. In a second terminal:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm install
   npm run dev
   ```

5. Open the Vite URL, normally `http://localhost:5173`.

If dependencies are already installed in the backend virtual environment and `frontend\node_modules`, skip their install commands. Keep `backend\.env` and `frontend\.env.local` private and out of version control.

## Demo accounts

`seed_data` creates local demo accounts:

- Administrator: `admin` / `Admin@123`
- Field workers: `worker_raj`, `worker_priya`, or `worker_amit` / `Worker@123`
- Citizens: `citizen_john` or `citizen_anita` / `Citizen@123`

These are development-only credentials. Change them immediately if seeded data is used beyond a local demo. Public registration only creates citizen accounts; staff accounts must be provisioned by an administrator.

## Validation

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py check
.\backend\venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run
.\backend\venv\Scripts\python.exe backend\manage.py test
cd frontend
npm run lint
npm run build
```

Backend tests require reachable MySQL and test-database permissions. No SQLite fallback is configured. See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md), and [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

## Deployment preparation

The repository includes Vercel SPA routing for `frontend/` and a Railway `Procfile` for the Django service in `backend/`. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to configure the Vercel and Railway environment variables. No services have been deployed by this repository setup.

## Project layout

```text
backend/                 Django configuration and REST API
  apps/accounts/         Custom users, roles, authentication
  apps/complaints/       Complaint lifecycle, history, worker tasks
  apps/notifications/    User notifications
frontend/                React + Vite application
setup_db.py              MySQL database bootstrap helper
```

## Production note

This repository is prepared for local development and portfolio demonstration. Production use still requires deployment-specific secrets, HTTPS, production media storage, database backups, and operational monitoring. Never use seeded demo passwords in production.
