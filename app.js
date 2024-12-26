const express = require("express");
const app = express();
const student = require("./DetaBase/student");
const analisis = require("./DetaBase/analisis");
const cors = require('cors');
const { set } = require("mongoose");

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
    let respons = await analisis.find({ _id: "676cad40ce9bf952d7ff18fb" })
    const update = await analisis.findOneAndUpdate({ _id: "676cad40ce9bf952d7ff18fb" }, { AllReq: respons[0].AllReq + 1 })
    next()
})
app.get("/", (req, res) => {
    res.send("<h1>server start<h1>");
});
app.get("/result/:College", async (req, res) => {
    const student = [];
    try {
        const resposn = await student.find({ College: req.params.College });
        resposn.map((val) => {
            let studentObj = { SeatNo: val.SeatNo, Name: val.Name, College: (Math.random()*100).toFixed(), URL: val._id.toString() }
            student.push(studentObj)
        });
        res.send(student)
    } catch (error) {
        res.send({})
    }
});
app.get("/Bcom/:id", async (req, res) => {
    try {
        const resposn = await student.find({ _id: req.params.id });
        res.send(resposn);
    } catch (error) {
        res.send({})
    }
})
app.listen(4000, console.log("servert start"));