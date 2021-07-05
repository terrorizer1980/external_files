#!/usr/bin/env node
const { execSync } = require("child_process")
const { readFileSync, writeFileSync } = require("fs")
const { resolve } = require("path")
const { exportVariable } = require("@actions/core")

const Server_path = resolve(__dirname, "../../Server.json");
const old_Server_file = readFileSync(Server_path, "utf8");
const oldServer = JSON.parse(old_Server_file)
const new_Server = {
    latest: {
        java: null,
        bedrock: null,
        pocketmine: null,
        jsprismarine: null
    },
    java: {},
    bedrock: {},
    pocketmine: {},
    jsprismarine: {}
}

// Functions
function wget(url = "https://google.com"){
    const command = (`curl -H "user-agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36" "${url}"`)
    console.log(command)
    const _a = execSync(command).toString().split(/["']/gi).filter(d=>/http[s]:/.test(d))
    return _a
}
function lynx(url = "https://google.com"){
    const command = (`curl -H "user-agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36" "${url}" | lynx -dump -stdin`)
    console.log(command)
    const _a = execSync(command).toString()
    return _a
}

function GetJson(url = ""){
    const _a = execSync(`curl ${url}`).toString()
    return JSON.parse(_a)
}

const javaLynx = lynx("https://www.minecraft.net/en-us/download/server").split("\n")
const pocketmine_json = JSON.parse(execSync(`curl -sS "https://api.github.com/repos/pmmp/PocketMine-MP/releases"`).toString());
var url_linux, url_win
for (let urls of wget("https://www.minecraft.net/en-us/download/server/bedrock").filter(data => {return (data.includes("bin-"))})){
    for (let _i of urls.split(/\s+/g)) {if (_i.includes("http")) {if (_i.includes("bin-win")) url_win = _i; else if (_i.includes("bin-linux")) url_linux = _i;};}
}
const winSplit = url_win.split("/");
const BedrockServerVersion = winSplit[(winSplit.length - 1)].replace("bedrock-server-", "").split(".zip").join("")
console.log(`Windows Bedrock URL: ${url_win}\nLinux Bedrock URL: ${url_linux}\n\nVersion: ${BedrockServerVersion}\n`)

// Bedrock
function createZipLibries(){
    execSync(`wget "${url_linux}" -O bedrock.zip && unzip -o bedrock.zip -d ./`, {cwd: "/tmp"});
    var Zip = require("adm-zip");
    Zip = new Zip();
    const libs = execSync("ldd /tmp/bedrock_server").toString().split("\t").join("").split("\n")
    var arrayLibs = [];
    for (let lib of libs) {lib = lib.split(/\s+/g); if (lib.length === 4) arrayLibs.push(lib[2]); else if (lib[0].includes("/")) arrayLibs.push(lib[0]); else console.log(lib);}
    arrayLibs.push("/lib/x86_64-linux-gnu/ld-2.31.so")
    for (let addInzip of arrayLibs) {
        var dir = addInzip.split("/");dir.pop(dir.length - 1);dir = dir.join("/");
        Zip.addLocalFile(addInzip, dir);
    }
    return Zip.writeZip(resolve(__dirname, "../..", "linux_libries.zip"));
}

new_Server.latest.bedrock = BedrockServerVersion
if (oldServer.bedrock[BedrockServerVersion]) console.log("the bedrock platform is up to date, jumping");
else {
    let data = new Date()
    new_Server.bedrock[BedrockServerVersion] = {
        x64: {
            linux: url_linux,
            win32: url_win
        },
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.bedrock[BedrockServerVersion]);
}

// Java
const JavaServerVersion = (function(){
    var Version = javaLynx.filter(data => {return data.includes("java")}).filter(data => {return data.includes("-jar")})[0].trim().split(/\s+/g).filter((data) => {return !(data === "java" || data === "-jar" || data === "nogui" || data.includes("-Xm"))})[0].trim().split(/minecraft_server/).join("").split(/\.jar/).join("")
    if (Version.startsWith(".")) Version = Version.replace(".", "")
    return Version
})()

new_Server.latest.java = JavaServerVersion
if (oldServer.java[JavaServerVersion]) console.log("the java platform is up to date, jumping");
else {
    let data = new Date()
    new_Server.java[JavaServerVersion] = {
        url: javaLynx.filter(data => {return data.includes("server.jar")})[0].split(/\s+/g).filter(data => {return data.includes("http")})[0],
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.java[JavaServerVersion]);
}

// Pocketmine-MP
new_Server.latest.pocketmine = pocketmine_json[0].tag_name
for (let index of pocketmine_json){
    if (!(old_Server_file.includes(index.tag_name))) {
        let data = new Date(index.published_at)
        new_Server.PocketMine[index.tag_name] = {
            url: `https://github.com/pmmp/PocketMine-MP/releases/download/${index.tag_name}/PocketMine-MP.phar`,
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
        console.log(new_Server.PocketMine[index.tag_name]);
    }
}

// JSPrismarine 
// https://api.github.com/repos/JSPrismarine/JSPrismarine/commits
// for (let jspri of GetJson("https://api.github.com/repos/JSPrismarine/JSPrismarine/commits")) {}

// Add Old in new
for (let java of Object.getOwnPropertyNames(oldServer.java)){new_Server.java[java] = oldServer.java[java]}
for (let bedrock of Object.getOwnPropertyNames(oldServer.bedrock)){new_Server.bedrock[bedrock] = oldServer.bedrock[bedrock]}
for (let PocketMine of Object.getOwnPropertyNames(oldServer.PocketMine)){new_Server.PocketMine[PocketMine] = oldServer.PocketMine[PocketMine]}

// Write file
writeFileSync(Server_path, JSON.stringify(new_Server, null, 4));

exportVariable("pocketmine_version", new_Server.latest.pocketmine)
exportVariable("java_version", new_Server.latest.java)
exportVariable("bedrock_version", new_Server.latest.bedrock)
