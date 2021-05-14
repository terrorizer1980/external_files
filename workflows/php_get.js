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
    "android": {},
    "other": {}
};
for (let index of files){
    index = index.split("86-").join("").split("x86_64").join("x64").split("_")
    var System = ""
    if (/indows/.tes(index[0])) System = "win32"
    else if (/inux/.test(index[0])) System = "linux"
    else if (/Android/.test(index[0])) System = "android"
    else if (/MacOS/.test(index[0]) || /macos/.test(index[0])) System = "darwin"
    else {
        System = "other";
        index = [null, index.join("_")]
    };
    repo_published[System][index[1]] = `https://github.com/The-Bds-Maneger/Raw_files/releases/download/${process.env.tag_name}/${index.join("_")}`;
}
console.log(repo_published);
writeFileSync(php_json, JSON.stringify(repo_published, null, 4))