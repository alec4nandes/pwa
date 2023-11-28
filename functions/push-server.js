require("dotenv").config();

const webpush = require("web-push"),
    express = require("express"),
    cors = require("cors"),
    bodyParser = require("body-parser");

webpush.setVapidDetails(
    "mailto:al@fern.haus",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const pushApi = express();
pushApi.use(cors({ credentials: true }));
pushApi.use(bodyParser.json());

pushApi.post("/", (req, res) => {
    const { subscription } = req.body,
        sunrise = `6am`,
        sunset = "6pm",
        goals = ["fasting", "no smoking"],
        s = goals.length > 1 ? "s" : "",
        message = `sunrise: ${sunrise}; sunset: ${sunset}; effort${s}: ${goals.join(
            ", "
        )}`;
    console.log(subscription);
    webpush.sendNotification(subscription, message);
    res.json({ message: "message sent" });
});

module.exports = { pushApi };
