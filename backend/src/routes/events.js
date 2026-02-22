import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, event_name, event_date, description FROM events ORDER BY event_date'
  );
  res.json(rows);
});

export default router;