const { resolve, join } = require("path");
const { readdirSync, writeFileSync, lstatSync } = require("fs");
const {exportVariable} = require("@actions/core")
const php_json = resolve(__dirname, "../..", "php_bin.json")

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
    index = index.split(/[Xx]86[-_]64/gi).join("x64").split(/arm64/gi).join("aarch64").split("_")
    var System = ""
    if (/[wW]indows/.test(index[0])) System = "win32"
    else if (/[lL]inux/.test(index[0])) System = "linux"
    else if (/[aA]ndroid/.test(index[0])) System = "android"
    else if (/[mM]ac[oO][sS]/.test(index[0])) System = "darwin"
    else {
        System = "other";
        index = [null, index.join("_")]
    };
    if (!repo_published[System][index[1]]) repo_published[System][index[1]] = `https://github.com/The-Bds-Maneger/Raw_files/releases/download/${process.env.tag_name}/${index.join("_")}`;else repo_published["other"][index[1]] = `https://github.com/The-Bds-Maneger/Raw_files/releases/download/${process.env.tag_name}/${index.join("_")}`
}
console.log(repo_published);
writeFileSync(php_json, JSON.stringify(repo_published, null, 4))
