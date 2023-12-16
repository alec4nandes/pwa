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
    "/",
    "android-chrome-36x36.png", // Favicon, Android Chrome M39+ with 0.75 screen density
    "android-chrome-48x48.png", // Favicon, Android Chrome M39+ with 1.0 screen density
    "android-chrome-72x72.png", // Favicon, Android Chrome M39+ with 1.5 screen density
    "android-chrome-96x96.png", // Favicon, Android Chrome M39+ with 2.0 screen density
    "android-chrome-144x144.png", // Favicon, Android Chrome M39+ with 3.0 screen density
    "android-chrome-192x192.png", // Favicon, Android Chrome M39+ with 4.0 screen density
    "android-chrome-256x256.png", // Favicon, Android Chrome M47+ Splash screen with 1.5 screen density
    "android-chrome-384x384.png", // Favicon, Android Chrome M47+ Splash screen with 3.0 screen density
    "android-chrome-512x512.png", // Favicon, Android Chrome M47+ Splash screen with 4.0 screen density
    "apple-touch-icon.png", // Favicon, Apple default
    "apple-touch-icon-57x57.png", // Apple iPhone, Non-retina with iOS6 or prior
    "apple-touch-icon-60x60.png", // Apple iPhone, Non-retina with iOS7
    "apple-touch-icon-72x72.png", // Apple iPad, Non-retina with iOS6 or prior
    "apple-touch-icon-76x76.png", // Apple iPad, Non-retina with iOS7
    "apple-touch-icon-114x114.png", // Apple iPhone, Retina with iOS6 or prior
    "apple-touch-icon-120x120.png", // Apple iPhone, Retina with iOS7
    "apple-touch-icon-144x144.png", // Apple iPad, Retina with iOS6 or prior
    "apple-touch-icon-152x152.png", // Apple iPad, Retina with iOS7
    "apple-touch-icon-180x180.png", // Apple iPhone 6 Plus with iOS8
    "browserconfig.xml", // IE11 icon configuration file
    "favicon.ico", // Favicon, IE and fallback for other browsers
    "favicon-16x16.png", // Favicon, default
    "favicon-32x32.png", // Favicon, Safari on Mac OS
    "logo.png", // Logo
    "manifest.json", // Manifest file
    "maskable_icon.png", // Favicon, maskable https://web.dev/maskable-icon
    "mstile-70x70.png", // Favicon, Windows 8 / IE11
    "mstile-144x144.png", // Favicon, Windows 8 / IE10
    "mstile-150x150.png", // Favicon, Windows 8 / IE11
    "mstile-310x150.png", // Favicon, Windows 8 / IE11
    "mstile-310x310.png", // Favicon, Windows 8 / IE11
    "safari-pinned-tab.svg", // Favicon, Safari pinned tab
    "share.jpg", // Social media sharing
    "style.css", // Main CSS file
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
