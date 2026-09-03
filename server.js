// server.js
// This is the entry point of the whole backend. It:
//   1. Loads environment variables
//   2. Connects to MongoDB
//   3. Sets up Express + middleware
//   4. Mounts all the route files under /api/...

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// --- Global middleware ---
app.use(cors()); // allow frontend (different origin) to call this API
app.use(express.json()); // parse JSON request bodies into req.body

// --- Health check route (useful to confirm the server is alive) ---
app.get("/api/health", (req, res) => {
  res.json({ message: "MindCare backend is running" });
});

// --- API routes ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/games", require("./routes/gameRoutes"));
app.use("/api/routines", require("./routes/routineRoutes"));
app.use("/api/reminders", require("./routes/reminderRoutes"));
app.use("/api/caregiver", require("./routes/caregiverRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// --- Serve frontend static files if present ---
const path = require("path");
const fs = require("fs");
const distDir = path.join(__dirname, "frontend", "dist");
const publicDir = path.join(__dirname, "public");

const staticDir = fs.existsSync(distDir) ? distDir : fs.existsSync(publicDir) ? publicDir : null;

if (staticDir) {
  app.use(express.static(staticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// --- Fallback 404 handler for API routes ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Generic error handler (catches thrown errors from async routes) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MindCare server running on http://localhost:${PORT}`);
});
