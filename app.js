const express = require("express");
const app = express();
const mongoose = require("./DetaBase/db");
const cors = require('cors')

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.send("<h1>server start<h1>");
});
app.get("/result/:College", async (req, res) => {
    const student = [];
    try {
        const resposn = await mongoose.find({ College: req.params.College });
        resposn.map((val) => {
            let studentObj = { SeatNo: val.SeatNo, Name: val.Name, College: val.College, URL: val._id.toString() }
            student.push(studentObj)
        });
        res.send(student)
    } catch (error) {
        res.send(error)
    }
});
app.get("/Bcom/:id", async (req, res) => {
    try {
        const resposn = await mongoose.find({_id : req.params.id});
        res.send(resposn);
    } catch (error) {
        res.send(error)
    }
})
app.listen(4000, console.log("servert start"));