const mongoose = require("mongoose")
const { db1 } = require("./configDB"); 
require("dotenv").config();


// Define the schema
const studentSchema = new mongoose.Schema({
  Name: { type: String },
  SPDID: { type: Number, unique: true },
  SeatNo: { type: Number },
  Enroll: { type: Number, unique: true },
  Medium: { type: String },
  FormNo: { type: Number },
  College: { type: String },
  RESULT: { type: Object || Array },
  sem2: { type: Object || Array },
  sem3: { type: Object || Array },
  sem4: { type: Object || Array },
  sem5: { type: Object || Array },
  count : Number,
  marks : Number
});

// Create the model for Database 1
const StudentDb1 = db1.model("Student", studentSchema, "BCOM_SEM_5_2024");

// Export the model for Database 1
module.exports = StudentDb1;
