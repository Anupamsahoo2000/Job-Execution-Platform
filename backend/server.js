const express = require("express");
const app = express();
const cors = require("cors");
const sequelize = require("./config/db.js");
require("dotenv").config();

app.use(express.json());
app.use(cors());



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send(" server is running ");
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});