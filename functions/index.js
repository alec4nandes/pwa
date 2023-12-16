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
setUse("/firebase.js", "/public/firebase.js");
setUse("/notifications.js", "/public/notifications.js");
setUse("/profile.css", "/public/css/profile.css");
setUse("/random-sutta.js", "/public/random-sutta.js");
setUse("/register-sw.js", "/public/register-sw.js");
setUse("/service-worker.js", "/public/service-worker.js");
setUse("/splash.js", "/public/splash.js");
setUse("/style.css", "/public/css/style.css");
setUse("/sutta.css", "/public/css/sutta.css");
setUse("/welcome.js", "/public/welcome.js");
const pwaFilesInIndex = [
    "apple-touch-icon.png",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "manifest.json",
    "safari-pinned-tab.svg",
    "favicon.ico",
    "mstile-144x144.png",
    "browserconfig.xml",
    "android-chrome-36x36.png",
    "android-chrome-48x48.png",
    "android-chrome-72x72.png",
    "android-chrome-96x96.png",
    "android-chrome-144x144.png",
    "android-chrome-192x192.png",
    "android-chrome-256x256.png",
    "android-chrome-384x384.png",
    "android-chrome-512x512.png",
    "maskable_icon.png",
];
pwaFilesInIndex.forEach((file) => setUse(`/${file}`, `/pwa/${file}`));
app.set("view engine", "pug");

const title = "Uposatha",
    description = "Buddhist resources and Uposatha reminders.";

app.get("/welcome", (req, res) =>
    res.render(path.join(__dirname, "/public/templates/welcome.pug"), {
        title,
        description,
    })
);
app.get("/", (req, res) => mustHaveToken(req, res, true, "profile"));
app.get("/profile", (req, res) => mustHaveToken(req, res, false, "profile"));
app.get("/sutta", (req, res) => mustHaveToken(req, res, false, "sutta"));
app.get("/resources", (req, res) =>
    mustHaveToken(req, res, false, "resources")
);
app.get("/podcasts", (req, res) => mustHaveToken(req, res, false, "podcasts"));
app.get("/pali", (req, res) => mustHaveToken(req, res, false, "pali"));

async function mustHaveToken(req, res, isHome, fileName) {
    const { email, email_verified } = await getEmailInfo(req);
    if (email && email_verified) {
        isHome
            ? res.redirect(`./${fileName}`)
            : res.render(
                  path.join(__dirname, `/public/templates/${fileName}.pug`),
                  {
                      email,
                      title,
                      description,
                  }
              );
    } else {
        isHome
            ? res.render(path.join(__dirname, "/public/templates/index.pug"), {
                  title,
                  description,
              })
            : res.redirect("./");
    }
}

async function getEmailInfo(req) {
    const token = readToken(req),
        user = token && (await getUserFromToken(token)),
        { email, email_verified } = user || {};
    return { email, email_verified };
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

// const testing = functions.pubsub.schedule("* * * * *").onRun((context) => {
//     return scheduledPush(undefined, true);
// });

module.exports = {
    express: functions.https.onRequest(app),
    push: functions.https.onRequest(pushApi),
    schedule,
    // testing,
};
