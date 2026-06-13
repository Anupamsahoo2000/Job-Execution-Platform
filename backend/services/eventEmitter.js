const { EventEmitter } = require("events");
const systemEmitter = new EventEmitter();

// Keep track of connected SSE clients
let sseClients = [];

function addSseClient(res) {
  sseClients.push(res);
}

function removeSseClient(res) {
  sseClients = sseClients.filter((client) => client !== res);
}

function broadcast(type, data) {
  const payload = JSON.stringify({ type, data });
  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

// Log a system event, store in database if jobId is provided, and broadcast to frontend
async function logSystemEvent({ jobId, message, level = "info", workerName = null }) {
  const timestamp = new Date();
  
  // Format log message for console
  const prefix = jobId ? `[Job ${jobId.substring(0, 8)}]` : "[System]";
  const workerPrefix = workerName ? ` (${workerName})` : "";
  console.log(`${prefix}${workerPrefix} ${message}`);

  // Save to DB if it's related to a job
  if (jobId) {
    try {
      const { JobLog } = require("../models");
      await JobLog.create({
        jobId,
        message,
        level,
        timestamp,
      });
    } catch (err) {
      console.error("Failed to write job log to DB:", err);
    }
  }

  // Broadcast to all active dashboards
  broadcast("log", {
    id: Math.random().toString(36).substring(2, 9),
    jobId,
    message,
    level,
    timestamp,
    workerName,
  });
}

module.exports = {
  systemEmitter,
  addSseClient,
  removeSseClient,
  broadcast,
  logSystemEvent,
};
