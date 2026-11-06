# CivicConnect API

Base URL: `http://localhost:8000/api`

Authenticated requests use the token returned by login:

```http
Authorization: Token <token>
```

JSON bodies use `application/json`. Complaint submissions may use `multipart/form-data` to upload `image` (maximum 5 MB). Role violations return `403`; inaccessible or nonexistent complaint records return `404`.

## Authentication

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register/` | Public | Register a citizen account. Required: `username`, `email`, `full_name`, `password`, `password_confirm`; optional `phone_number`. Public role selection is ignored. |
| POST | `/auth/login/` | Public | Authenticate with `username` and `password`; returns `{ "token": "...", "user": {...} }`. |
| POST | `/auth/logout/` | Authenticated | Delete the current token. |
| GET | `/auth/profile/` | Authenticated | Return the current profile. |

Worker and administrator accounts are provisioned by staff, not by public registration.

## Complaints and citizen access

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/complaints/` | Authenticated | List complaints scoped to caller: all for administrators, assigned tasks for workers, own reports for citizens. Supports `status`, `category`, `priority`, and `search` filters for administrators. |
| POST | `/complaints/` | Citizen | Create a complaint. |
| GET | `/complaints/{id}/` | Authenticated | Retrieve complaint details and history, scoped by role. |
| GET | `/citizen/complaints/` | Citizen | List own complaints. |
| POST | `/citizen/complaints/` | Citizen | Create a complaint. Fields: `title`, `description`, `category`, `location`; optional `latitude`, `longitude`, `priority`, and `image`. |
| GET | `/citizen/complaints/{id}/` | Citizen | Retrieve own complaint and history. |

Categories: `ROADS`, `GARBAGE`, `STREETLIGHT`, `WATER_SUPPLY`, `DRAINAGE`, `PUBLIC_INFRASTRUCTURE`, `SAFETY`, `OTHER`.

Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

Statuses: `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`.

## Administrator

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard/` | Admin | Aggregate status counts, recent complaints, and category counts. |
| GET | `/admin/complaints/` | Admin | List/search/filter complaints by `status`, `category`, `priority`, and `search`. |
| POST/PATCH | `/admin/complaints/{id}/assign/` | Admin | Assign a field worker. Body: `worker_id`, optional `remarks`. |
| POST/PATCH | `/admin/complaints/{id}/status/` | Admin | Update `status`, `priority`, or both; optional `remarks`. Status changes are recorded in history. |
| GET | `/admin/workers/` | Admin | List workers and assigned task counts. |
| GET | `/admin/users/` | Admin | List account summaries and active state. |
| POST | `/admin/users/` | Admin | Provision a citizen or worker account. Body fields: `username`, `password`, `role`; optional profile fields. |
| PATCH | `/admin/users/{id}/status/` | Admin | Activate/deactivate a non-admin account with `{ "is_active": false }`. |

## Field worker

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/worker/tasks/` | Worker | List complaints assigned to caller. Optional `status` filter. |
| GET | `/worker/tasks/{id}/` | Assigned worker | Retrieve an assigned task and its history. |
| POST/PATCH | `/worker/tasks/{id}/status/` | Assigned worker | Set status to `IN_PROGRESS` or `RESOLVED`; optional `remarks` work note. |

Workers cannot read or change unassigned complaints.

## Notifications

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/notifications/` | Authenticated | List caller's notifications. |
| POST/PATCH | `/notifications/{id}/read/` | Authenticated | Mark one owned notification as read. |
| POST | `/notifications/mark-all-read/` | Authenticated | Mark all caller notifications as read. |

## Example complaint request

```json
{
  "title": "Damaged road near the library",
  "description": "A large pothole is obstructing the road.",
  "category": "ROADS",
  "location": "Library Road",
  "priority": "HIGH",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```
