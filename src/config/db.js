import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) return cachedConnection;
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 15000,
  });
  cachedConnection = conn;
  console.log(`[MONGODB] Connected to Host: ${conn.connection.host}`);
  return conn;
};

export default connectDB;
