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
        console.log("Fetching version to Spigot...");
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
            console.log(`Feched latest versions to Spigot! (${returns[0].version})\n`);
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
                const ZipFileLinuxPath = path.resolve(__dirname, "../Linux/libs_amd64.zip");
                zipLib.writeZip(ZipFile);
                zipLib.writeZip(ZipFileLinuxPath);
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
    console.log("Fetching latest versions to Bedrock...");
    const bedrock_urls = (await Fetch_Minecraft_net("https://www.minecraft.net/en-us/download/server/bedrock")).get_Urls().filter(d => /bin-/.test(d));
    
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
    });
    const BedrockServerVersion = Bedrock_JSON.x64.linux.replace(/[a-zA-Z:\/\-]/gi, "").replace(/^\.*/gi, "").replace(/\.*$/gi, "").trim();
    console.log(`Feched latest versions to Bedrock! (${BedrockServerVersion})\n`);
    new_Server.latest.bedrock = BedrockServerVersion
    if (!(oldServer.bedrock[BedrockServerVersion])) {
        await CreateLibZIP(Bedrock_JSON.x64.linux);
        let data = new Date()
        new_Server.bedrock[BedrockServerVersion] = {
            ...Bedrock_JSON,
            data: `${data.getFullYear()}/${data.getMonth() +1}/${data.getDate()}`
        }
        console.log(new_Server.bedrock[BedrockServerVersion]);
    }

    console.log("Fetching latest versions to Java...");
    const javaLynx = (await Fetch_Minecraft_net("https://www.minecraft.net/en-us/download/server")).toString();
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
    console.log(`Feched latest versions to Java! (${JavaServerVersion})\n`);
    

    console.log("Fetching latest versions to PocketMine-MP...");
    const pocketmine_json = await GetJson("https://api.github.com/repos/pmmp/PocketMine-MP/releases");
    console.log(`Feched latest versions to PocketMine-MP! (${pocketmine_json[0].tag_name})\n`);
    
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
    
    // Create git commit template
    const git_commit_template = ["# Server.json update", ""];

    // Bedrock
    if (oldServer.latest.bedrock === new_Server.latest.bedrock) {
        const BedrockTextUpToDate = `- Bedrock up to date (${new_Server.latest.bedrock})\n`;
        git_commit_template.push(BedrockTextUpToDate);
        console.log(BedrockTextUpToDate);
    } else {
        const BedrockTextUpdate = `- Bedrock Update ${oldServer.latest.bedrock} to ${new_Server.latest.bedrock}\n`;
        git_commit_template.push(BedrockTextUpdate);
        console.log(BedrockTextUpdate);
    }
    
    // Java
    if (oldServer.latest.java === new_Server.latest.java) {
        const javaTextUpToDate = `- Java up to date (${new_Server.latest.java})\n`;
        git_commit_template.push(javaTextUpToDate);
        console.log(javaTextUpToDate);
    } else {
        const javaTextUpdate = `- Java Update ${oldServer.latest.java} to ${new_Server.latest.java}\n`;
        git_commit_template.push(javaTextUpdate);
        console.log(javaTextUpdate);
    }

    // Pocketmine-MP
    if (oldServer.latest.pocketmine === new_Server.latest.pocketmine) {
        const PocketmineTextUpToDate = `- Pocketmine-MP up to date (${new_Server.latest.pocketmine})\n`;
        git_commit_template.push(PocketmineTextUpToDate);
        console.log(PocketmineTextUpToDate);
    } else {
        const PocketmineTextUpdate = `- Pocketmine-MP Update ${oldServer.latest.pocketmine} to ${new_Server.latest.pocketmine}\n`;
        git_commit_template.push(PocketmineTextUpdate);
        console.log(PocketmineTextUpdate);
    }

    // Spigot
    if (oldServer.latest.spigot === new_Server.latest.spigot) {
        const SpigotTextUpToDate = `- Spigot up to date (${new_Server.latest.spigot})\n`;
        git_commit_template.push(SpigotTextUpToDate);
        console.log(SpigotTextUpToDate);
    } else {
        const SpigotTextUpdate = `- Spigot Update ${oldServer.latest.spigot} to ${new_Server.latest.spigot}\n`;
        git_commit_template.push(SpigotTextUpdate);
        console.log(SpigotTextUpdate);
    }

    // Write commit file
    writeFileSync(resolve(__dirname, "../.commit_template.md"), git_commit_template.join("\n"));
    
    // Write Server.json file
    writeFileSync(Server_path, JSON.stringify(new_Server, null, 4));
    
    // Export variables
    exportVariable("pocketmine_version", new_Server.latest.pocketmine);
    exportVariable("java_version", new_Server.latest.java);
    exportVariable("bedrock_version", new_Server.latest.bedrock);
    exportVariable("spigot_version", new_Server.latest.spigot);
})();
