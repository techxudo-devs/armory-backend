import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const LEGACY_INDEX = { gameId: 1, userId: 1 };

const dropSeatUserIndex = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is undefined. Make sure your .env file exists in the root directory.",
      );
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("[SEAT-INDEX] Connected to MongoDB...");

    const seats = mongoose.connection.collection("seats");
    const indexes = await seats.indexes();
    const legacy = indexes.find(
      (idx) =>
        idx.key.gameId === 1 &&
        idx.key.userId === 1 &&
        idx.name !== "_id_",
    );

    if (!legacy) {
      console.log("[SEAT-INDEX] Legacy {gameId:1, userId:1} index not found. Nothing to do.");
      console.log("Current indexes:");
      indexes.forEach((idx) => console.log(`  - ${idx.name}`));
      return;
    }

    await seats.dropIndex(legacy.name);
    console.log(`[SEAT-INDEX] Dropped index "${legacy.name}"`);

    const remaining = await seats.indexes();
    console.log("Remaining indexes:");
    remaining.forEach((idx) => console.log(`  - ${idx.name}`));

    const sync = await seats.aggregate([
      { $group: { _id: "$gameId", count: { $sum: 1 } } },
    ]).toArray();
    let updated = 0;
    for (const group of sync) {
      const result = await mongoose
        .connection.collection("games")
        .updateOne(
          { _id: group._id, reservedSeatsCount: { $ne: group.count } },
          { $set: { reservedSeatsCount: group.count } },
        );
      if (result.modifiedCount > 0) {
        updated += result.modifiedCount;
        console.log(`[SEAT-INDEX] Synced game ${group._id} -> reservedSeatsCount ${group.count}`);
      }
    }
    console.log(`[SEAT-INDEX] Count sync complete (${updated} game(s) updated).`);
  } catch (error) {
    console.error("[SEAT-INDEX] Failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

dropSeatUserIndex();
