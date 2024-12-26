const mongoose = require("mongoose")
require("dotenv").config();

const { db2 } = require("./configDB");  // Import db2 connection
// const mongoose = db2;  // Use db2 for this model

// Define the schema
const studentSchema = new mongoose.Schema({
  AllReq : Number,
});

// Create the model for Database 2
const StudentDb2 = db2.model("BcomeAnalisis", studentSchema);

// Export the model for Database 2
module.exports = StudentDb2;
