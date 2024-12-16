import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import notificationRoutes from "./routes/notificationRoutes";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: process.env.FRONTEND_URL,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

const redisClient = createClient({
	url: process.env.REDIS_URL,
});
redisClient.connect().catch(console.error);

const redisStore = new RedisStore({
	client: redisClient,
	prefix: "myapp:",
});

app.use(
	cors({
		origin: process.env.FRONTEND_URL,
		credentials: true,
	})
);
app.use(express.json());
app.use(rateLimiter);

app.use(
	session({
		store: redisStore,
		secret: process.env.SESSION_SECRET || "default_secret",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24, // 1 day
		},
	})
);

app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

mongoose
	.connect(process.env.MONGODB_URI || "")
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", (socket) => {
	console.log("A user connected");
	socket.on("disconnect", () => {
		console.log("User disconnected");
	});
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export { io };
