# CampusBridge – Database Schema (MVP)

This document defines the **authoritative database schema** for the CampusBridge MVP.
All tables and relationships must align with this file.

---

## 1. profiles
Stores user profile information linked to Supabase Auth.

- id (uuid, PK, FK → auth.users.id)
- full_name (text)
- email (text, unique)
- department (text)
- skills (text[])
- github_link (text)
- linkedin_link (text)
- created_at (timestamptz)
- updated_at (timestamptz)

---

## 2. communities
Represents student or departmental communities.

- id (uuid, PK)
- name (text)
- type (text)
- description (text)
- created_by (uuid, FK → profiles.id)
- status (text)
- instagram_url (text)
- linkedin_url (text)
- website_url (text)
- logo_url (text)
- created_at (timestamptz)

---

## 3. community_memberships
Links students to communities.

- id (uuid, PK)
- student_id (uuid, FK → profiles.id)
- community_id (uuid, FK → communities.id)
- is_admin (boolean)
- status (text)

---

## 4. events
Events conducted under communities.

- id (uuid, PK)
- community_id (uuid, FK → communities.id)
- name (text)
- description (text)
- category (text)
- event_date (timestamptz)
- activity_points (int)
- created_by (uuid, FK → profiles.id)
- created_at (timestamptz)

---

## 5. certificates
Certificates uploaded by students for events.

- id (uuid, PK)
- student_id (uuid, FK → profiles.id)
- event_id (uuid, FK → events.id)
- certificate_name (text)
- file_url (text)
- created_at (timestamptz)

---

## 6. activity_points
Tracks activity points per student.

- id (uuid, PK)
- student_id (uuid, FK → profiles.id)
- event_id (uuid, FK → events.id)
- points (int)
- status (text) — pending / approved / rejected
- approved_by (uuid, FK → profiles.id, nullable)
- created_at (timestamptz)

---

## Relationships Summary
- auth.users → profiles (1:1)
- profiles → communities (1:N)
- profiles → community_memberships (1:N)
- communities → events (1:N)
- profiles → certificates (1:N)
- events → certificates (1:N)
- profiles → activity_points (1:N)

---

## Notes
- No duplicate profile tables allowed
- No direct frontend DB access
- Backend enforces all write operations
- RLS optional for MVP, backend service role allowed