import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import gamesRoutes from "./modules/games/games.routes.js";
import seatsRoutes from "./modules/seats/seats.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import ApiError from "./shared/errors/apiError.js";

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
  }),
);

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Base Route
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "API Operational", architecture: "Domain-Driven Modular" });
});

// Register Domain Modules
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/seats", seatsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);

// Handle 404 Route Not Found
app.use("*", (req, res, next) => {
  next(
    new ApiError(404, `Cannot find ${req.originalUrl} on this server.`),
  );
});

// Global Error Handler
app.use(errorHandler);
export default app;
