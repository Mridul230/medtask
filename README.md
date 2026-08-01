# MedTask — Hospital Task Coordination API

A full-stack backend system for hospital departments to manage patient appointment bookings, staff coordination, and care-related tasks — built to model a real-world workflow: patient books → staff approves → doctor decides treatment → tasks get tracked.

**Live API:** https://medtask-vv9y.onrender.com
**Frontend:** https://your-vercel-url.vercel.app *(update with your real URL)*
**Frontend repo:** https://github.com/Mridul230/medtask-frontend

## What It Does

- Patients request appointments in a specific hospital department (e.g., Cardiology)
- Staff (with authentication) approve appointments, assigning a doctor and a scheduled date
- Doctors/staff create and assign follow-up tasks (tests, procedures, check-ins) linked to a patient's appointment
- Staff track task status (`pending → in-progress → completed`) and discuss progress via comments

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (JSON Web Tokens), bcrypt password hashing
- **Deployment:** Render (API + PostgreSQL)

## Architecture

**Entities:** Staff, Department, DepartmentMember (junction table for many-to-many staff↔department), Patient, Appointment, Task, Comment — see `prisma/schema.prisma` for full schema with relationships and enums.

**Auth flow:** Staff sign up → password hashed with bcrypt → login issues a JWT (1-day expiry) → protected routes verify the token via custom `requireAuth` middleware → staff identity (`staffId`, `role`) is pulled from the verified token, never trusted from the request body.

## API Overview

| Method | Route | Protected | Description |
|---|---|---|---|
| POST | `/patients` | No | Register a patient |
| GET | `/patients` | No | List patients |
| POST | `/departments` | No | Create a department |
| POST | `/appointments` | No | Patient requests an appointment |
| GET | `/appointments` | Yes | List all appointments (nested patient/department/doctor) |
| PATCH | `/appointments/:id/approve` | Yes | Approve appointment, assign doctor + date |
| POST | `/staff/signup` | No | Create a staff account |
| POST | `/staff/login` | No | Log in, receive JWT |
| GET | `/staff/me` | Yes | Get current staff profile |
| POST | `/tasks` | Yes | Create a task linked to an appointment |
| GET | `/tasks` | Yes | List tasks (nested department/appointment/staff/comments) |
| PATCH | `/tasks/:id` | Yes | Update task status/priority/assignment |
| POST | `/tasks/:id/comments` | Yes | Add a comment to a task |

## Running Locally

```bash
npm install
# set up .env with DATABASE_URL and JWT_SECRET
npx prisma migrate dev
node index.js
```

## Design Decisions Worth Noting

- **Enums over free text** for `status`/`priority`/`role` fields — prevents inconsistent data (`"done"` vs `"Done"`) at the database level, not just in application code
- **Patient data is deliberately scoped down** — no real medical records, billing, or PHI stored — this is a task-coordination layer, not an EHR, and would require HIPAA-grade compliance work out of scope for this project
- **Generic auth error messages** (same message for "no such email" and "wrong password") — prevents leaking which emails are registered in the system

## Future Improvements

- Input validation (Zod/Joi) on all write routes
- Role-based restrictions (e.g., only DOCTOR/ADMIN can approve appointments)
- Rate limiting on auth endpoints
- Automated tests for auth and core business logic
