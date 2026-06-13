const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Job = sequelize.define("Job", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM("math", "delay", "sorting", "failure_sim", "crash_sim"),
    allowNull: false,
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 1 = LOW, 2 = MEDIUM, 3 = HIGH
    allowNull: false,
    validate: {
      min: 1,
      max: 3,
    },
  },
  status: {
    type: DataTypes.ENUM("PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"),
    defaultValue: "PENDING",
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  result: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Job;
