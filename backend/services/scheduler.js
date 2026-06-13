const { Op } = require("sequelize");
const { Job, Worker, sequelize } = require("../models");
const { logSystemEvent, broadcast } = require("./eventEmitter.js");

let isScheduling = false;

async function scheduleJobs() {
  if (isScheduling) return;
  isScheduling = true;

  const transaction = await sequelize.transaction();
  try {
    // 1. Find all active workers that are currently idle
    // Active means status = ACTIVE and lastHeartbeat is within the last 15 seconds
    const activeThreshold = new Date(Date.now() - 15000);
    const idleWorkers = await Worker.findAll({
      where: {
        status: "ACTIVE",
        currentJobId: null,
        lastHeartbeat: {
          [Op.gt]: activeThreshold,
        },
      },
      order: [["updatedAt", "ASC"]], // Distribute load by prioritizing workers idle the longest
      transaction,
    });

    if (idleWorkers.length === 0) {
      await transaction.commit();
      isScheduling = false;
      return;
    }

    // 2. Find all pending jobs, ordered by priority (DESC) then creation time (ASC)
    // Priority: 3 = HIGH, 2 = MEDIUM, 1 = LOW
    const pendingJobs = await Job.findAll({
      where: {
        status: "PENDING",
      },
      order: [
        ["priority", "DESC"],
        ["createdAt", "ASC"],
      ],
      limit: idleWorkers.length, // Only fetch what we can assign
      transaction,
    });

    if (pendingJobs.length === 0) {
      await transaction.commit();
      isScheduling = false;
      return;
    }

    // 3. Assign jobs to workers
    const assignCount = Math.min(idleWorkers.length, pendingJobs.length);
    for (let i = 0; i < assignCount; i++) {
      const job = pendingJobs[i];
      const worker = idleWorkers[i];

      job.status = "RUNNING";
      job.workerId = worker.id;
      job.startedAt = new Date();
      job.attempts = job.attempts + 1;
      job.progress = 0;
      await job.save({ transaction });

      worker.currentJobId = job.id;
      await worker.save({ transaction });

      await logSystemEvent({
        jobId: job.id,
        message: `Scheduled & assigned to worker [${worker.name}] (Attempt ${job.attempts}/${job.maxRetries})`,
        level: "info",
        workerName: worker.name,
      });

      // Broadcast single job update
      broadcast("job_updated", job);
      broadcast("worker_updated", worker);
    }

    await transaction.commit();
    
    // Broadcast updated stats
    const { broadcastStats } = require("../controllers/jobController.js");
    await broadcastStats();

  } catch (error) {
    await transaction.rollback();
    console.error("Scheduler encountered an error:", error);
  } finally {
    isScheduling = false;
  }
}

// Start a periodic schedule check every 2 seconds
function startScheduler() {
  console.log("Scheduler loop initialized.");
  setInterval(scheduleJobs, 2000);
}

module.exports = {
  scheduleJobs,
  startScheduler,
};
