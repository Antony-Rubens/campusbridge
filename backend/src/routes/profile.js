import express from 'express';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/profile
// Get the logged-in user's profile
// ─────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, full_name, email, github_link, linkedin_id,
        department, semester, roll_number, phone,
        skills, interests, activity_points_total, role,
        created_at, updated_at
       FROM profiles
       WHERE id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─────────────────────────────────────────────
// POST /api/profile
// Create profile for first-time login
// ─────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      full_name, github_link, linkedin_id,
      department, semester, roll_number, phone,
      skills, interests, role
    } = req.body;

    // Sanitize role — students can only self-assign student or faculty
    // community_admin and system_admin must be assigned by system admin
    const allowedSelfRoles = ['student', 'faculty'];
    const assignedRole = allowedSelfRoles.includes(role) ? role : 'student';

    const { rows } = await pool.query(
      `INSERT INTO profiles (
        id, full_name, email, github_link, linkedin_id,
        department, semester, roll_number, phone,
        skills, interests, activity_points_total, role
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [
        req.user.id,
        full_name || '',
        req.user.email,
        github_link || null,
        linkedin_id || null,
        department || null,
        semester || null,
        roll_number || null,
        phone || null,
        skills || [],
        interests || [],
        assignedRole,
      ]
    );

    if (rows.length === 0) {
      return res.status(409).json({ error: 'Profile already exists' });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /profile error:', err.message);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/profile
// Update the logged-in user's profile
// Note: role cannot be changed by the user themselves
// ─────────────────────────────────────────────
router.patch('/', requireAuth, async (req, res) => {
  try {
    const {
      full_name, github_link, linkedin_id,
      department, semester, roll_number, phone,
      skills, interests
    } = req.body;

    // role is intentionally excluded — only system admin can change roles

    const { rows } = await pool.query(
      `UPDATE profiles SET
        full_name = COALESCE($1, full_name),
        github_link = COALESCE($2, github_link),
        linkedin_id = COALESCE($3, linkedin_id),
        department = COALESCE($4, department),
        semester = COALESCE($5, semester),
        roll_number = COALESCE($6, roll_number),
        phone = COALESCE($7, phone),
        skills = COALESCE($8, skills),
        interests = COALESCE($9, interests),
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        full_name || null,
        github_link || null,
        linkedin_id || null,
        department || null,
        semester || null,
        roll_number || null,
        phone || null,
        skills || null,
        interests || null,
        req.user.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─────────────────────────────────────────────
// GET /api/profile/search
// Search students by skills/department/interests
// (for Organizer Scouting - SRS REQ-12, REQ-13)
// ─────────────────────────────────────────────
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { department, skill, interest } = req.query;

    let query = `
      SELECT 
        id, full_name, email, department, semester,
        roll_number, phone, skills, interests
      FROM profiles
      WHERE role = 'student'
    `;
    const params = [];

    if (department) {
      params.push(department);
      query += ` AND department ILIKE $${params.length}`;
    }

    if (skill) {
      params.push(skill);
      query += ` AND $${params.length} ILIKE ANY(skills)`;
    }

    if (interest) {
      params.push(interest);
      query += ` AND $${params.length} ILIKE ANY(interests)`;
    }

    query += ` ORDER BY full_name ASC LIMIT 50`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /profile/search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;