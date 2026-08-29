require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const socketHelper = require("./utils/socket");
const authRouter = require("./routes/auth");
const lostItemsRouter = require("./routes/lostItems");
const foundItemsRouter = require("./routes/foundItems");
const claimsRouter = require("./routes/claims");
const notificationsRouter = require("./routes/notifications");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // allow all origins for development
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Port & DB connection configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campus-lost-found";

// Initialize Socket.io
socketHelper.init(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Rate limiting (Section 9 of PRD: login and claims rate-limited)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many login attempts, please try again later." },
});

const claimsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit each IP to 50 claim attempts per window
  message: { error: "Too many claim attempts, please try again later." },
});

app.use("/auth", authLimiter, authRouter);
app.use("/lost-items", lostItemsRouter);
app.use("/found-items", foundItemsRouter);
app.use("/claims", claimsLimiter, claimsRouter);
app.use("/notifications", notificationsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "An unexpected server error occurred." });
});

// Database connection & start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
