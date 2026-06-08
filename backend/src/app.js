import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import callRoutes from './routes/callRoutes.js';
import aiAgentRoutes from './routes/aiAgentRoutes.js';
import phoneNumberRoutes from './routes/phoneNumberRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        !allowedOrigins.length ||
        allowedOrigins.includes(origin) ||
        vercelPreviewPattern.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

// API route groups
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/calls', callRoutes);
app.use('/api/v1/ai-agents', aiAgentRoutes);
app.use('/api/v1/phone-numbers', phoneNumberRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AI Voice Receptionist Server is healthy',
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
