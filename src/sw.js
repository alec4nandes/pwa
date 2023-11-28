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
        const headers = setHeaders(req, token);
        return fetch(
            new Request(req.url, {
                method: req.method,
                headers,
                mode: "same-origin",
                credentials: req.credentials,
                // cache: req.cache,
                redirect: req.redirect,
                referrer: req.referrer,
                // body,
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

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

export { getToken };
