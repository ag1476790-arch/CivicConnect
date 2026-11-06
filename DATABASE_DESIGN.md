# Database Design

CivicConnect uses MySQL exclusively through Django's MySQL backend. The default database name is `civicconnect_db`; connection details are read from `backend\.env`.

## Entities and relationships

### User (`accounts_user`)

Custom Django `AbstractUser` with identity/auth fields (`id`, `username`, hashed `password`, `email`, `date_joined`, `is_active`, staff flags) and profile fields (`full_name`, `phone_number`, `department`, `role`).

Roles are `CITIZEN`, `ADMIN`, and `WORKER`. Passwords use Django's configured password hashers. Public self-registration always creates a citizen; staff accounts are provisioned by staff.

### Complaint (`complaints_complaint`)

- Unique generated `complaint_number`.
- `citizen` references the reporting user.
- Nullable `assigned_worker` references a worker.
- Title, description, category, location, optional coordinates, priority, and status.
- Optional image path, created/updated timestamps, and nullable resolution timestamp.

Indexes support citizen timelines, worker queues, and status/priority filtering.

### Complaint history (`complaints_complainthistory`)

- Foreign keys to complaint and the user recording the change.
- Previous and new statuses, optional remarks, and creation timestamp.
- Initial complaint submission and subsequent status changes are recorded.
- Ordered newest first and indexed by complaint/date.

### Notification (`notifications_notification`)

- Recipient and complaint foreign keys.
- Message, `is_read`, and creation timestamp.
- Indexed by recipient/read state/date.

## Lifecycle

`SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED`

Administrators may reject complaints or update the state as operationally necessary. Workers are limited to `IN_PROGRESS` and `RESOLVED` updates on their assigned tasks. Status updates create history, update the resolution timestamp, and notify relevant parties.

## Schema management

Checked-in migration files define the schema. Apply them with:

```powershell
.\backend\venv\Scripts\python.exe backend\manage.py migrate
```

No SQLite configuration or fallback is provided. `setup_db.py` creates the MySQL database; Django migrations create and evolve application tables.
