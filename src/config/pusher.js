import Pusher from "pusher";
import dotenv from "dotenv";

dotenv.config();

const hasCredentials =
  Boolean(process.env.PUSHER_APP_ID) &&
  Boolean(process.env.PUSHER_KEY) &&
  Boolean(process.env.PUSHER_SECRET) &&
  Boolean(process.env.PUSHER_CLUSTER);

let pusher = null;

if (hasCredentials) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
} else {
  console.warn("[PUSHER] Missing Pusher credentials in .env. Real-time events disabled.");
}

export default pusher;
