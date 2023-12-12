import uids, { authors } from "./uids.js";

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
        formatText(data, author);
    } else {
        // is "legacy text"
        url = `https://suttacentral.net/api/suttas/${uid}/${author}`;
        data = (await fetcher(url)).root_text.text;
        formatLegacyText(data, author);
    }
    getNavButtons(info, author);
}

function getRandom(arr) {
    return arr[~~(Math.random() * arr.length)];
}

async function fetcher(url) {
    return await (await fetch(url)).json();
}

function formatText(data, author) {
    const keys = Object.keys(data),
        titleKeys = keys.filter(
            (key) => key.split(":")[1].split(".")[0] === "0"
        ),
        title = titleKeys.map((key) => {
            const result = data[key];
            delete data[key];
            return result;
        }),
        header =
            title.map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`).join("") +
            `<em>by ${authors[author]}</em>`,
        table = `
                <table>
                    ${Object.entries(data)
                        .map(
                            ([key, line]) =>
                                `<tr><td>${key}</td><td>${line}</td></tr>`
                        )
                        .join("")}
                </table>
            `;
    document.querySelector("#title").innerHTML = header;
    document.querySelector("#sutta").innerHTML = table;
}

function formatLegacyText(data, author) {
    console.log(data);
    const div = document.createElement("div");
    div.innerHTML = data;
    const h1 = div.querySelector("h1"),
        title =
            [h1, ...div.querySelector("ul").querySelectorAll("li")]
                .map((line) => line.innerHTML?.trim())
                .map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`)
                .join("") + `<em>by ${authors[author]}</em>`,
        lines = [...div.querySelectorAll("p")]
            .map((line) => `<p>${line.innerHTML}</p>`)
            .join("");
    document.querySelector("#title").innerHTML = title;
    document.querySelector("#sutta").innerHTML = lines;
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
