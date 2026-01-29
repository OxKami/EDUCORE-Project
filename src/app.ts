import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import teachersRoutes from './modules/teachers/teachers.routes';
import studentsRoutes from './modules/students/students.routes';
import academicRoutes from './modules/academic/academic.routes';
import gradingRoutes from './modules/grading/grading.routes';
import financeRoutes from './modules/finance/finance.routes';
import documentsRoutes from './modules/documents/documents.routes';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'EduCore API is running',
    timestamp: new Date().toISOString() 
  });
});

// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to EduCore API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      docs: '/api/v1/docs'
    }
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/teachers', teachersRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/grading', gradingRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/documents', documentsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;