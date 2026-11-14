import mongoose from 'mongoose';
import dns from 'dns';

// Ensure DNS resolution for MongoDB Atlas SRV records works reliably on all networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback to system dns if custom cannot be set
}

let cachedConnection = null;

export const connectDB = async () => {
  // Check if connection is already open (crucial for Vercel serverless reuse)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    let mongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();

    // Strip accidental quotes
    mongoUri = mongoUri.replace(/^["']|["']$/g, '').trim();

    // Fix accidental key inclusion in value (e.g. MONGO_URI=mongodb+srv://...)
    if (mongoUri.startsWith('MONGO_URI=') || mongoUri.startsWith('MONGODB_URI=')) {
      mongoUri = mongoUri.replace(/^(MONGO_URI|MONGODB_URI)=/, '').trim().replace(/^["']|["']$/g, '').trim();
    }

    // Auto-fix missing protocol if hostname was pasted
    if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      if (mongoUri.includes('mongodb.net')) {
        mongoUri = 'mongodb+srv://' + mongoUri;
      }
    }

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined.');
    }

    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      throw new Error(
        `Invalid MONGO_URI format. Expected string to start with "mongodb+srv://" or "mongodb://", but received "${mongoUri.substring(0, 15)}...". Please check your Render Environment Variables.`
      );
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    cachedConnection = conn;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};
