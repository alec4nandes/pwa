import { auth, db } from "./database.js";
import {
    deleteField,
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { addHandler, elem } from "./fb.js";
import { pushToAllUsers } from "./push-client.js";

navigator.permissions
    .query({ name: "notifications" })
    .then((permissionStatus) => {
        toggle(permissionStatus);
        permissionStatus.onchange = () => {
            toggle(permissionStatus);
        };
    });

async function toggle(status) {
    const email = elem("email-display").textContent,
        hasSubscription = !!(await getDataField(email, "subscription")),
        isGranted = hasSubscription && status.state === "granted";
    elem("subscribe").style.display = isGranted ? "none" : "block";
    elem("unsubscribe").style.display = isGranted ? "block" : "none";
    if (isGranted) {
        const coordinates = await getDataField(email, "coordinates"),
            { latitude, longitude } = coordinates,
            message = `Subscribed to push notifications for data at latitude: ${latitude}, longitude: ${longitude}.`;
        elem("unsubscribe").querySelector("span").textContent = message;
    }
}

async function getDataField(email, field) {
    const data = (await getDoc(doc(db, "users", email))).data();
    return data?.[field];
}

setCoords();
addHandler("notify-btn", handleSubscribe);
addHandler("push-to-all", pushToAllUsers);
addHandler("unsub-btn", handleUnsubscribe);

async function setCoords() {
    if (elem("lat") && elem("lng")) {
        const email = elem("email-display").textContent,
            coordinates = await getDataField(email, "coordinates"),
            { latitude, longitude } = coordinates;
        elem("lat").value = latitude;
        elem("lng").value = longitude;
    }
}

async function handleSubscribe() {
    try {
        check();
        const granted = window.Notification.permission === "granted",
            permission = !granted && (await requestNotificationPermission()),
            user = auth.currentUser,
            subscription = await subscribeToPushManager(),
            // TODO: push new subscriptions to array: one user, different devices
            docRef = doc(db, "users", user.email),
            docExists = (await getDoc(docRef)).exists(),
            json = JSON.parse(JSON.stringify(subscription)),
            latitude = +elem("lat").value,
            longitude = +elem("lng").value;
        await (docExists ? updateDoc : setDoc)(docRef, {
            subscription: json,
            coordinates: { latitude, longitude },
        });
        alert("You will now receive push notifications.");
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function check() {
    if (!("serviceWorker" in navigator)) {
        throw new Error("No Service Worker support!");
    }
    if (!("PushManager" in window)) {
        throw new Error("No Push API support!");
    }
}

async function requestNotificationPermission() {
    const permission = await window.Notification.requestPermission();
    // value of permission can be 'granted', 'default', 'denied'
    // granted: user has accepted the request
    // default: user has dismissed the notification permission popup by clicking on x
    // denied: user has denied the request.
    if (permission !== "granted") {
        throw new Error(
            "You have blocked notifications for this site. Please allow notifications."
        );
    }
    return permission;
}

async function subscribeToPushManager() {
    const applicationServerKey =
            "BL9RzIuTXf5t8XSB7On9IfCNucATGUhS3kqTVp3W6HBajUEGdclXaoo2Nhlqx1xGXoS-rgHATdsR_jOCf4fdzHE",
        options = { applicationServerKey, userVisibleOnly: true },
        swRegistration = await navigator.serviceWorker.ready,
        subscription = await swRegistration?.pushManager.subscribe(options);
    return subscription;
}

async function handleUnsubscribe() {
    await updateDoc(doc(db, "users", auth.currentUser.email), {
        subscription: deleteField(),
    });
    alert("Successfully unsubscribed.");
    window.location.reload();
}
