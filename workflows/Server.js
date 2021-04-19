#!/usr/bin/env node
const {execSync} = require("child_process")
const { readFileSync, writeFileSync } = require("fs")
const { resolve } = require("path")
const {exportVariable} = require("@actions/core")
const
    Server_path = resolve(__dirname ,"..", "Server.json"),
    old_Server_file = readFileSync(Server_path, "utf8");
const new_Server = JSON.parse(old_Server_file)
const url_linux = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/bedrock" |grep 'bin-linux'| awk '/http/{print $2}'`).toString().replace("\n", ""),
    url_win = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/bedrock" |grep 'bin-win'| awk '/http/{print $2}'`).toString().replace("\n", ""),
    pocketmine_json = JSON.parse(execSync(`curl -sS "https://api.github.com/repos/pmmp/PocketMine-MP/releases"`).toString())

new_Server.PocketMine_latest = pocketmine_json[0].tag_name
exportVariable("pocketmine_version", pocketmine_json[0].tag_name)
for (let index in pocketmine_json){
    let TagPocketMine = pocketmine_json[index].tag_name
    if (old_Server_file.includes(TagPocketMine)) console.log(`Tag name exist: ${TagPocketMine}`);
    else {
        let data = new Date(pocketmine_json[index].published_at)
        new_Server.PocketMine[TagPocketMine] = {
            url: `https://github.com/pmmp/PocketMine-MP/releases/download/${TagPocketMine}/PocketMine-MP.phar`,
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
    }
}

const server_version = url_win.split("-")[3].toString().replaceAll(".zip", "")
exportVariable("bedrock_version", server_version)
var exist_urls;
if (!(old_Server_file.includes(url_linux))) exist_urls = false
else if (!(old_Server_file.includes(url_win))) exist_urls = false
else exist_urls = true

if (exist_urls){
    console.log("the bedrock platform is up to date, jumping");
}
else {
    execSync(`wget "${url_linux}" -O bedrock.zip && unzip -o bedrock.zip -d ./`, {cwd: "/tmp"})
    execSync(`zip linux_libries -r $(ldd /tmp/bedrock_server|awk '{print $3}' | tr "\n" " ")`, {
        cwd: resolve(__dirname, "..")
    })
    new_Server.bedrock_latest = server_version
    let data = new Date()
    new_Server.bedrock[server_version] = {
        url_linux: url_linux,
        url_windows: url_win,
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.bedrock);
}
const url_java = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/" |grep "server"|grep "launcher"|awk '{print $2}'`).toString().replace("\n", "")
const java_version = execSync(`lynx -dump "https://www.minecraft.net/en-us/download/server/"|grep "java -"|awk '{print $5}'`).toString().replace("\n", "").split("minecraft_server.").join("").split(".jar").join("")
exportVariable("java_version", java_version)
var exist_urls_java;
if (!(old_Server_file.includes(url_java))) exist_urls_java = false
else exist_urls_java = true

if (exist_urls_java){
    console.log("the java platform is up to date, jumping");
}
else {
    new_Server.java_latest = java_version
    let data = new Date()
    new_Server.java[java_version] = {
        url: url_java,
        data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
    }
    console.log(new_Server.java[java_version]);
}
writeFileSync(Server_path, JSON.stringify(new_Server, null, 4))