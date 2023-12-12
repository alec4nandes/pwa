// git clone https://github.com/sc-voice/sc-api

const fs = require("fs"),
    glob = require("glob");

getDirectories("sc-api/api", function (err, res) {
    if (err) {
        console.log("Error", err);
    } else {
        const uids = [],
            authorInfo = {};
        res.filter((file) => file.includes(".json")).forEach((file) =>
            getJSON(file, uids, authorInfo)
        );
        uids.sort(sortUID);
        const str = `
            const uids = [${uids.map(JSON.stringify).join(",")}];
            
            const authors = ${JSON.stringify(authorInfo)};
            
            export default uids;
            export { authors };
        `;
        fs.writeFile("uids.js", str, function () {});
    }
});

function getDirectories(src, callback) {
    glob(src + "/**/*", callback);
}

function getJSON(fileName, uids, authorInfo) {
    const { value } = JSON.parse(fs.readFileSync(fileName)),
        data = value
            .map(({ uid, translations }) => {
                const english = translations.filter(
                        ({ lang }) => lang === "en"
                    ),
                    authors = english.map(({ author, author_uid }) => {
                        authorInfo[author_uid] = author;
                        return author_uid;
                    });
                if (authors.length) {
                    return { uid, authors };
                }
            })
            .filter(Boolean);
    uids.push(...data);
}

function sortUID(a, b) {
    const [aChap, aNum] = splitUID(a.uid),
        [bChap, bNum] = splitUID(b.uid),
        compareChaps = aChap.localeCompare(bChap);
    if (compareChaps) {
        return compareChaps;
    } else {
        const [an1, an2] = aNum.split(".").map((n) => +n),
            [bn1, bn2] = bNum.split(".").map((n) => +n);
        return an1 - bn1 || an2 - bn2;
    }
}

function splitUID(uid) {
    const index = getFirstNumIndex(uid),
        chap = uid.slice(0, index),
        num = uid.slice(index).split("-")[0];
    return [chap, num];
}

function getFirstNumIndex(uid) {
    const chars = [...uid];
    for (let i = 0; i < chars.length; i++) {
        if (!isNaN(chars[i])) {
            return i;
        }
    }
}
