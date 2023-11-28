import { auth } from "./database.js";
import { getIdToken, onAuthStateChanged } from "firebase/auth";

const cacheName = "cache5",
    precachedAssets = [];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(precachedAssets);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(fetcher(event));
});

async function fetcher(event) {
    const token = await getToken(),
        req = event.request;
    if (!token) {
        return fetch(req);
    }
    const { origin, protocol, hostname } = self.location,
        reqOrigin = getOriginFromUrl(req.url),
        validProtocol = protocol == "https:" || hostname == "localhost",
        sameOrigin = origin == reqOrigin && validProtocol;
    if (sameOrigin) {
        const headers = setHeaders(req, token),
            body = await getBodyContent(req);
        return fetch(
            new Request(req.url, {
                method: req.method,
                headers,
                mode: "same-origin",
                credentials: req.credentials,
                cache: req.cache,
                redirect: req.redirect,
                referrer: req.referrer,
                body,
            })
        );
    } else {
        return fetch(req);
    }
}

async function getToken() {
    return await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            resolve(user ? await getIdToken(user) : null);
        });
    });
}

function getOriginFromUrl(url) {
    // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
    const pathArray = url.split("/"),
        protocol = pathArray[0],
        host = pathArray[2];
    return protocol + "//" + host;
}

function setHeaders(req, token) {
    if (!token) {
        return req.headers;
    }
    const headers = new Headers(req.headers);
    headers.append("Authorization", "Bearer " + token);
    return headers;
}

// Get underlying body if available. Works for text and json bodies.
async function getBodyContent(req) {
    return Promise.resolve()
        .then(() => {
            if (req.method !== "GET") {
                if (req.headers.get("Content-Type").indexOf("json") !== -1) {
                    return req.json().then((json) => {
                        return JSON.stringify(json);
                    });
                } else {
                    return req.text();
                }
            }
        })
        .catch((error) => {
            // Ignore error.
        });
}

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener("push", function (event) {
    if (event.data) {
        console.log("Push event:", event.data.text());
        showLocalNotification(
            "Today is Uposatha",
            event.data.text(),
            self.registration
        );
    } else {
        console.warn("Push event, but no data.");
    }
});

function showLocalNotification(title, body, swRegistration) {
    const options = {
        // here you can add more properties like icon, image, vibrate, etc.
        body,
    };
    swRegistration.showNotification(title, options);
}

export { getToken };
