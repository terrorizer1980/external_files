#!/usr/bin/env node
const { execSync } = require("child_process")
const { readFileSync, writeFileSync } = require("fs")
const { resolve } = require("path")
const { exportVariable } = require("@actions/core")

const Server_path = resolve(__dirname, "..", "Server.json");
const old_Server_file = readFileSync(Server_path, "utf8");
const new_Server = JSON.parse(old_Server_file)

const url_linux = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/bedrock" |grep 'bin-linux'| awk '{print $2}'`).toString().replace("\n", "")
const url_win = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/bedrock" |grep 'bin-win'| awk '{print $2}'`).toString().replace("\n", "")
const winSplit = url_win.split("/");
const server_version = winSplit[(winSplit.length - 1)].replace("bedrock-server-", "").replaceAll(".zip", "")
exportVariable("bedrock_version", server_version)

if (old_Server_file.includes(url_linux) && old_Server_file.includes(url_win)){
    console.log("the bedrock platform is up to date, jumping");
} else {
    execSync(`wget "${url_linux}" -O bedrock.zip && unzip -o bedrock.zip -d ./`, {cwd: "/tmp"});
    var Zip = require("adm-zip");
    Zip = new Zip();
    const libs = execSync("ldd /tmp/bedrock_server").toString().split("\t").join("").split("\n")
    var arrayLibs = [];
    for (let lib of libs) {
        lib = lib.split(/\s+/g)
        if (lib.length === 4) arrayLibs.push(lib[2])
        else if (lib[0].includes("/")) arrayLibs.push(lib[0])
        else console.log(lib);
    }
    arrayLibs.push("/lib/x86_64-linux-gnu/ld-2.31.so")
    for (let addInzip of arrayLibs) {
        var dir = addInzip.split("/");dir.pop(dir.length - 1);dir = dir.join("/");
        Zip.addLocalFile(addInzip, dir);
    }
    Zip.writeZip(resolve(__dirname, "..", "linux_libries.zip"));
    new_Server.bedrock_latest = server_version
    let data = new Date()
    new_Server.bedrock[server_version] = {
        "x64": {
            "linux": url_linux,
            "win32": url_win
        },
        "data": `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.bedrock[server_version]);
}
var java_version = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/" | grep "java"`).toString().split(/\r?\n/g)[1].trim().split(/\s+/g).filter((data) => {if (data === "java" || data === "-jar" || data === "nogui" || data.includes("-Xm")) return false;else return true;});
java_version = java_version[(java_version.length - 1)].replace("minecraft_server.", "").replace(".jar", "")
exportVariable("java_version", java_version)
if (new_Server.java[java_version] !== undefined){
    console.log("the java platform is up to date, jumping");
} else {
    new_Server.java_latest = java_version
    let data = new Date()
    new_Server.java[java_version] = {
        url: execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/" | grep "server.jar"`).toString().split(/\s+/g).filter( data => {if (data === "" || data.match(/[0-9]+\./) ) return false;else return true;})[0],
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.java[java_version]);
}

const pocketmine_json = JSON.parse(execSync(`curl -sS "https://api.github.com/repos/pmmp/PocketMine-MP/releases"`).toString())
new_Server.PocketMine_latest = pocketmine_json[0].tag_name
exportVariable("pocketmine_version", pocketmine_json[0].tag_name)
for (let index of pocketmine_json){
    if (!(old_Server_file.includes(index.tag_name))) {
        let data = new Date(index.published_at)
        new_Server.PocketMine[index.tag_name] = {
            url: `https://github.com/pmmp/PocketMine-MP/releases/download/${index.tag_name}/PocketMine-MP.phar`,
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
    }
}

writeFileSync(Server_path, JSON.stringify(new_Server, null, 4))