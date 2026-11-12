import { app } from '../server.js';
import { connectDB } from '../config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] DB connection failed:', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
  return app(req, res);
}

