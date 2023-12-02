const admin = require("firebase-admin"),
    serviceAccount = require("./service-account-key.json"),
    express = require("express"),
    functions = require("firebase-functions"),
    path = require("path"),
    { pushApi } = require("./push-server.js"),
    { scheduledPush } = require("./schedule.js");

// The Firebase Admin SDK is used here to verify the ID token.
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express(),
    setUse = (desiredPath, realPath) =>
        app.use(desiredPath, express.static(path.join(__dirname, realPath)));

setUse("/assets", "/assets");
setUse("/service-worker.js", "/public/service-worker.js");
setUse("/reloader.js", "/public/reloader.js");
setUse("/firebase.js", "/public/firebase.js");
setUse("/notifications.js", "/public/notifications.js");
setUse("/profile.css", "/public/profile.css");
const pwaFilesInIndex = [
    "apple-touch-icon.png",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "manifest.json",
    "safari-pinned-tab.svg",
    "favicon.ico",
    "mstile-144x144.png",
    "browserconfig.xml",
    "style.css",
    "android-chrome-144x144.png",
];
pwaFilesInIndex.forEach((file) => setUse(`/${file}`, `/pwa/${file}`));
app.set("view engine", "pug");

app.get("/", (req, res) => mustHaveToken(req, res, true));
app.get("/profile", (req, res) => mustHaveToken(req, res, false));

async function mustHaveToken(req, res, isHome) {
    const token = readToken(req),
        user = token && (await getUserFromToken(token)),
        { email, email_verified } = user || {};
    if (email && email_verified) {
        isHome
            ? res.redirect("./profile")
            : res.render(path.join(__dirname, "/public/profile.pug"), {
                  email,
              });
    } else {
        isHome
            ? res.sendFile(path.join(__dirname, "/public/index.html"))
            : res.redirect("./");
    }
}

function readToken(req) {
    const authorizationHeader = req.headers.authorization || "";
    const components = authorizationHeader.split(" ");
    return components.length > 1 ? components[1] : "";
}

async function getUserFromToken(token) {
    try {
        return await admin.auth().verifyIdToken(token);
    } catch (err) {
        console.error(err);
        return false;
    }
}

/* ****************** */

const schedule = functions.pubsub
    .schedule("0 0 * * *") // midnight every night
    // .timeZone("UTC")
    .onRun((context) => {
        return scheduledPush();
    });

module.exports = {
    express: functions.https.onRequest(app),
    push: functions.https.onRequest(pushApi),
    schedule,
};
