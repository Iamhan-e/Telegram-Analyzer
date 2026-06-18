import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from apps/api/ before anything else
config({ path: resolve(__dirname, '..', '.env') });

import express from 'express';
import { authMiddleware } from './middleware/auth';
import authRouter from './routes/auth';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Parse JSON bodies
app.use(express.json());

// Health check — no auth required
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes — exempt from JWT middleware.
// POST /auth/provision is called by Supabase on new signup via webhook,
// signed with SUPABASE_WEBHOOK_SECRET, not a user JWT.
app.use(authRouter);

// Apply JWT auth to all other routes
app.use(authMiddleware);

// Example protected route — remove once real routes are added
app.get('/api/me', (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

export default app;
