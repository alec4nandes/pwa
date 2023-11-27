import { auth } from "./database.js";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

if (elem("login")) {
    elem("login-btn").onclick = handleLogin;
} else if (elem("logout-btn")) {
    elem("logout-btn").onclick = handleLogOut;
}

function elem(id) {
    return document.querySelector(`#${id}`);
}

async function handleLogin() {
    try {
        const val = (id) => elem(id).value,
            email = val("email"),
            password = val("password"),
            user = await signInWithEmailAndPassword(auth, email, password);
        setTimeout(() => {
            window.location.assign("profile");
        }, 1000);
    } catch (err) {
        alert(err.message);
    }
}

async function handleLogOut() {
    await signOut(auth);
    setTimeout(() => {
        window.location.assign("./");
    }, 1000);
}
