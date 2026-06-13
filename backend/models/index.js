const Job = require("./Job.js");
const Worker = require("./Worker.js");
const JobLog = require("./JobLog.js");
const sequelize = require("../config/db.js");

// Associations
Job.hasMany(JobLog, { foreignKey: "jobId", as: "logs", onDelete: "CASCADE" });
JobLog.belongsTo(Job, { foreignKey: "jobId" });

Worker.hasMany(Job, { foreignKey: "workerId", as: "jobs" });
Job.belongsTo(Worker, { foreignKey: "workerId", as: "worker" });

module.exports = {
  sequelize,
  Job,
  Worker,
  JobLog,
};
