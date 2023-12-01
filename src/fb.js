import { auth } from "./database.js";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

addHandler("signup-btn", handleSignup);
addHandler("login-btn", handleLogin);
addHandler("logout-btn", handleLogOut);
addHandler("resend-verify-btn", handleResendVerify);

function addHandler(id, func) {
    if (elem(id)) {
        elem(id).onclick = func;
    }
}

function elem(id) {
    return document.querySelector(`#${id}`);
}

async function handleSignup() {
    signupLoginHelper(true);
}

function handleLogin() {
    signupLoginHelper(false);
}

async function signupLoginHelper(isSignup) {
    try {
        const val = (id) => elem(id).value,
            email = val("email"),
            password = val("password"),
            func = isSignup
                ? createUserWithEmailAndPassword
                : signInWithEmailAndPassword,
            { user } = await func(auth, email, password);
        isSignup &&
            (await sendEmailVerification(user, {
                url: "https://us-central1-express-10101.cloudfunctions.net/express/",
            }));
        setTimeout(() => {
            window.location.assign("profile");
        }, 1000);
    } catch (err) {
        elem("error").textContent = err.message;
        console.error(err);
    }
}

async function handleLogOut() {
    await signOut(auth);
    setTimeout(() => {
        window.location.assign("./");
    }, 1000);
}

async function handleResendVerify() {
    try {
        await sendEmailVerification(auth.currentUser);
        alert("Email sent!");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

export { elem };
