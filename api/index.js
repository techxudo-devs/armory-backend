import app from "../src/app.js";
import connectDB from "../src/config/db.js";

let ready = false;

export default async function handler(req, res) {
  if (!ready) {
    await connectDB();
    ready = true;
  }
  return app(req, res);
}
