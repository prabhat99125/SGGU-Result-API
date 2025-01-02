const express = require("express");
const app = express();
const student = require("./DetaBase/student");
const analisis = require("./DetaBase/analisis");
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');
const NoCache = require("node-cache");
const { json } = require("stream/consumers");
const { console } = require("inspector");
const nodecache = new NoCache();
// Define the number of worker processes based on CPU cores
const numCPUs = os.cpus().length;

const corsOptions = {
    origin: '*', // Replace with your allowed domain
    methods: ['GET'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

// Use CORS middleware with the options
app.use(cors(corsOptions));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use(async (req, res, next) => {
//     try {
//         let respons = await analisis.find({ _id: "676cad40ce9bf952d7ff18fb" });
//         await analisis.findOneAndUpdate(
//             { _id: "676cad40ce9bf952d7ff18fb" },
//             { AllReq: respons[0].AllReq + 1 }
//         );
//     } catch (error) {
//         console.error("Error in analysis update:", error);
//     }
//     next();
// });

let AllStudents = []
const cacheFuc = async () => {
    if (nodecache.has("AllcacheStudents")) {
        AllStudents = JSON.parse(nodecache.get("AllcacheStudents"))
    } else {
        const resposn = await student.find({});
        resposn.map((val) => {
            AllStudents.push(val);
        });
        nodecache.set("AllcacheStudents", JSON.stringify(AllStudents), 86400);
    }
    console.log("AllStudents");
}
const GetTotal = (marks) => {
    let total = 0;
    if (!marks || !Array.isArray(marks.result)) {
        return 0.00;
    }
    marks.result.forEach((val) => {
        let { externalMarks, internalMarks } = val;
        total += externalMarks + internalMarks;
    });
    return Number((total / 9).toFixed(2));
};

app.get("/", (req, res) => {
    cacheFuc();
    res.render('index');
});

app.post("/spid", async (req, res) => {
    try {
        // Ensure req.body.array exists and is an array
        if (!Array.isArray(req.body.array)) {
            return res.status(400).send({ error: "Invalid input: array is required." });
        }

        // Query the database for each SPDID
        const studentsRes = await Promise.all(
            req.body.array.map(async (val) => {
                const StuRes = await student.find({ SPDID: val });
                return StuRes; // Return the result
            })
        );

        // Check if there are results
        if (!studentsRes || studentsRes.length === 0 || !studentsRes[0][0]) {
            return res.status(404).send({ error: "No student data found." });
        }

        // Log the `sem4` section
        studentsRes.map((results) => {
            parsenteg(results);  // Call the function for each result
        });

        // Send the first student as the response
        res.status(200).send(studentsRes[0][0]);
    } catch (error) {
        console.error("Error fetching student data:", error);
        res.status(500).send({ error: "Internal server error." });
    }
});

app.get("/result/:College", async (req, res) => {
    await cacheFuc();
    const findCollege = AllStudents.filter(items => String(items.College) === String(req.params.College));
    if (!findCollege.length) {
        return res.status(404).send({ error: "No students found for the specified college." });
    }
    let NameAndMarks = findCollege.map(val => ({
        SeatNo: val.SeatNo,
        Name: val.Name,
        Marks: GetTotal(val.sem4),
        URL: val._id.toString(),
    }));
    res.send(NameAndMarks);
});

// app.get("/Bcom/:id", async (req, res) => {
//     await cacheFuc();
//     let studetnRes = AllStudents.some(result => result._id === req.params.id);
//     res.send(AllStudents)
//     // console.log(AllStudents);
//     // const resposn = await student.find({ _id: req.params.id });
//     // if (!resposn[0].count) {
//     //     const upDate = await student.findOneAndUpdate(
//     //         { _id: req.params.id },
//     //         { $set: { count: 1 } }, // Set `sem5` to 1 if it doesn't exist
//     //         { new: true }
//     //     );
//     // } else {
//     //     const upDate = await student.findOneAndUpdate(
//     //         { _id: req.params.id },
//     //         { $inc: { count: 1 } }, // Increment sem5 by 1
//     //         { upsert: true, new: true } // Create the document if it doesn't exist, and return the updated document
//     //     );
//     // }
//     // res.send(resposn);
// });
app.get("/Bcom/:id", async (req, res) => {
    try {
        await cacheFuc(); // Ensure the cache is initialized

        // Find the student with the matching _id
        const student = AllStudents.find(
            result => result._id === req.params.id
        );

        if (student) {
            res.json(student); // Send the matched student data
        } else {
            res.status(404).json({ message: "Student not found" }); // Send 404 if no match
        }
    } catch (error) {
        console.error("Error finding student:", error);
        res.status(500).send("Internal Server Error");
    }
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
