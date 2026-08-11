import Pusher from "pusher-js";

const pusher = new Pusher("9c954f9d7cf8b5d6503d", {
  cluster: "ap2",
  enabledTransports: ["ws", "wss"],
});

pusher.connection.bind("connected", () => {
  console.log("CONNECTED");
});

const ch = pusher.subscribe("global-notifications");
ch.bind("notification:new", (data) => {
  console.log("GOT_EVENT", JSON.stringify(data));
  process.exit(0);
});

setTimeout(() => {
  console.log("TIMEOUT_NO_EVENT");
  process.exit(1);
}, 20000);
