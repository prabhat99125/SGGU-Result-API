const express = require("express");
const app = express();
const student = require("./DetaBase/student");
const analisis = require("./DetaBase/analisis");
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');
const NoCache = require("node-cache");
const { json } = require("stream/consumers");
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

app.get("/", (req, res) => {
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
    let studentsList = [];
    try {
        if (nodecache.has("cacheStudents")) {
            studentsList = JSON.parse(nodecache.get("cacheStudents"))
        } else {
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
            nodecache.set("cacheStudents", JSON.stringify(studentsList));
        }
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

// const parsenteg = (marks) => {
//     let parsenteg = 0;
//     // Check if marks[0] is an array
//     if (Array.isArray(marks[0])) {
//         // Process the array if it's valid
//         marks[0].forEach((mrs) => {
//             // console.log(mrs.sem4);  // Log each element (you can modify as needed)
//             // Assuming you want to calculate the percentage of marks
//             parsenteg += mrs.sem4.externalMarks + mrs.sem4.internalMarks;  // Modify if necessary
//         });
//         console.log(parsenteg)
//     } else {
//         console.error('Expected marks[0] to be an array, but found:', marks[0]);
//     }

//     // Calculate the percentage if needed, this part assumes there are 9 subjects
//     console.log(parsenteg );  // Log or return the percentage
//     return parsenteg;
// };

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
