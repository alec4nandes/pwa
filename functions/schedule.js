const admin = require("firebase-admin"),
    // Imports the Google Cloud Tasks library.
    { CloudTasksClient } = require("@google-cloud/tasks"),
    // Instantiates a client.
    client = new CloudTasksClient();

// Every midnight PST the Cloud Scheduler calls this function:
async function scheduledPush(advance) {
    const data = await getUsersData();
    for (const datum of data) {
        await uposathaPush({ ...datum, advance });
    }
}

async function getUsersData() {
    const querySnapshot = await admin.firestore().collection("users").get(),
        subscriptions = querySnapshot.docs.map((doc) => doc.data());
    return subscriptions;
}

// FULL & NEW MOON ALERTS
// On the days of full and new moons, send push alerts for both sunrise and sunset

async function uposathaPush({ coordinates, subscription, advance }) {
    if (!coordinates) {
        return;
    }
    const date = getAdvancedDateString(advance),
        sun = await getSunData(coordinates, date),
        timezone = sun.results.utc_offset / 60,
        moon = await getMoonData(coordinates, date, timezone),
        { data: moonData } = moon.properties,
        phase = moonData.curphase,
        proceed = ["New Moon", "Full Moon"].includes(phase);
    if (!proceed) {
        return;
    }
    const { sunrise, sunset } = sun.results,
        phaseTime = moonData.closestphase.time;
    for (const [status, time] of Object.entries({ sunrise, sunset })) {
        const isSunrise = status === "sunrise",
            message = `${phase.toUpperCase()} UPOSATHA ${
                isSunrise ? "BEGINS" : "ENDS"
            }
            ${isSunrise ? `Sunrise: ${sunrise} / ` : ""}Sunset: ${sunset}
            ${phase}: ${phaseTime}`,
            seconds = getSecondsInAdvance(date, time, timezone);
        await addTask({ subscription, message, seconds });
    }
}

// check 3 days ahead to make sure all timezones are included
function getAdvancedDateString(days = 3) {
    const advanced = new Date();
    advanced.setDate(advanced.getDate() + days);
    const y = advanced.getFullYear(),
        m = advanced.getMonth() + 1,
        d = advanced.getDate(),
        pad = (n) => (n + "").padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)}`;
}

async function getSunData(coordinates, date) {
    const { latitude: lat, longitude: lng } = coordinates,
        root = "https://api.sunrisesunset.io/json/",
        query = `?lat=${lat}&lng=${lng}&date=${date}`,
        url = root + query;
    return await (await fetch(url)).json();
}

async function getMoonData(coordinates, date, timezone) {
    const { latitude: lat, longitude: lng } = coordinates,
        root = "https://aa.usno.navy.mil/api/rstt/oneday",
        query = `?date=${date}&coords=${lat},${lng}&tz=${timezone}`,
        url = root + query;
    return await (await fetch(url)).json();
}

function getSecondsInAdvance(date, time, timezone) {
    const then = parseDate(date, time, timezone),
        now = new Date();
    return getSecondsBetween(then, now);
}

function parseDate(date, time, timezone) {
    const [y, mt, d] = date.split("-"),
        [t, ampm] = time.split(" "),
        isAm = ampm === "AM";
    let [h, m, s] = t.split(":");
    const is12 = +h === 12;
    h = ((isAm ? (is12 ? 0 : h) : is12 ? h : +h + 12) + "").padStart(2, "0");
    const isNeg = timezone < 0 ? "-" : "+",
        offset = isNeg + (Math.abs(timezone) * 100 + "").padStart(4, "0"),
        dateString = `${y}-${mt}-${d}T${h}:${m}:${s}${offset}`;
    return new Date(dateString);
}

function getSecondsBetween(date1, date2) {
    return (date1.getTime() - date2.getTime()) / 1000;
}

async function addTask({ subscription, message, seconds }) {
    const project = "express-10101",
        location = "us-central1",
        queue = "my-queue",
        // Construct the fully qualified queue name.
        parent = client.queuePath(project, location, queue),
        url = "https://us-central1-express-10101.cloudfunctions.net/push",
        payload = { subscription, message },
        task = {
            httpRequest: {
                url,
                headers: {
                    "Content-Type": "application/json",
                },
                httpMethod: "POST",
                body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            },
            scheduleTime: {
                seconds: parseInt(seconds) + Date.now() / 1000,
            },
        };
    // Send create task request.
    console.log("Sending task:");
    console.log(task);
    const request = { parent, task },
        [response] = await client.createTask(request);
    console.log(`Created task ${response.name}`);
}

module.exports = { scheduledPush };
