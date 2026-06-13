const { Worker, Job } = require("../models");
const { logSystemEvent, broadcast } = require("../services/eventEmitter.js");
const { broadcastStats } = require("./jobController.js");

const workerController = {
  // Register a worker
  registerWorker: async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Worker name is required" });
      }

      // Check if worker with this name already exists
      let worker = await Worker.findOne({ where: { name } });

      if (worker) {
        // Reactivate worker
        worker.status = "ACTIVE";
        worker.lastHeartbeat = new Date();
        worker.currentJobId = null;
        await worker.save();
        
        await logSystemEvent({
          message: `Worker registered (reconnected): ${name}`,
          level: "info",
          workerName: name,
        });
      } else {
        // Create new worker
        worker = await Worker.create({
          name,
          status: "ACTIVE",
          lastHeartbeat: new Date(),
        });

        await logSystemEvent({
          message: `New worker registered: ${name}`,
          level: "info",
          workerName: name,
        });
      }

      broadcastStats();
      broadcast("worker_updated", worker);

      return res.status(200).json({
        message: "Worker registered successfully",
        workerId: worker.id,
        name: worker.name,
      });
    } catch (error) {
      console.error("Error registering worker:", error);
      return res.status(500).json({ error: "Failed to register worker" });
    }
  },

  // Receive worker heartbeat
  heartbeat: async (req, res) => {
    try {
      const { id } = req.params;
      const { cpuUsage = 0, memoryUsage = 0 } = req.body;

      const worker = await Worker.findByPk(id);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      // If worker was dead, revive it
      const wasDead = worker.status === "DEAD";

      worker.status = "ACTIVE";
      worker.lastHeartbeat = new Date();
      worker.cpuUsage = cpuUsage;
      worker.memoryUsage = memoryUsage;
      await worker.save();

      if (wasDead) {
        await logSystemEvent({
          message: `Worker ${worker.name} came back online`,
          level: "info",
          workerName: worker.name,
        });
        broadcastStats();
      }

      broadcast("worker_updated", worker);

      return res.json({ message: "Heartbeat acknowledged" });
    } catch (error) {
      console.error("Error updating worker heartbeat:", error);
      return res.status(500).json({ error: "Failed to update heartbeat" });
    }
  },

  // Worker polls for assigned jobs
  pollJob: async (req, res) => {
    try {
      const { id } = req.params;

      const worker = await Worker.findByPk(id);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      if (worker.status === "DEAD") {
        return res.status(403).json({ error: "Worker is marked dead. Please re-register." });
      }

      // Check if worker has an assigned job in RUNNING status
      if (worker.currentJobId) {
        const job = await Job.findByPk(worker.currentJobId);
        if (job && job.status === "RUNNING") {
          return res.json({ job });
        } else {
          // Sync issue: worker has job ID but job is not running/exists.
          worker.currentJobId = null;
          await worker.save();
          broadcast("worker_updated", worker);
        }
      }

      return res.json({ job: null });
    } catch (error) {
      console.error("Error during worker polling:", error);
      return res.status(500).json({ error: "Polling failed" });
    }
  },

  // Get all workers
  getWorkers: async (req, res) => {
    try {
      const workers = await Worker.findAll({
        order: [["name", "ASC"]],
      });
      return res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      return res.status(500).json({ error: "Failed to fetch workers" });
    }
  },
};

module.exports = workerController;
