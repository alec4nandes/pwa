const IS_DEVELOPMENT = false;

// PWA can get stale when active in the background after opening
// from a device's home screen, so reload every hour in case
// there are page updates.
setTimeout(() => {
    window.location.reload();
}, 1000 * 60 * 60);

const isDownloaded =
    IS_DEVELOPMENT || !!window.matchMedia("(display-mode: standalone)").matches;

// logic for when restarting the app, not just refreshing
if (pageIsReloaded()) {
    document.querySelector("#login").style.display = "block";
} else {
    showSplash();
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

function pageIsReloaded() {
    if (window.performance) {
        console.info("window.performance works");
        const { type } = window.performance.getEntries()[0],
            isReload = type === "reload";
        console.info(`This page is ${isReload ? "" : "not "}reloaded.`);
        return isReload;
    }
    return false;
}

function showSplash() {
    document.body.style.overflow = "hidden";
    document.querySelector("#splash-screen").style.display = "flex";
}
