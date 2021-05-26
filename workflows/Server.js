#!/usr/bin/env node
const { execSync } = require("child_process")
const { readFileSync, writeFileSync } = require("fs")
const { resolve } = require("path")
const { exportVariable } = require("@actions/core")

const Server_path = resolve(__dirname, "..", "Server.json");
const old_Server_file = readFileSync(Server_path, "utf8");
const oldServer = JSON.parse(old_Server_file)
const new_Server = {
    java_latest: null,
    bedrock_latest: null,
    PocketMine_latest: null,
    java: {},
    bedrock: {},
    PocketMine: {}
}

const javaLynx = execSync(`curl -sS "https://www.minecraft.net/en-us/download/server" | lynx -dump -stdin`).toString().split(/\n/g);
const pocketmine_json = JSON.parse(execSync(`curl -sS "https://api.github.com/repos/pmmp/PocketMine-MP/releases"`).toString());
var url_linux, url_win
for (let urls of execSync(`curl -sS "https://www.minecraft.net/en-us/download/server/bedrock" | lynx -dump -stdin`).toString().split(/\n/gi).filter(data => {return (data.includes("bin-"))})){
    for (let _i of urls.split(/\s+/g)) {if (_i.includes("http")) {if (_i.includes("bin-win")) url_win = _i; else if (_i.includes("bin-linux")) url_linux = _i;};}
}
const winSplit = url_win.split("/");
const BedrockServerVersion = winSplit[(winSplit.length - 1)].replace("bedrock-server-", "").replaceAll(".zip", "")
console.log(`Windows Bedrock URL: ${url_win}\nLinux Bedrock URL: ${url_linux}\n\nVersion: ${BedrockServerVersion}\n`)

// Bedrock
if (oldServer.bedrock[BedrockServerVersion]) console.log("the bedrock platform is up to date, jumping"); else {
    new_Server.bedrock_latest = BedrockServerVersion
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
Zip.writeZip(resolve(__dirname, "..", "linux_libries.zip"));

// Java
var java_version = javaLynx.filter(data => {return data.includes("java")}).filter(data => {return data.includes("-jar")})[0].trim().split(/\s+/g).filter((data) => {return !(data === "java" || data === "-jar" || data === "nogui" || data.includes("-Xm"))})[0].trim().split(/minecraft_server/).join("").split(/\.jar/).join("")
if (java_version.startsWith(".")) java_version = java_version.replace(".", "")

if (oldServer.java[java_version]) console.log("the java platform is up to date, jumping"); else {
    new_Server.java_latest = java_version
    let data = new Date()
    new_Server.java[java_version] = {
        url: javaLynx.filter(data => {return data.includes("server.jar")})[0].split(/\s+/g).filter(data => {return data.includes("http")})[0],
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.java[java_version]);
}

new_Server.PocketMine_latest = pocketmine_json[0].tag_name
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

// Latest check
if (new_Server.java_latest === null) new_Server.java_latest = oldServer.java_latest
if (new_Server.bedrock_latest === null) new_Server.bedrock_latest = oldServer.bedrock_latest
if (new_Server.PocketMine_latest === null) new_Server.PocketMine_latest = oldServer.PocketMine_latest

// Add Old in new
for (let java of Object.getOwnPropertyNames(oldServer.java)){new_Server.java[java] = oldServer.java[java]}
for (let bedrock of Object.getOwnPropertyNames(oldServer.bedrock)){new_Server.bedrock[bedrock] = oldServer.bedrock[bedrock]}
for (let PocketMine of Object.getOwnPropertyNames(oldServer.PocketMine)){new_Server.PocketMine[PocketMine] = oldServer.PocketMine[PocketMine]}

// Write file
writeFileSync(Server_path, JSON.stringify(new_Server, null, 4));

exportVariable("pocketmine_version", pocketmine_json[0].tag_name)
exportVariable("java_version", java_version)
exportVariable("bedrock_version", BedrockServerVersion)
