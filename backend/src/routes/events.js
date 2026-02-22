import express from 'express';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/events
// Get all published events (Discover Feed)
// SRS REQ-9, REQ-10, REQ-11
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id, e.title, e.description, e.location,
        e.event_date, e.category, e.max_participants,
        e.status, e.created_at,
        c.name AS community_name,
        c.department AS community_department
       FROM events e
       JOIN communities c ON e.community_id = c.id
       WHERE e.status = 'published'
       ORDER BY e.event_date ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /events error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ─────────────────────────────────────────────
// GET /api/events/:id
// Get single event details
// SRS REQ-11
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id, e.title, e.description, e.location,
        e.event_date, e.category, e.max_participants,
        e.status, e.created_at,
        c.id AS community_id,
        c.name AS community_name,
        c.department AS community_department
       FROM events e
       JOIN communities c ON e.community_id = c.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /events/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ─────────────────────────────────────────────
// POST /api/events
// Create a new event (community admin only)
// SRS REQ-7, REQ-8
// ─────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      community_id, title, description,
      location, event_date, category, max_participants
    } = req.body;

    if (!community_id || !title || !event_date) {
      return res.status(400).json({ error: 'community_id, title, and event_date are required' });
    }

    // Check the user is an admin of this community
    const { rows: memberCheck } = await pool.query(
      `SELECT role FROM community_members
       WHERE community_id = $1 AND profile_id = $2`,
      [community_id, req.user.id]
    );

    if (memberCheck.length === 0 || memberCheck[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only community admins can create events' });
    }

    const { rows } = await pool.query(
      `INSERT INTO events (
        community_id, title, description, location,
        event_date, category, max_participants,
        created_by, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published')
       RETURNING *`,
      [
        community_id,
        title,
        description || null,
        location || null,
        event_date,
        category || null,
        max_participants || null,
        req.user.id,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /events error:', err.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/events/:id
// Update an event (community admin only)
// ─────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const {
      title, description, location,
      event_date, category, max_participants, status
    } = req.body;

    // Check the user created this event
    const { rows: eventCheck } = await pool.query(
      `SELECT created_by FROM events WHERE id = $1`,
      [req.params.id]
    );

    if (eventCheck.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventCheck[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the event creator can update this event' });
    }

    const { rows } = await pool.query(
      `UPDATE events SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        event_date = COALESCE($4, event_date),
        category = COALESCE($5, category),
        max_participants = COALESCE($6, max_participants),
        status = COALESCE($7, status),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        title || null,
        description || null,
        location || null,
        event_date || null,
        category || null,
        max_participants || null,
        status || null,
        req.params.id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /events/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

export default router;