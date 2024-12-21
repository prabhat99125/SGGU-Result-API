const mongoose = require("mongoose");
require("dotenv").config()
const mongodbAtlas = 
mongoose.connect(process.env.DBURL)
    .then(() => console.log("mongoose conected"))
    .catch((e) => console.log(e));

const studentSchama = mongoose.Schema({
    Name: { type: String, },
    SPDID: { type: Number,  unique: true },
    SeatNo: { type: Number, },
    Enroll: { type: Number,  unique: true },
    Medium: { type: String, },
    FormNo: { type: Number, },
    College: { type: String, },
    sem5 : Object || Array
});
module.exports = mongoose.model("Student", studentSchama, "BCOM_SEM_5_2024");