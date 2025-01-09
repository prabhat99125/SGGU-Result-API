const mongoose = require("mongoose");
require("dotenv").config();

// Connect to the first database
const db1 = mongoose.createConnection("mongodb+srv://itu:123@cluster0.hr20s.mongodb.net/college");

db1.on("connected", () => console.log("Connected to Database 1"));
db1.on("error", (err) => console.error("Error connecting to Database 1:", err));

// Connect to the second database
const db2 = mongoose.createConnection("mongodb+srv://itu:123@cluster0.hr20s.mongodb.net/analisis");

db2.on("connected", () => console.log("Connected to Database 2"));
db2.on("error", (err) => console.error("Error connecting to Database 2:", err));

// Exporting the connections
module.exports = { db1, db2 };
