
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getDbInfo } from './config/db.js';
import { loadSecrets } from './config/secrets.js';

import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? [
          process.env.CLIENT_URL,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
        ]
      : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'ShuttlePulse Badminton Tournament & CRM API',
    timestamp: new Date().toISOString(),
    database: getDbInfo(),
  });
});

// Application routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/crm', crmRoutes);

// Amazon S3 file upload route
app.use('/api/uploads', uploadRoutes);

// Serve production React build if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await loadSecrets();
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `[Server] ShuttlePulse App & API listening on http://localhost:${PORT}`
      );
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

startServer();

export default app;
