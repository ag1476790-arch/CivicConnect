# CivicConnect Project Report

## Abstract

CivicConnect is a civic issue reporting and resolution application connecting residents with municipal administrators and field teams. It provides a shared workflow for submitting, triaging, assigning, tracking, and resolving service complaints.

## Problem statement

Traditional civic reporting channels often provide limited progress visibility and fragmented communication. CivicConnect centralizes complaint intake, operational assignment, audit history, and notifications in one role-aware portal.

## Objectives

- Simplify reporting with category, priority, location, and photo evidence.
- Give citizens status and complaint-history visibility.
- Support administrator triage, assignment, and workload monitoring.
- Provide field workers a scoped task queue with progress notes.
- Maintain an auditable status timeline and notifications.

## Architecture

- React/Vite SPA provides registration/login and role-specific dashboards.
- Django REST Framework exposes token-authenticated, role-scoped APIs.
- Django's custom user model represents citizens, administrators, and workers.
- MySQL stores accounts, complaints, history, and notifications.
- Complaint images are stored in the development media directory.

## Core workflows

1. A citizen creates an account and submits a report.
2. The system records initial submission history and sends a notification.
3. An administrator reviews the report, sets priority/status, and optionally assigns a field worker.
4. The worker starts work and records progress or resolution notes.
5. Status history and notifications keep the citizen and operational team informed.

## Security and access control

- Django hashes passwords.
- DRF token authentication protects application APIs.
- Citizens can only read their own complaints.
- Workers can only access complaints assigned to them.
- Administrative endpoints require the administrator role.
- Public registration cannot create administrator or worker accounts.
- Browser authentication is stored for the current tab session, not used as application data storage.

## Validation

The project includes backend role/access/lifecycle tests, migration checks, Django system checks, frontend linting, and a production build. Backend tests require a configured MySQL test database.

## Scope and limitations

This implementation targets local development and portfolio demonstration. Production requires deployment secrets and HTTPS, restricted database credentials, production media storage, backups, observability, and deployment-specific host/CORS configuration. Notifications are in-app; external email/SMS delivery is not configured.
