const { Job, Worker, JobLog } = require("../models");
const { logSystemEvent, broadcast } = require("../services/eventEmitter.js");

// Helper to broadcast updated system statistics
async function broadcastStats() {
  try {
    const pending = await Job.count({ where: { status: "PENDING" } });
    const running = await Job.count({ where: { status: "RUNNING" } });
    const completed = await Job.count({ where: { status: "COMPLETED" } });
    const failed = await Job.count({ where: { status: "FAILED" } });
    const cancelled = await Job.count({ where: { status: "CANCELLED" } });
    
    const { Op } = require("sequelize");
    const activeWorkers = await Worker.count({
      where: {
        status: "ACTIVE",
        lastHeartbeat: {
          [Op.gt]: new Date(Date.now() - 15000),
        },
      },
    });

    broadcast("stats", {
      jobs: { pending, running, completed, failed, cancelled },
      activeWorkers,
    });
  } catch (err) {
    console.error("Failed to broadcast stats:", err);
  }
}

const jobController = {
  // Submit a new job
  submitJob: async (req, res) => {
    try {
      const { type, priority = 1, maxRetries = 3, payload = {} } = req.body;

      if (!type) {
        return res.status(400).json({ error: "Job type is required" });
      }

      const validTypes = ["math", "delay", "sorting", "failure_sim", "crash_sim"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid job type. Must be one of ${validTypes.join(", ")}` });
      }

      const job = await Job.create({
        type,
        priority,
        maxRetries,
        payload,
        status: "PENDING",
        progress: 0,
        attempts: 0,
      });

      await logSystemEvent({
        jobId: job.id,
        message: `Job submitted (Type: ${type}, Priority: ${priority}, Max Retries: ${maxRetries})`,
        level: "info",
      });

      // Trigger scheduler dynamically to run a cycle
      const scheduler = require("../services/scheduler.js");
      scheduler.scheduleJobs();

      broadcastStats();
      broadcast("job_updated", job);

      return res.status(201).json(job);
    } catch (error) {
      console.error("Error submitting job:", error);
      return res.status(500).json({ error: "Failed to submit job" });
    }
  },

  // Get all jobs (with optional filters)
  getJobs: async (req, res) => {
    try {
      const { status } = req.query;
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const jobs = await Job.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        limit: 100, // Limit to protect DB
      });

      return res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({ error: "Failed to fetch jobs" });
    }
  },

  // Get single job details including its execution logs
  getJobDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const job = await Job.findByPk(id, {
        include: [
          {
            model: JobLog,
            as: "logs",
            order: [["timestamp", "ASC"]],
          },
        ],
      });

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      return res.json(job);
    } catch (error) {
      console.error("Error fetching job details:", error);
      return res.status(500).json({ error: "Failed to fetch job details" });
    }
  },

  // Cancel a pending or running job
  cancelJob: async (req, res) => {
    try {
      const { id } = req.params;
      const job = await Job.findByPk(id);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
        return res.status(400).json({ error: `Cannot cancel job in ${job.status} status` });
      }

      const previousStatus = job.status;
      const assignedWorkerId = job.workerId;

      // Update job state
      job.status = "CANCELLED";
      job.completedAt = new Date();
      await job.save();

      await logSystemEvent({
        jobId: job.id,
        message: `Job was manually cancelled by user (was in state: ${previousStatus})`,
        level: "warn",
      });

      // If job was running, make the worker idle
      if (previousStatus === "RUNNING" && assignedWorkerId) {
        const worker = await Worker.findByPk(assignedWorkerId);
        if (worker) {
          worker.currentJobId = null;
          await worker.save();
          await logSystemEvent({
            jobId: job.id,
            message: `Worker ${worker.name} freed due to job cancellation`,
            level: "info",
            workerName: worker.name,
          });
        }
      }

      // Trigger scheduler to reuse workers if any
      const scheduler = require("../services/scheduler.js");
      scheduler.scheduleJobs();

      broadcastStats();
      broadcast("job_updated", job);

      return res.json({ message: "Job cancelled successfully", job });
    } catch (error) {
      console.error("Error cancelling job:", error);
      return res.status(500).json({ error: "Failed to cancel job" });
    }
  },

  // Worker progress report endpoint
  updateJobProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { progress, status, result, error, logMessage } = req.body;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if job is already finalized
      if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
        // If it was cancelled, let the worker know to stop executing
        return res.status(409).json({ error: "Job is already in a finalized state", status: job.status });
      }

      // Write execution log if provided
      if (logMessage) {
        const worker = job.workerId ? await Worker.findByPk(job.workerId) : null;
        await logSystemEvent({
          jobId: job.id,
          message: logMessage,
          level: status === "FAILED" ? "error" : "info",
          workerName: worker ? worker.name : null,
        });
      }

      // Update progress and status
      if (progress !== undefined) {
        job.progress = progress;
      }

      if (status) {
        job.status = status;
      }

      if (result) {
        job.result = result;
      }

      if (error) {
        job.error = error;
      }

      // Handle terminal states
      if (status === "COMPLETED") {
        job.completedAt = new Date();
        await job.save();

        // Free the worker
        if (job.workerId) {
          const worker = await Worker.findByPk(job.workerId);
          if (worker) {
            worker.currentJobId = null;
            await worker.save();
          }
        }

        // Trigger scheduler
        const scheduler = require("../services/scheduler.js");
        scheduler.scheduleJobs();
      } else if (status === "FAILED") {
        job.completedAt = new Date();
        
        // Handle Retry policy
        if (job.attempts < job.maxRetries) {
          job.status = "PENDING";
          job.workerId = null;
          job.progress = 0;
          await job.save();

          await logSystemEvent({
            jobId: job.id,
            message: `Job failed, but schedule retry (Attempt ${job.attempts} of ${job.maxRetries})`,
            level: "warn",
          });

          // Free the worker
          if (job.workerId) {
            const worker = await Worker.findByPk(job.workerId);
            if (worker) {
              worker.currentJobId = null;
              await worker.save();
            }
          }

          // Trigger scheduler
          const scheduler = require("../services/scheduler.js");
          scheduler.scheduleJobs();
        } else {
          // Permanently failed
          await job.save();

          await logSystemEvent({
            jobId: job.id,
            message: `Job failed permanently. Max retries exceeded (${job.attempts}/${job.maxRetries})`,
            level: "error",
          });

          // Free the worker
          if (job.workerId) {
            const worker = await Worker.findByPk(job.workerId);
            if (worker) {
              worker.currentJobId = null;
              await worker.save();
            }
          }
          
          const scheduler = require("../services/scheduler.js");
          scheduler.scheduleJobs();
        }
      } else {
        // Just a running progress update
        await job.save();
      }

      broadcastStats();
      broadcast("job_updated", job);

      return res.json({ message: "Progress updated", job });
    } catch (error) {
      console.error("Error updating progress:", error);
      return res.status(500).json({ error: "Failed to update progress" });
    }
  },

  // Get current system statistics
  getStats: async (req, res) => {
    try {
      const pending = await Job.count({ where: { status: "PENDING" } });
      const running = await Job.count({ where: { status: "RUNNING" } });
      const completed = await Job.count({ where: { status: "COMPLETED" } });
      const failed = await Job.count({ where: { status: "FAILED" } });
      const cancelled = await Job.count({ where: { status: "CANCELLED" } });

      const { Op } = require("sequelize");
      const activeWorkers = await Worker.count({
        where: {
          status: "ACTIVE",
          lastHeartbeat: {
            [Op.gt]: new Date(Date.now() - 15000), // Heartbeat received in last 15 seconds
          },
        },
      });

      return res.json({
        jobs: { pending, running, completed, failed, cancelled },
        activeWorkers,
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
};

module.exports = { jobController, broadcastStats };
