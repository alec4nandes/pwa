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
        if (user.emailVerified) {
            setTimeout(() => {
                window.location.assign("profile");
            }, 1000);
        } else {
            const message = `Please verify your email by clicking the link sent to ${user.email}, then sign in again.`;
            if (isSignup) {
                await sendEmailVerification(user);
                alert(message);
            } else {
                const send = confirm(
                    "This email address is not yet verified. Resend verification email?"
                );
                send && (await sendEmailVerification(user));
            }
            throw new Error(message);
        }
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

export { elem };
