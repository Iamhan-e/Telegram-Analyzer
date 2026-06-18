import express from 'express';
import { authMiddleware } from './middleware/auth';

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

// Auth routes webhook — exempt from JWT middleware
// (Supabase calls this with a webhook secret, not a user JWT)
app.use('/auth', (_req, _res, next) => next());

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
