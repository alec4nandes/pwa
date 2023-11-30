const express = require("express"),
    cors = require("cors"),
    bodyParser = require("body-parser"),
    admin = require("firebase-admin");

const { logger } = require("firebase-functions");

const ROOT = "https://us-central1-express-10101.cloudfunctions.net";

const schedule = express();
schedule.use(cors({ credentials: true }));
schedule.use(bodyParser.json());

schedule.post("/", async (req, res) => {
    try {
        const querySnapshot = await admin.firestore().collection("users").get(),
            subscriptions = querySnapshot.docs
                .map((doc) => doc.data().subscription)
                .filter(Boolean);
        for (const subscription of subscriptions) {
            await pushToUser(subscription);
        }
        logger.log("Pushed to all!");
        res.send("SUCCESS");
    } catch (err) {
        logger.log(err);
        res.send(err);
    }
});

async function pushToUser(subscription) {
    try {
        await fetch(`${ROOT}/push`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subscription }),
        });
    } catch (err) {
        console.error(err);
    }
}

/* **************** */

// The Cloud Functions for Firebase SDK to set up triggers and logging.
const { onSchedule } = require("firebase-functions/v2/scheduler");
// Imports the Google Cloud Tasks library.

// ALREADY INITIALIZED in index.js
// The Firebase Admin SDK to delete inactive users.
// const admin = require("firebase-admin");
// admin.initializeApp();

// The es6-promise-pool to limit the concurrency of promises.
const PromisePool = require("es6-promise-pool").default;
// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;

// Run once a day at midnight, to clean up the users
// Manually run the task here https://console.cloud.google.com/cloudscheduler
// TODO: implement:
// LOGIC: every [n] days, run this function that checks when the next full or new moon is.
// Find the earliest timezone in UTC, and find the offset from Date.now().
// Pass moonType, timeOffset, and timeZone as params to createHttpTask() [rename!]

// exports.accountcleanup = onSchedule("every day 00:00", async (event) => {
//     // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
//     const promisePool = new PromisePool(
//         () => createHttpTask(),
//         MAX_CONCURRENT
//     );
//     await promisePool.start();

//     logger.log("User cleanup finished");
// });

// exports.scheduledFunctionCrontab = onSchedule("5 11 * * *", async (event) => {
//     // ...
// });

/* **************** */

const { CloudTasksClient } = require("@google-cloud/tasks");

// Instantiates a client.
// TODO: enable and incorporate in scheduled function
// const client = new CloudTasksClient();

// createHttpTask();

async function createHttpTask() {
    const project = "express-10101";
    const queue = "my-queue";
    const location = "us-central1";
    const url = `${ROOT}/schedule`;
    const payload = ""; // not needed
    const inSeconds = 60;

    // Construct the fully qualified queue name.
    const parent = client.queuePath(project, location, queue);

    const task = {
        httpRequest: {
            headers: {
                "Content-Type": "text/plain", // Set content type to ensure compatibility your application's request parsing
            },
            httpMethod: "POST",
            url,
        },
    };

    if (payload) {
        task.httpRequest.body = Buffer.from(payload).toString("base64");
    }

    if (inSeconds) {
        // The time when the task is scheduled to be attempted.
        task.scheduleTime = {
            seconds: parseInt(inSeconds) + Date.now() / 1000,
        };
    }

    // Send create task request.
    console.log("Sending task:");
    console.log(task);
    const request = { parent: parent, task: task };
    const [response] = await client.createTask(request);
    console.log(`Created task ${response.name}`);
}

/* **************** */

module.exports = { createHttpTask, schedule };
