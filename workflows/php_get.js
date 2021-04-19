const { resolve } = require("path");
const { readdirSync, writeFileSync } = require("fs");
const {exportVariable} = require("@actions/core")
const php_json = resolve(__dirname, "..", "php_bin.json")

exportVariable("upload", true)
var files = readdirSync("/tmp/Bins/")
var repo_published = {}
    repo_published.linux = {}
    repo_published.darwin = {}
    repo_published.win32 = {}
for (let index of files){
    index = index.split("_")
    console.log(index);
    var System = ""
    if (index[0].includes("Windows")) System = "win32"
    else if (index[0].includes("Linux")) System = "linux"
    else if (index[0].includes("MacOS", "macos")) System = "darwin"
    else System = "other"
    repo_published[System][index[1]] = `https://github.com/The-Bds-Maneger/Raw_files/releases/download/${process.env.tag_name}/${index.join("_")}`
}
writeFileSync(php_json, JSON.stringify(repo_published, null, 4))