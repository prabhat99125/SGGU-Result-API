const express = require("express");
const app = express();
const student = require("./DetaBase/student");
const analisis = require("./DetaBase/analisis");
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');
const NoCache = require("node-cache");
const { json } = require("stream/consumers");
// const { console } = require("inspector");
const nodecache = new NoCache();
const fs = require("fs/promises");
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
    try {
        // Check if data exists in cache
        if (nodecache.has("AllcacheStudents")) {
            AllStudents = nodecache.get("AllcacheStudents"); // No need to parse again
        } else {
            try {
                // Attempt to read from file
                const fileData = await fs.readFile("./StudentsData.json", "utf8");
                const parsedData = await JSON.parse(fileData);
                AllStudents = parsedData
                nodecache.set("AllcacheStudents", parsedData, 86400); // Store directly as object
            } catch (err) {
                // If file doesn't exist or is corrupted, fetch from database
                const response = await student.find({});
                AllStudents = response

                // Write the data to the file
                await fs.writeFile("./StudentsData.json", JSON.stringify(AllStudents, null, 2), { encoding: "utf8" });
                nodecache.set("AllcacheStudents", AllStudents, 86400); // Store directly as object
            }
        }
        console.log("Cache updated successfully.");
    } catch (e) {
        console.error("Error in cacheFuc:", e);
    }
};

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
    fs.rm("./StudentsData.json")
    console.log("rm file")
    cacheFuc();
    res.render('index');
});

app.post("/spid", async (req, res) => {
    const result = await Promise.all(
        req.body.array.map(async (val) => {
            const stuResult = await student.find({ SPDID: val });
            return stuResult; // No need for `Promise.resolve`, as `async` already wraps it in a promise
        })
    );

    res.send(result); // Sends the resolved results as the response

    // try {
    //     // Validate input
    //     const spidArray = req.body.array;
    //     if (!Array.isArray(spidArray) || spidArray.length === 0) {
    //         return res.status(400).send({ error: "Invalid input: array is required and cannot be empty." });
    //     }

    //     // Query the database for each SPDID
    //     const studentsRes = await Promise.all(
    //         spidArray.map(async (val) => {
    //             const result = await student.find({ SPDID: val });
    //             return result; // Return the query result
    //         })
    //     );

    //     // Flatten results
    //     const flatResults = studentsRes.flat();

    //     // Check if any data was found
    //     if (flatResults.length === 0) {
    //         return res.status(404).send({ error: "No student data found." });
    //     }

    //     // Process each result
    //     flatResults.forEach(parsenteg);

    //     // Send processed results in the response
    //     res.send(flatResults);
    // } catch (error) {
    //     console.error("Error fetching student data:", error.message || error);
    //     res.status(500).send({ error: "Internal server error." });
    // }
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

app.get("/Bcom/:id", async (req, res) => {
    try {
        await cacheFuc(); // Ensure the cache is initialized
        if (!AllStudents || AllStudents.length === 0) {
            return res.status(404).send("No students found.");
        }

        // Find the student with the matching `_id`
        const student = AllStudents.find(result =>
            (result._id.toHexString ? result._id.toHexString() : result._id) === req.params.id
        );

        if (student) {
            res.send([student]); // Send the matched student data
        } else {
            // If not found in `AllStudents`, query the database
            const response = await YourDatabaseCollection.find({ _id: req.params.id });
            if (response.length === 0) {
                return res.status(404).send("Student not found.");
            }

            const dbStudent = response[0];

            // Update `count` field
            if (!dbStudent.count) {
                await YourDatabaseCollection.findOneAndUpdate(
                    { _id: req.params.id },
                    { $set: { count: 1 } }, // Set count to 1 if it doesn't exist
                    { new: true }
                );
            } else {
                await YourDatabaseCollection.findOneAndUpdate(
                    { _id: req.params.id },
                    { $inc: { count: 1 } }, // Increment count by 1
                    { upsert: true, new: true } // Create if not exists, return updated
                );
            }
            res.send(dbStudent);
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
