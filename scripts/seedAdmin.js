import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../src/modules/users/users.model.js";
import { ROLES } from "../src/constants/roles.js";

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force dotenv to load .env from the root directory (one folder up)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is undefined. Make sure your .env file exists in the root directory.",
      );
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("[SEED] Connected to MongoDB...");

    const adminPhone = process.env.ADMIN_PHONE || "1234567890";
    const existingAdmin = await User.findOne({ phone: adminPhone });

    if (existingAdmin) {
      console.log(
        `[SEED] Admin with phone ${adminPhone} already exists. Skipping.`,
      );
      process.exit(0);
    }

    const adminUser = new User({
      fullName: process.env.ADMIN_FULL_NAME || "Super Admin",
      phone: adminPhone,
      email: process.env.ADMIN_EMAIL || "admin@luckyseat.com",
      password: process.env.ADMIN_PASSWORD || "AdminPass123!",
      role: ROLES.ADMIN,
    });

    await adminUser.save();
    console.log("[SEED] Default Admin created successfully!");
    console.log(`[SEED] Phone: ${adminPhone}`);
    console.log(
      `[SEED] Password: ${process.env.ADMIN_PASSWORD || "AdminPass123!"}`,
    );

    process.exit(0);
  } catch (error) {
    console.error(`[SEED ERROR] ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
