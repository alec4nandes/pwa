import { auth, db } from "./database.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { elem } from "./fb.js";
import { pushToAllUsers } from "./push-client.js";

if (elem("notify-btn")) {
    elem("notify-btn").onclick = getNotifications;
}

if (elem("push-to-all")) {
    elem("push-to-all").onclick = pushToAllUsers;
}

async function getNotifications() {
    try {
        if (window.Notification.permission === "denied") {
            alert(
                "You have previously blocked notifications for this site. Please allow notifications."
            );
        }
        check();
        const granted = window.Notification.permission === "granted",
            permission = !granted && (await requestNotificationPermission()),
            user = auth.currentUser,
            subscription = await subscribeToPushManager(),
            // TODO: push new subscriptions to array: one user, different devices
            docRef = doc(db, "users", user.email),
            docExists = (await getDoc(docRef)).exists(),
            json = JSON.parse(JSON.stringify(subscription));
        (docExists ? updateDoc : setDoc)(docRef, { subscription: json });
        alert("You will now receive push notifications.");
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
        throw new Error("Permission not granted for window.Notification");
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
