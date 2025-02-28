import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    // Get MongoDB URI from environment variables or use default local connection
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/crud-app';
    
    // Log the connection string (remove in production)
    console.log('Attempting MongoDB connection with URI:', mongoURI);
    
    // Validate connection string format
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error(`Invalid MongoDB URI: ${mongoURI}. URI must start with mongodb:// or mongodb+srv://`);
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred while connecting to the database');
    }
    
    // Exit with failure in case of connection errors
    process.exit(1);
  }
};

// Optional: Add connection event listeners for better monitoring
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

// Handle application termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});