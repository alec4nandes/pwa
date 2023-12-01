const ROOT = "https://us-central1-express-10101.cloudfunctions.net";

/* **************** */
const admin = require("firebase-admin"),
    // Imports the Google Cloud Tasks library.
    { CloudTasksClient } = require("@google-cloud/tasks"),
    // Instantiates a client.
    client = new CloudTasksClient();

// Every midnight PST the Cloud Scheduler calls this function:
async function scheduledPush() {
    const data = await getUsersData();
    for (const datum of data) {
        await addTask(datum);
    }
}

async function getUsersData() {
    const querySnapshot = await admin.firestore().collection("users").get(),
        subscriptions = querySnapshot.docs.map((doc) => doc.data());
    return subscriptions;
}

async function addTask({ coordinates, subscription }) {
    if (!coordinates) {
        return;
    }
    const project = "express-10101",
        location = "us-central1",
        queue = "my-queue",
        // Construct the fully qualified queue name.
        parent = client.queuePath(project, location, queue),
        url = `${ROOT}/push`,
        seconds = await processCoordinates(coordinates);
    for (const [timeframe, inSeconds] of Object.entries(seconds)) {
        const message = timeframe === "sunrise_offset" ? "SUNRISE" : "SUNSET",
            payload = { subscription, message },
            task = {
                httpRequest: {
                    url,
                    headers: {
                        "Content-Type": "text/plain", // Set content type to ensure compatibility your application's request parsing
                    },
                    httpMethod: "POST",
                    body: Buffer.from(JSON.stringify(payload)).toString(
                        "base64"
                    ),
                },
                scheduleTime: {
                    seconds: parseInt(inSeconds) + Date.now() / 1000,
                },
            };
        // Send create task request.
        console.log("Sending task:");
        console.log(task);
        const request = { parent, task },
            [response] = await client.createTask(request);
        console.log(`Created task ${response.name}`);
    }
}

async function processCoordinates(coordinates) {
    const { latitude, longitude } = coordinates,
        url = `https://api.sunrisesunset.io/json/?lat=${latitude}&lng=${longitude}`,
        { results: data } = await (await fetch(url)).json(),
        { date, sunrise, sunset, utc_offset } = data,
        dateRise = parseDate(date, sunrise, utc_offset),
        dateSet = parseDate(date, sunset, utc_offset),
        now = new Date();
    return {
        sunrise_offset: getSecondsBetween(dateRise, now),
        sunset_offset: getSecondsBetween(dateSet, now),
    };
}

function parseDate(date, time, offset) {
    const [y, mt, d] = date.split("-"),
        [t, ampm] = time.split(" "),
        isAm = ampm === "AM";
    let [h, m, s] = t.split(":");
    const is12 = +h === 12;
    h = ((isAm ? (is12 ? 0 : h) : is12 ? h : +h + 12) + "").padStart(2, "0");
    const isNeg = offset < 0 ? "-" : "+",
        hours = offset / 60,
        offsetString = isNeg + (Math.abs(hours) * 100 + "").padStart(4, "0"),
        dateString = `${y}-${mt}-${d}T${h}:${m}:${s}${offsetString}`;
    console.log(dateString);
    return new Date(dateString);
}

function getSecondsBetween(date1, date2) {
    return (date1.getTime() - date2.getTime()) / 1000;
}

module.exports = { scheduledPush };
