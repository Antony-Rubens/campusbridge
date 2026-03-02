# CampusBridge – MVP Scope Definition

This document defines the **frozen scope** of the CampusBridge MVP.
Anything not listed here is out of scope for MVP.
Last updated: February 2026

---

## Objective
Build a clean, SRS-aligned MVP that enables students to showcase activities,
communities to host events, and faculty to validate activity points.

---

## User Roles (MVP)

### 1. Student (self-registered)
- Registers and logs in via Supabase Auth
- Creates and updates personal profile
- Browses communities and events
- Uploads certificates
- Submits certificates for activity point calculation
- Views own activity point records and status

### 2. Faculty Coordinator (self-requested, role set manually)
- Reviews pending activity point submissions
- Approves or rejects submissions
- Can override awarded points before approving

### 3. Community Admin (role set in community_members table)
- Creates and manages communities
- Creates and publishes events under owned communities

> NOTE: System Admin role is set directly in the database.
> It is NOT self-assignable.

---

## Features INCLUDED in MVP

### Authentication & Profile
- Supabase Auth (Google + Magic Link) need to change to otp 
- Automatic profile creation on first login
- Role selection at registration (student or faculty request)
- Profile update (name, department, semester, roll number,
  phone, skills, interests, github, linkedin)

### Community Management
- Community creation with type and department
- Community listing in Explore page
- Community detail page with events list
- Community status (approved/pending/rejected)

### Events
- Event creation under communities (admin only)
- Event listing in Discover page with search and category filter
- Event detail accessible from community page
- Event metadata (title, date, location, category, max participants)

### Certificates & Activity Points
- Certificate upload by students (file URL + name + event link)
- KTU rule selection at submission time
- Rule-based point calculation with category limits enforced
- Faculty approval flow (approve / reject / override points)
- Student activity point total updated on approval
- Student can view all own submissions and statuses

### Discover & Explore
- Public event listing (no auth required)
- Public community listing (no auth required)
- Search and category filter on Discover
- Search, type, and department filter on Explore

---

## Features EXCLUDED from MVP

- Organizer scouting / student search by skills
- Notifications system
- Chat or messaging
- Community join approval workflows
- Full admin dashboard UI
- Analytics and reports
- Recommendation engine
- Certificate file upload (using URL input for MVP)
- KTU rule management UI (rules managed directly in DB)

---

## Backend API Routes (MVP)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | /api/health | No | Server health check |
| GET | /api/profile | Yes | Get own profile |
| POST | /api/profile | Yes | Create profile |
| PATCH | /api/profile | Yes | Update profile |
| GET | /api/events | No | Discover feed |
| GET | /api/events/:id | No | Event detail |
| POST | /api/events | Yes | Create event |
| PATCH | /api/events/:id | Yes | Update event |
| GET | /api/activity-points/rules | Yes | KTU rules list |
| GET | /api/activity-points/my | Yes | Own submissions |
| POST | /api/activity-points/submit | Yes | Submit certificate |
| GET | /api/activity-points/pending | Yes (faculty) | Pending submissions |
| PATCH | /api/activity-points/:id/approve | Yes (faculty) | Approve/reject |

---

## Frontend Pages (MVP)

| Page | Route | Who |
|------|-------|-----|
| Auth | / | Public |
| Register Details | /register-details | New users |
| Dashboard | /dashboard | Student |
| Discover | /discover | Public |
| Explore | /explore | Public |
| Community Detail | /explore/[id] | Public |
| Certificates | /certificates | Student |
| Activity Points | /activity-points | Student |
| Faculty Panel | /faculty | Faculty |

---

## Technical Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Backend: Node.js (Express, ESM), port 4000
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth → JWT → backend requireAuth middleware
- Storage: Supabase Storage (for certificate files)

---

## Success Criteria
- Fresh user can register and reach dashboard
- Profile exists exactly once per user
- Student can submit a certificate and see it as pending
- Faculty can approve it and student total updates correctly
- All features traceable to SRS requirements
