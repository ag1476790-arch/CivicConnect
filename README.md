# CivicConnect

**CivicConnect** is a full-stack civic issue reporting and resolution portal that connects citizens, municipal administrators, and field workers to report, assign, track, and resolve local civic issues.

## Live Application

- **Frontend:** [Open CivicConnect](https://civicconnect-five-kohl.vercel.app/)
- **Backend Health Check:** [Check Railway API Health](https://civicconnect-production-a2b2.up.railway.app/health/)
- **Source Code:** [GitHub Repository](https://github.com/ag1476790-arch/CivicConnect)

The health-check endpoint reports whether the Django service can connect to its configured database. It is not the interactive API documentation.

## Features

- Citizen registration and login, complaint reporting, photo evidence, status tracking, and complaint history.
- Administrator complaint search and filtering, priority and status updates, worker assignment, dashboard statistics, and user/workforce views.
- Field-worker task queue, status updates, work notes, and supporting evidence.
- Token-authenticated Django REST APIs, role-scoped access, and in-app notifications.
- MySQL as the only configured database backend.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | [React](https://react.dev/), [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), JSX, [Vite](https://vite.dev/), [React Router](https://reactrouter.com/), [Tailwind CSS](https://tailwindcss.com/), [React Icons](https://react-icons.github.io/react-icons/), [Axios](https://axios-http.com/) |
| Backend | [Python](https://www.python.org/), [Django](https://www.djangoproject.com/), [Django REST Framework](https://www.django-rest-framework.org/), [Django Token Authentication](https://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication) |
| Database | [MySQL](https://www.mysql.com/) |
| Frontend Hosting | [Vercel](https://vercel.com/) |
| Backend Hosting | [Railway](https://railway.com/) |
| Source Control | [Git](https://git-scm.com/) and [GitHub](https://github.com/) |

## Quick Start (Windows PowerShell)

### Prerequisites

Install:

- [Python 3.12 or later](https://www.python.org/downloads/)
- [Node.js LTS](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)

### Backend Setup

1. Copy `backend\.env.example` to `backend\.env`.
2. Set your local MySQL connection values and replace `SECRET_KEY` with a securely generated random value. Do not commit this file.
3. From the project root, run:

```powershell
py -3.12 -m venv backend\venv
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\venv\Scripts\python.exe setup_db.py
.\backend\venv\Scripts\python.exe backend\manage.py migrate
.\backend\venv\Scripts\python.exe backend\manage.py createsuperuser
.\backend\venv\Scripts\python.exe backend\manage.py seed_data
.\backend\venv\Scripts\python.exe backend\manage.py runserver
```

### Frontend Setup

4. Open a second PowerShell terminal and run:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

5. Open the Vite URL, normally [http://localhost:5173](http://localhost:5173).

If dependencies are already installed in `backend\venv` and `frontend\node_modules`, skip their install commands.

Keep `backend\.env` and `frontend\.env.local` private and out of version control.

## Demo Accounts

The local `seed_data` command creates development demo accounts:

- **Administrator:** `admin` / `Admin@123`
- **Field Workers:** `worker_raj`, `worker_priya`, or `worker_amit` / `Worker@123`
- **Citizens:** `citizen_john` or `citizen_anita` / `Citizen@123`

These credentials are for local development demonstrations only. Never use them in production.

If demo data or these accounts have been created on a public deployment, change or remove those accounts and passwords.

Public registration creates citizen accounts; staff accounts must be provisioned by an administrator.

## Validation

Run the following checks from the project root:

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py check
.\backend\venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run
.\backend\venv\Scripts\python.exe backend\manage.py test
cd frontend
npm run lint
npm run build
```

Backend tests require a reachable MySQL server and test-database permissions. No SQLite fallback is configured.

## Documentation

- [Installation Guide](./INSTALLATION_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Design](./DATABASE_DESIGN.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## Deployment

The current deployment uses:

- **Vercel** for the React/Vite frontend, with the project root set to `frontend/`.
- **Railway** for the Django backend and MySQL database.
- The repository includes Vercel SPA routing for client-side routes and a Railway `Procfile` for the backend service.

See the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for the required environment variables and configuration.

Keep production secrets in the hosting providers' environment-variable settings. Never put passwords, database credentials, or Django secret keys in source control.

## Project Structure

```text
backend/                 Django configuration and REST API
  apps/accounts/         Custom users, roles, authentication
  apps/complaints/       Complaint lifecycle, history, worker tasks
  apps/notifications/    User notifications

frontend/                React + Vite application

setup_db.py              MySQL database bootstrap helper
```

## Production Considerations

This project is suitable for learning and portfolio demonstration.

Before using it for real public services, configure:

- Secure production secrets
- HTTPS
- Durable production media storage
- Database backups
- Monitoring
- An operational process for handling reported civic issues

Never use seeded demo passwords in production.
