const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        "service-worker": "./src/sw.js",
        firebase: "./src/fb.js",
        notifications: "./src/notify.js",
    },
    output: {
        path: path.resolve(__dirname, "functions/public"),
        filename: "[name].js",
    },
};
