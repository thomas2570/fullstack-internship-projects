import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { setupSocketServer } from './services/socketService.js';
import { setWorkerSocketIO } from './workers/videoTranscodeWorker.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import liveRoutes from './routes/liveRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Pass IO instance to services & workers (only in persistent node server)
if (!process.env.VERCEL) {
  setupSocketServer(io);
  setWorkerSocketIO(io);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows cross-origin video/HLS loading
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static Video & Asset Delivery Layer (CloudFront / Local CDN emulator)
// Explicit headers for HLS streaming (.m3u8, .ts chunks)
app.use('/uploads/hls', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  if (req.url.endsWith('.m3u8')) {
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
  } else if (req.url.endsWith('.ts')) {
    res.header('Content-Type', 'video/MP2T');
  }
  next();
}, express.static(path.join(__dirname, 'uploads', 'hls')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'EduFlow LMS Backend',
    timestamp: new Date().toISOString(),
    webrtc: 'enabled',
    queue: 'active',
  });
});

// API Routes (mounted both with /api and direct root for Vercel Serverless compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);

// Serverless fallback mounts without /api prefix
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/lessons', lessonRoutes);
app.use('/quizzes', quizRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/live', liveRoutes);
app.use('/certificates', certificateRoutes);
app.use('/payments', paymentRoutes);
app.use('/instructor', instructorRoutes);
app.use('/admin', adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server (only in persistent node environments, skip in Vercel serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 EduFlow LMS Server running on http://localhost:${PORT}`);
      console.log(`📡 WebRTC Signaling Server Active on Socket.IO`);
      console.log(`📺 CloudFront/Local HLS Streaming mounted at /uploads/hls`);
      console.log(`=======================================================`);
    });
  });
}

export { app, server, io };

