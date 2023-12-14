const isWelcome = new URL(window.location.href).pathname.includes("welcome");

if (isWelcome) {
    if (getIsDownloaded()) {
        window.location.assign("./");
    } else {
        const installBtn = document.querySelector("#install-app");
        if (window.BeforeInstallPromptEvent) {
            // register event listener
            window.addEventListener("beforeinstallprompt", (e) => {
                e.preventDefault();
                installBtn.onclick = () => {
                    console.log("Installing app...");
                    e.prompt();
                };
            });
        } else {
            installBtn.onclick = showInstallInstructions;
        }
    }
} else {
    if (!getIsDownloaded()) {
        // check if installed and if not, redirect to welcome
        window.location.assign("./welcome");
    }
}

function getIsDownloaded() {
    const IS_DEVELOPMENT = false;
    return (
        IS_DEVELOPMENT ||
        !!window.matchMedia("(display-mode: standalone)").matches
    );
}

function showInstallInstructions() {
    // document.querySelector("#install-steps").style.display = "block";
    alert("INSTALL INSTRUCTIONS POPUP");
}
