import { db } from "./database.js";
import { collection, getDocs } from "firebase/firestore";

async function pushToAllUsers() {
    const subs = Object.values(await getAllUsers());
    for (const { subscription } of subs) {
        subscription && (await pushToUser(subscription));
    }
}

async function getAllUsers() {
    const result = {},
        snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach((d) => (result[d.id] = d.data()));
    return result;
}

async function pushToUser(subscription) {
    try {
        await fetch(`../push`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ subscription, message: "TEST PUSH" }),
        });
    } catch (err) {
        console.error(err);
    }
}

export { pushToAllUsers };
