const isWelcome = new URL(window.location.href).pathname.includes("welcome");

if (isWelcome) {
    if (getIsDownloaded()) {
        window.location.assign("./");
    } else {
        const installBtn = document.querySelector("#install-app");
        if (window.BeforeInstallPromptEvent) {
            // add default behavior in case app is already installed.
            installBtn.onclick = () => {
                alert("This app seems to be installed already.");
            };
            // register event listener (won't register if already installed)
            window.addEventListener("beforeinstallprompt", (e) => {
                e.preventDefault();
                console.log("This app can be installed.");
                installBtn.onclick = () => {
                    console.log("Installing app...");
                    e.prompt();
                };
            });
        } else {
            const openDialog = document.querySelector("#install-app"),
                dialog = document.querySelector("dialog"),
                closeDialog = dialog.querySelector("#close");
            openDialog.onclick = () => dialog.showModal();
            closeDialog.onclick = () => dialog.close();
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
