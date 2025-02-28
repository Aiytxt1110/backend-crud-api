import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import itemRoutes from './routes/itemRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log environment details for debugging
console.log('Environment:', {
  NODE_ENV,
  PORT,
  MONGO_URI: process.env.MONGO_URI || 'Not set'
});

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for API testing (no MongoDB dependency)
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'API is working!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Basic route (no MongoDB dependency)
app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Connect to MongoDB with error handling
(async () => {
  try {
    await connectDB();
    
    // Only set up MongoDB-dependent routes after successful connection
    // Routes
    app.use('/api/items', itemRoutes);
    
    console.log('MongoDB routes initialized');
  } catch (error) {
    console.error('Failed to connect to MongoDB. API routes that depend on MongoDB will not work.');
    
    // Set up a fallback route for items that explains the MongoDB connection issue
    app.use('/api/items', (req: Request, res: Response) => {
      res.status(503).json({ 
        error: 'Database connection failed',
        message: 'The server is unable to connect to MongoDB. Please check server logs.'
      });
    });
  }
})();

// Custom error handler
interface ApiError extends Error {
  statusCode?: number;
}

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Catch-all error handler for routes that don't exist
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    message: `Route not found: ${req.originalUrl}`,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`Access API at http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  // Log but don't exit in production
  if (NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  // Log but don't exit in production
  if (NODE_ENV === 'development') {
    process.exit(1);
  }
});