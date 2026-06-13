const express = require("express");
const router = express.Router();
const { jobController } = require("../controllers/jobController.js");

// Client & Worker endpoints
router.post("/", jobController.submitJob);
router.get("/", jobController.getJobs);
router.get("/stats", jobController.getStats);
router.get("/:id", jobController.getJobDetails);
router.post("/:id/cancel", jobController.cancelJob);
router.post("/:id/progress", jobController.updateJobProgress);

module.exports = router;
