const express = require("express");
const app = express();
const student = require("./DetaBase/student");
const analisis = require("./DetaBase/analisis");
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');

// Define the number of worker processes based on CPU cores
const numCPUs = os.cpus().length;

const corsOptions = {
    origin: '*', // Replace with your allowed domain
    methods: ['GET'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

// Use CORS middleware with the options
app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(async (req, res, next) => {
    try {
        let respons = await analisis.find({ _id: "676cad40ce9bf952d7ff18fb" });
        await analisis.findOneAndUpdate(
            { _id: "676cad40ce9bf952d7ff18fb" },
            { AllReq: respons[0].AllReq + 1 }
        );
    } catch (error) {
        console.error("Error in analysis update:", error);
    }
    next();
});


app.get("/", (req, res) => {
    res.send("<h1>server start<h1>");
});

app.get("/result/:College", async (req, res) => {
    const studentsList = [];
    try {
        const resposn = await student.find({ College: req.params.College });
        resposn.map((val) => {
            let studentObj = {
                SeatNo: val.SeatNo,
                Name: val.Name,
                Marks: Number((Math.random() * 100).toFixed()),
                URL: val._id.toString()
            };
            studentsList.push(studentObj);
        });
        res.send(studentsList);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while fetching students" });
    }
});

app.get("/Bcom/:id", async (req, res) => {

    const resposn = await student.find({ _id: req.params.id });
    if (!resposn[0].count) {
        const upDate = await student.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { count: 1 } }, // Set `sem5` to 1 if it doesn't exist
            { new: true }
        );
    } else {
        const upDate = await student.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { count: 1 } }, // Increment sem5 by 1
            { upsert: true, new: true } // Create the document if it doesn't exist, and return the updated document
        );

    }
    res.send(resposn);

});

// Check if the current process is the master
if (cluster.isMaster) {
    // Fork worker processes for each CPU core
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    // Worker processes will use the same Express app
    app.listen(4000, () => {
        console.log("Server started on port 4000");
    });
}
