const IS_DEVELOPMENT = true;

// PWA can get stale when active in the background after opening
// from a device's home screen, so reload every hour in case
// there are page updates.
setTimeout(() => {
    window.location.reload();
}, 1000 * 60 * 60);

const isDownloaded =
    IS_DEVELOPMENT || !!window.matchMedia("(display-mode: standalone)").matches;

// when restarting the app, not just refreshing
if (pageIsReloaded()) {
    if (isDownloaded) {
        document.querySelector("#login").style.display = "block";
    } else {
        showWelcome();
        showInstallInstructions();
    }
} else {
    showWelcome();
    if (isDownloaded) {
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } else {
        showInstallInstructions();
    }
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

function showWelcome() {
    document.body.style.overflow = "hidden";
    document.querySelector("#welcome").style.display = "flex";
}

function showInstallInstructions() {
    document.querySelector("#install").innerHTML = `
        You must download this web app to your device
        to receive push notification reminders.
        Follow these downloading directions:
        ...
    `;
}
