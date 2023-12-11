import uids from "./uids.js";

function getRandomSutta() {
    getSutta(getRandom(uids));
}

async function getSutta(info, author) {
    const { uid, authors } = info;
    author = author || getRandom(authors);
    let url = `https://suttacentral.net/api/bilarasuttas/${uid}/${author}`,
        data = await fetcher(url);
    if (data.translation_text) {
        data = data.translation_text;
    } else {
        // is "legacy text"
        url = `https://suttacentral.net/api/suttas/${uid}/${author}`;
        data = (await fetcher(url)).root_text.text;
    }
    displaySutta({ uid, author, data });
    getNavButtons(info, author);
}

function getRandom(arr) {
    return arr[~~(Math.random() * arr.length)];
}

async function fetcher(url) {
    return await (await fetch(url)).json();
}

function displaySutta({ uid, author, data }) {
    document.querySelector("#sutta").innerHTML = `
            <h1>${uid} by ${author}</h1>
            ${JSON.stringify(data, null, 4)}
        `;
}

function getNavButtons(info, author) {
    const index = uids.indexOf(info),
        prev = uids[index - 1],
        next = uids[index + 1],
        prevBtn = document.createElement("button"),
        nextBtn = document.createElement("button"),
        navElem = document.querySelector("nav");
    navElem.innerHTML = "";
    if (prev?.authors.includes(author)) {
        prevBtn.textContent = "PREVIOUS";
        prevBtn.onclick = () => getSutta(prev, author);
        navElem.appendChild(prevBtn);
    }
    if (next?.authors.includes(author)) {
        nextBtn.textContent = "NEXT";
        nextBtn.onclick = () => getSutta(next, author);
        navElem.appendChild(nextBtn);
    }
}

export { getRandomSutta };
