# CampusBridge – Database Schema (MVP)

This document defines the **authoritative database schema** for the CampusBridge MVP.
All tables and relationships must align with this file.
Last updated: February 2026

---

## 1. profiles
Stores user profile information linked to Supabase Auth.

- id (uuid, PK, FK → auth.users.id)
- full_name (text)
- email (text, unique)
- department (text)
- semester (text)
- roll_number (text)
- phone (text)
- skills (text[])
- interests (text[])
- github_link (text)
- linkedin_id (text)
- role (text) — student | faculty | community_admin | system_admin
- activity_points_total (int, default 0)
- created_at (timestamptz)
- updated_at (timestamptz)

---

## 2. communities
Represents student or departmental communities.

- id (uuid, PK)
- name (text)
- type (text)
- description (text)
- department (text)
- created_by (uuid, FK → profiles.id)
- status (text) — pending | approved | rejected
- created_at (timestamptz)
- updated_at (timestamptz)

---

## 3. community_members
Links students to communities.

- id (uuid, PK)
- community_id (uuid, FK → communities.id)
- profile_id (uuid, FK → profiles.id)
- role (text) — admin | member
- joined_at (timestamptz)

---

## 4. events
Events conducted under communities.

- id (uuid, PK)
- community_id (uuid, FK → communities.id)
- title (text)
- description (text)
- location (text)
- category (text)
- event_date (timestamptz)
- max_participants (int)
- status (text) — pending | published | cancelled
- created_by (uuid, FK → profiles.id)
- created_at (timestamptz)
- updated_at (timestamptz)

---

## 5. certificates
Certificates uploaded by students for events.

- id (uuid, PK)
- profile_id (uuid, FK → profiles.id)
- event_id (uuid, FK → events.id)
- certificate_name (text)
- file_url (text)
- issued_at (timestamptz)
- status (text) — pending | approved | rejected
- created_at (timestamptz)

---

## 6. ktu_rules
Stores KTU activity point rules and limits.

- id (uuid, PK)
- category (text)
- level (text)
- role (text)
- points (int)
- max_allowed (int)
- created_at (timestamptz)

---

## 7. activity_point_records
Tracks activity point submissions and approvals per student.

- id (uuid, PK)
- profile_id (uuid, FK → profiles.id)
- certificate_id (uuid, FK → certificates.id)
- rule_id (uuid, FK → ktu_rules.id)
- awarded_points (int)
- status (text) — pending | approved | rejected
- approved_by (uuid, FK → profiles.id, nullable)
- approval_date (timestamptz)
- created_at (timestamptz)

---

## Relationships Summary
- auth.users → profiles (1:1)
- profiles → community_members (1:N)
- communities → community_members (1:N)
- communities → events (1:N)
- profiles → certificates (1:N)
- events → certificates (1:N)
- profiles → activity_point_records (1:N)
- certificates → activity_point_records (1:1)
- ktu_rules → activity_point_records (1:N)

---

## Notes
- No duplicate profile tables
- No direct frontend DB access — all writes go through backend API
- Backend enforces all write operations via Express routes
- Role-based access enforced in backend middleware
- RLS optional for MVP, backend service role used for all DB access