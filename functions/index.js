const admin = require("firebase-admin"),
    serviceAccount = require("./service-account-key.json"),
    express = require("express"),
    functions = require("firebase-functions"),
    path = require("path");

// The Firebase Admin SDK is used here to verify the ID token.
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express(),
    user = (desiredPath, realPath) =>
        app.use(desiredPath, express.static(path.join(__dirname, realPath)));

user("/assets", "/assets");
user("/service-worker.js", "/public/service-worker.js");
user("/firebase.js", "/public/firebase.js");

app.get("/", (req, res) => mustHaveToken(req, res, true));
app.get("/profile", (req, res) => mustHaveToken(req, res, false));

async function mustHaveToken(req, res, isHome) {
    const token = readToken(req);
    if (token && (await verifyToken(token))) {
        isHome
            ? res.redirect("./profile")
            : res.sendFile(path.join(__dirname, "/public/profile.html"));
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

async function verifyToken(token) {
    try {
        await admin.auth().verifyIdToken(token);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = { express: functions.https.onRequest(app) };
