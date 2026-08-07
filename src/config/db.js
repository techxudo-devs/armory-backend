import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
    });
    console.log(`[MONGODB] Connected to Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MONGODB ERROR] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
