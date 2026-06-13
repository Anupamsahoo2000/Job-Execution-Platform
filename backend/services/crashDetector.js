const { Op } = require("sequelize");
const { Worker, Job, sequelize } = require("../models");
const { logSystemEvent, broadcast } = require("./eventEmitter.js");

async function detectCrashes() {
  const activeThreshold = new Date(Date.now() - 15000); // 15 seconds without heartbeat
  
  const transaction = await sequelize.transaction();
  try {
    // Find workers that were active but missed heartbeats
    const crashedWorkers = await Worker.findAll({
      where: {
        status: "ACTIVE",
        lastHeartbeat: {
          [Op.lte]: activeThreshold,
        },
      },
      transaction,
    });

    if (crashedWorkers.length === 0) {
      await transaction.commit();
      return;
    }

    for (const worker of crashedWorkers) {
      worker.status = "DEAD";
      const affectedJobId = worker.currentJobId;
      worker.currentJobId = null;
      await worker.save({ transaction });

      await logSystemEvent({
        message: `Worker [${worker.name}] detected as OFFLINE/CRASHED (no heartbeat for 15s)`,
        level: "error",
        workerName: worker.name,
      });

      broadcast("worker_updated", worker);

      // Handle the job that was running on this crashed worker
      if (affectedJobId) {
        const job = await Job.findByPk(affectedJobId, { transaction });
        if (job && job.status === "RUNNING") {
          await logSystemEvent({
            jobId: job.id,
            message: `Worker crashed during execution. Checking retry policy...`,
            level: "warn",
            workerName: worker.name,
          });

          if (job.attempts < job.maxRetries) {
            job.status = "PENDING";
            job.workerId = null;
            job.progress = 0;
            await job.save({ transaction });

            await logSystemEvent({
              jobId: job.id,
              message: `Job rescheduled. Assigned worker crashed (Attempt ${job.attempts}/${job.maxRetries})`,
              level: "warn",
            });
          } else {
            job.status = "FAILED";
            job.error = "Worker crashed and max retries reached.";
            job.completedAt = new Date();
            await job.save({ transaction });

            await logSystemEvent({
              jobId: job.id,
              message: `Job failed. Worker crashed and max retries exceeded (${job.attempts}/${job.maxRetries})`,
              level: "error",
            });
          }

          broadcast("job_updated", job);
        }
      }
    }

    await transaction.commit();

    // Trigger scheduler to reassign jobs if workers are available
    const scheduler = require("./scheduler.js");
    scheduler.scheduleJobs();

    // Broadcast updated stats
    const { broadcastStats } = require("../controllers/jobController.js");
    await broadcastStats();

  } catch (error) {
    await transaction.rollback();
    console.error("Crash Detector encountered an error:", error);
  }
}

function startCrashDetector() {
  console.log("Crash detector loop initialized.");
  setInterval(detectCrashes, 5000); // Check every 5 seconds
}

module.exports = {
  detectCrashes,
  startCrashDetector,
};
