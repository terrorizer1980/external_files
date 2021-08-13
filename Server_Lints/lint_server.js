#!/usr/bin/env node
const { execSync } = require("child_process");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const path = require("path");
const { resolve, dirname } = path;
const { tmpdir } = require("os");

const { exportVariable } = require("@actions/core");
const adm_zip = require("adm-zip");
const { GetJson, Fetch_Minecraft_net } = require("./fetch");
const { JSDOM } = require("jsdom");

async function Spigot_Lint(){
    return new Promise((resolve, reject)=>{
        Fetch_Minecraft_net("https://getbukkit.org/download/spigot").then(res => {
            let html_file = res.toString();
            const returns = []
            new JSDOM(html_file).window.document.querySelectorAll("#download > div > div > div > div").forEach(DOM => {
                const New_Dom = {
                    version: DOM.querySelector("div:nth-child(1) > h2").innerHTML.trim(),
                    url: DOM.querySelector("div:nth-child(4) > div:nth-child(2) > a").href,
                }
                returns.push(New_Dom)
            })
            resolve(returns);
        }).catch(err => {
            reject(err);
        });
    });
}

async function CreateLibZIP(url = "") {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.arrayBuffer()).then(res => Buffer.from(res)).then(res => {
            try {
                const zip = new adm_zip(res);
                const zipLib = new adm_zip();
                const Bedrock_Path = path.resolve(tmpdir(), "Bedrock")
                zip.extractAllTo(Bedrock_Path, true);
                
                // Get Paths
                const libs = execSync(`ldd "${path.join(Bedrock_Path, "bedrock_server")}"`).toString().split(/\n|\t/gi).filter(a => a.trim()).filter(b => b.includes("/")).map(c => c.replace(/\s+\(.*\)/gi, "")).map(d => d.replace(/.*=>/gi, "").trim())
                libs.push("/lib/x86_64-linux-gnu/ld-2.31.so");

                // Add ZIP File
                libs.forEach(addInzip => {
                    if (existsSync(addInzip)) zipLib.addLocalFile(addInzip, dirname(addInzip));
                });
                
                // Write ZIP File
                const ZipFile = path.resolve(__dirname, "../linux_libries.zip");
                zipLib.writeZip(ZipFile);
                return resolve(ZipFile);
            } catch (e) {
                return reject(e);
            }
        }).catch(err => reject(err));
    });
}

(async () => {
    const Server_path = resolve(__dirname, "../Server.json");
    const old_Server_file = readFileSync(Server_path, "utf8");
    const oldServer = JSON.parse(old_Server_file)
    const new_Server = {
        latest: {
            java: null,
            bedrock: null,
            pocketmine: null,
            spigot: null
        },
        java: {},
        bedrock: {},
        pocketmine: {},
        spigot: {}
    }
    
    // Get Pre URLs
    const javaLynx = (await Fetch_Minecraft_net("https://www.minecraft.net/en-us/download/server")).toString();
    const pocketmine_json = await GetJson("https://api.github.com/repos/pmmp/PocketMine-MP/releases")
    const bedrock_urls = (await Fetch_Minecraft_net("https://www.minecraft.net/en-us/download/server/bedrock")).get_Urls().filter(d => /bin-/.test(d))
    // Bedrock
    var url_linux, url_win;
    const Bedrock_JSON = {
        x64: {
            linux: "",
            win32: ""
        },
        aarch64: {
            linux: "",
            win32: ""
        }
    }
    bedrock_urls.forEach(urls => {
        if (/win/.test(urls)) Bedrock_JSON.x64.win32 = urls;
        else if (/linux/.test(urls)) {
            if (/aarch64|arm64|arm/.test(urls)) Bedrock_JSON.aarch64.linux = urls;
            else Bedrock_JSON.x64.linux = urls;
        };
    })
    
    // Version
    const BedrockServerVersion = Bedrock_JSON.x64.linux.replace(/[a-zA-Z:\/\-]/gi, "").replace(/^\.*/gi, "").replace(/\.*$/gi, "").trim();
    new_Server.latest.bedrock = BedrockServerVersion
    
    // Bedrock
    if (!(oldServer.bedrock[BedrockServerVersion])) {
        let data = new Date()
        new_Server.bedrock[BedrockServerVersion] = {
            ...Bedrock_JSON,
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
        console.log(new_Server.bedrock[BedrockServerVersion]);
    }
    await CreateLibZIP(Bedrock_JSON.x64.linux)
    
    // Java
    const JavaServerVersion = javaLynx.split(/["'<>]|\n|\t/gi).map(a => a.trim()).filter(a => a).filter(a => /[0-9\.]\.jar/.test(a))[0].split(/[a-zA-Z\.]/gi).map(a => a.trim()).filter(a => /[0-9]/.test(a)).join(".");
    new_Server.latest.java = JavaServerVersion;
    if (!(oldServer.java[JavaServerVersion])) {
        let data = new Date()
        new_Server.java[JavaServerVersion] = {
            url: javaLynx.split(/["'<>]|\n|\t/gi).map(a => a.trim()).filter(a => a).filter(a => /server*\.jar/.test(a))[0],
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
        console.log(new_Server.java[JavaServerVersion]);
    }
    
    // Pocketmine-MP
    new_Server.latest.pocketmine = pocketmine_json[0].tag_name
    for (let index of pocketmine_json){
        if (!(old_Server_file.includes(index.tag_name))) {
            let data = new Date(index.published_at)
            new_Server.pocketmine[index.tag_name] = {
                url: `https://github.com/pmmp/PocketMine-MP/releases/download/${index.tag_name}/PocketMine-MP.phar`,
                data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
            }
            console.log(new_Server.pocketmine[index.tag_name]);
        }
    }
    
    // Spigot
    new_Server.spigot = await Spigot_Lint();
    new_Server.latest.spigot = new_Server.spigot[0].version

    // Add Old in new
    // java
    for (let java of Object.getOwnPropertyNames(oldServer.java)){new_Server.java[java] = oldServer.java[java]}
    
    // bedrock
    for (let bedrock of Object.getOwnPropertyNames(oldServer.bedrock)){new_Server.bedrock[bedrock] = oldServer.bedrock[bedrock]}
    
    // pocketmine
    for (let PocketMine of Object.getOwnPropertyNames(oldServer.pocketmine)){new_Server.pocketmine[PocketMine] = oldServer.pocketmine[PocketMine]}
    
    // Write file
    writeFileSync(Server_path, JSON.stringify(new_Server, null, 4));
    
    exportVariable("pocketmine_version", new_Server.latest.pocketmine)
    exportVariable("java_version", new_Server.latest.java)
    exportVariable("bedrock_version", new_Server.latest.bedrock)
    exportVariable("spigot_version", new_Server.latest.spigot)
})();
