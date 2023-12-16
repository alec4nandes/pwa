import { auth } from "./database.js";
import { getIdToken, onAuthStateChanged } from "firebase/auth";

const cacheName = "cache14";

const assets = [
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

self.addEventListener("install", (event) => {
    // Kick out the old service worker
    self.skipWaiting();
    const filesUpdate = (cache) => {
        const stack = [];
        assets.forEach((file) =>
            stack.push(
                cache
                    .add(file)
                    .catch((_) => console.error(`can't load ${file} to cache`))
            )
        );
        return Promise.all(stack);
    };
    event.waitUntil(caches.open(cacheName).then(filesUpdate));
});

// Offline-first, cache-first strategy
// Kick off two asynchronous requests, one to the cache and one to the network
// If there's a cached version available, use it, but fetch an update for next time.
// Gets data on screen as quickly as possible, then updates once the network has returned the latest data.
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.open(cacheName).then((cache) => {
            return cache.match(event.request).then((response) => {
                return response || fetcher(event);
            });
        })
    );
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
    // Delete any non-current cache
    event.waitUntil(
        caches.keys().then((keys) => {
            Promise.all(
                keys.map((key) => {
                    if (![cacheName].includes(key)) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener("push", function (event) {
    if (event.data) {
        const { title, message } = JSON.parse(event.data.text());
        console.log(`Push event: Title: ${title} ... Message: ${message}`);
        showLocalNotification(title, message, self.registration);
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
