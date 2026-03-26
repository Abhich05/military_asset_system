# Military Asset Management System (Starter)

This workspace scaffolds an MVC-style Node/Express backend + React frontend, with AI-style forecast/alerts endpoints under `/ai/*`.

## Project layout

- `backend/` Express API
- `frontend/` React UI (AI Insights page)
- `db/` PostgreSQL schema and sample data
- `pdf-docs/` place for your write-up

## Backend (AI endpoints)

Endpoints:
- `GET /ai/forecast?baseId=1&equipmentTypeId=1&period=7&historyDays=60`
- `GET /ai/alerts?baseId=1&days=30`
- `GET /ai/recommend-purchase?baseId=1&equipmentTypeId=1&period=7`

If `DATABASE_URL` is not configured, the service falls back to deterministic mock series so the UI still renders.

## Database (PostgreSQL)

1. Create a database and load:
   - `db/schema.sql`
   - `db/sample_data.sql`
2. Set `DATABASE_URL` for the backend.

Expected schema tables (subset):
- `bases`, `equipment_types`, `assets`, `purchases`, `expenditures`, `transfers`

## Run locally

### Backend
1. In `backend/`:
   - `npm install`
   - `set DATABASE_URL=postgres://user:pass@localhost:5432/yourdb` (PowerShell: `$env:DATABASE_URL="..."`)
   - `npm run dev`

### Frontend
1. In `frontend/`:
   - `npm install`
   - `npm run dev`

If needed, set `VITE_API_BASE_URL` in the frontend environment to point to the backend.

