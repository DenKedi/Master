import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env.local file');
}

export async function connectDB(): Promise<typeof mongoose> {
  // If the locally imported mongoose is already connected, return it.
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  // Cache the connection promise on the mongoose instance itself.
  // This prevents multiple connection attempts in the same module scope
  // while safely supporting multiple scopes (e.g., custom server vs Next.js worker).
  const m = mongoose as any;
  if (!m._promise) {
    m._promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
  }

  try {
    await m._promise;
  } catch (err) {
    // Reset so the next request can attempt a fresh connection
    m._promise = null;
    throw err;
  }

  return mongoose;
}

export default connectDB;
