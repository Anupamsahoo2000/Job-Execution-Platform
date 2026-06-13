const express = require("express");
const router = express.Router();
const workerController = require("../controllers/workerController.js");

// Worker routes
router.post("/register", workerController.registerWorker);
router.get("/", workerController.getWorkers);
router.post("/:id/heartbeat", workerController.heartbeat);
router.get("/:id/poll", workerController.pollJob);

module.exports = router;
