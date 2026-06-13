const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const JobLog = sequelize.define("JobLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  level: {
    type: DataTypes.ENUM("info", "warn", "error"),
    defaultValue: "info",
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
});

module.exports = JobLog;
