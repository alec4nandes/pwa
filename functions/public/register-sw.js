// Install servicerWorker if supported on sign-in/sign-up page.
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("service-worker.js")
        .then((sw) => console.log("Service Worker registered:", sw))
        .catch((err) => console.error("Service Worker not registered:", err));
}
