# Installation and Local Setup

## Prerequisites

- Windows 10/11 with PowerShell.
- Python 3.12+.
- Node.js LTS and npm.
- MySQL Server 8.x, running locally or reachable over the network.
- A MySQL account allowed to create/use the application database and a test database.

## Configure MySQL

Copy `backend\.env.example` to `backend\.env`. Configure the MySQL host, port, database name, user, and password. Replace the sample Django secret with a random value. Keep `DEBUG=True` only for local development, and set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for the actual host/origin.

The application does not configure SQLite. Setup fails explicitly when MySQL is unreachable or credentials are invalid.

## Install backend and create schema

Run from the project root:

```powershell
py -3.12 -m venv backend\venv
.\backend\venv\Scripts\python.exe -m pip install --upgrade pip
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\venv\Scripts\python.exe setup_db.py
.\backend\venv\Scripts\python.exe backend\manage.py migrate
.\backend\venv\Scripts\python.exe backend\manage.py createsuperuser
```

`mysqlclient` requires a compatible MySQL client build/runtime on Windows. If installation fails, install the matching MySQL Connector/C or a prebuilt wheel matching your Python architecture.

## Seed optional local demo data

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py seed_data
```

The seeded demo accounts are listed in README. Do not expose them on a public server. Rerunning the command restores demo passwords and avoids duplicate sample complaints.
For a non-demo deployment, create an initial administrator with `createsuperuser` and do not run the seed command.

## Run the API

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py check
.\backend\venv\Scripts\python.exe backend\manage.py runserver
```

The API is served at `http://localhost:8000/api/`. Development uploads are stored under `backend\media\`.

## Install and run frontend

In another PowerShell terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Change `VITE_API_BASE_URL` in `frontend\.env.local` if the API is served elsewhere. Open the URL printed by Vite.

## Validate

From the project root:

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run
.\backend\venv\Scripts\python.exe backend\manage.py test
cd frontend
npm run lint
npm run build
```

The Django test runner creates a test database on the configured MySQL server. The database account needs test database privileges. Never run these tests with production credentials.

## Troubleshooting

- **MySQL access denied / connection refused:** Check MySQL is running and `backend\.env` values match an account with database and test database privileges.
- **`mysqlclient` installation/import failure:** Use a supported Python/MySQL client build combination and matching Windows runtime.
- **Browser API/CORS errors:** Confirm Django is running and add the frontend origin to `CORS_ALLOWED_ORIGINS`.
- **Image upload errors:** Keep files at or below 5 MB and verify the development media route is reachable.
- **Empty worker queue:** Assign complaints to the worker in the administrator dashboard.
