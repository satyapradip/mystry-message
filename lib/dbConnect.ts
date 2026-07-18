import mongoose from 'mongoose';

// Define the structure of our connection object
// We use 'type' to tell TypeScript what shape this object should have
type ConnectionObject = {
  isConnected?: number;  // '?' means this property is optional
};

// Create an empty connection object to track our database status
const connection: ConnectionObject = {};

/**
 * dbConnect - Connects to MongoDB database
 * This function checks if we're already connected before creating a new connection.
 * It prevents creating multiple connections (which wastes resources).
 */
async function dbConnect(): Promise<void> {
  // Check if we have a connection to the database or if it's currently connecting
  if (connection.isConnected) {
    console.log('Already connected to the database');
    return;  // Exit early - no need to connect again
  }

  try {
    // Attempt to connect to the database
    // process.env.MONGODB_URI reads the connection string from .env file
    // The '||' '' provides a fallback empty string if MONGODB_URI is not set
    const db = await mongoose.connect(process.env.MONGODB_URI || '', {});

    // Store the connection status (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
    connection.isConnected = db.connections[0].readyState;

    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);

    // Graceful exit in case of a connection error
    // process.exit(1) stops the app with an error code (1 means failure)
    process.exit(1);
  }
}

export default dbConnect;