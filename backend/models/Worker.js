const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Worker = sequelize.define("Worker", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "DEAD"),
    defaultValue: "ACTIVE",
    allowNull: false,
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  cpuUsage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false,
  },
  memoryUsage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false,
  },
  currentJobId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
});

module.exports = Worker;
