import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.js';
import eventRoutes from './routes/events.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);

export default app;