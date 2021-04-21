const { resolve, join } = require("path");
const { readdirSync, writeFileSync } = require("fs");
const {exportVariable} = require("@actions/core")
const php_json = resolve(__dirname, "..", "php_bin.json")

exportVariable("upload", true)
var files = readdirSync("/tmp/Bins/")
var repo_published = {
    "linux": {},
    "darwin": {},
    "win32": {},
    "other": {}
};
for (let index of files){
    index = index.split("86-").join("").split("x86_64").join("x64").split("_")
    var System = ""
    if (index[0].includes("Windows")) System = "win32"
    else if (index[0].includes("Linux")) System = "linux"
    else if (index[0].includes("MacOS", "macos")) System = "darwin"
    else {
        System = "other";
        index = [null, index.join("_")]
    };
    repo_published[System][index[1]] = `https://github.com/The-Bds-Maneger/Raw_files/releases/download/${process.env.tag_name}/${index.join("_")}`;
}
console.log(repo_published);
writeFileSync(php_json, JSON.stringify(repo_published, null, 4))