# CampusBridge – MVP Scope Definition

This document defines the **frozen scope** of the CampusBridge MVP.
Anything not explicitly listed here is **out of scope** for MVP.

---

## Objective
Build a clean, SRS-aligned MVP that enables students to showcase activities,
communities to host events, and faculty to validate activity points.

---

## User Roles (MVP)

### 1. Student
- Registers and logs in using Supabase Auth
- Creates and updates personal profile
- Joins communities (implicit or direct)
- Uploads certificates
- Views events and communities
- Earns activity points (pending approval)

### 2. Faculty Coordinator
- Reviews student activity submissions
- Approves or rejects activity points

### 3. Community Admin (Limited)
- Creates communities
- Creates events under owned communities

> NOTE: System-level Admin role is NOT part of MVP.

---

## Features INCLUDED in MVP

### Authentication & Profile
- Supabase-based authentication
- Automatic profile creation on first login
- Profile update (name, department, skills, links)

### Community Management
- Community creation (basic details only)
- Community visibility in Explore/Discover
- Community status (active/inactive)

### Events
- Event creation under communities
- Event listing in Discover
- Event metadata (date, category, points)

### Certificates & Activity Points
- Certificate upload by students
- Mapping certificates to events
- Activity point calculation (rule-based)
- Faculty approval of activity points

### Discover & Explore
- Public listing of communities
- Public listing of events
- Read-only access (no interactions)

---

## Features EXCLUDED from MVP

- Organizer scouting / recruiter features
- Notifications system
- Chat or messaging
- Community join approval workflows
- Admin dashboards
- Analytics & reports
- Recommendation systems
- Search & filters (basic listing only)

---

## Technical Constraints
- Frontend: Next.js (App Router)
- Backend: Node.js (Express, ESM)
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth + JWT verification in backend

---

## Success Criteria
- Fresh user can register and reach dashboard
- Profile exists exactly once per user
- Activity points flow works end-to-end
- Faculty approval updates student points correctly
- All features traceable to SRS requirements