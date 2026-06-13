const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const jobRoutes = require("./routes/jobRoutes.js");
const workerRoutes = require("./routes/workerRoutes.js");
const { addSseClient, removeSseClient } = require("./services/eventEmitter.js");
const { startScheduler, scheduleJobs } = require("./services/scheduler.js");
const { startCrashDetector } = require("./services/crashDetector.js");
const { broadcastStats } = require("./controllers/jobController.js");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// SSE Endpoint for real-time dashboard updates
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish the SSE connection

  // Add client to active broadcast list
  addSseClient(res);
  
  // Send initial connection ping
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  
  // Immediately send initial stats to initialize UI
  broadcastStats();

  req.on("close", () => {
    removeSseClient(res);
  });
});

// Bind API Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/workers", workerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Job Execution Platform Backend Server is running." });
});

const PORT = process.env.PORT || 3000;

// Connect to DB, sync models, then boot the server and background loops
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection authenticated successfully.");
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync();
    console.log("Database tables synchronized.");

    // Start background loops
    startScheduler();
    startCrashDetector();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      // Initial scheduler run
      scheduleJobs();
    });
  } catch (error) {
    console.error("Unable to start server due to database error:", error);
    process.exit(1);
  }
})();