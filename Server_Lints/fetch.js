const { execSync } = require("child_process");
const { JSDOM } = require("jsdom");

if (typeof fetch === "undefined") global.fetch = require("node-fetch");
const UserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36";
function Fetch_Minecraft_net(url = "https://www.minecraft.net/en-us/download/server/bedrock"){
    return new Promise((resolve, reject)=>{
        fetch(url, {
            headers: {
                "user-agent": UserAgent,
                "connection": "keep-alive",
                "cache-control": "max-age=0",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "upgrade-insecure-requests": "1",
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "sec-fetch-site": "none",
                "sec-fetch-mode": "navigate",
                "sec-fetch-user": "?1",
                "sec-fetch-dest": "document",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        }).then(r=>r.text()).then(data => {
            resolve({
                get_Urls: function (){
                    return data.split(/["']/gi).filter(d=>/^http[s]:/.test(d.trim()));
                },
                toString: () => data,
            });
        }).catch(error => reject(error));
    });
}

const lynx = (url = "https://google.com") => execSync(`curl -sS -H "user-agent: ${UserAgent}" "${url}" | lynx -dump -stdin`).toString();

async function GetJson(url = ""){
    return new Promise((resolve, reject)=>{
        fetch(url).then(response => response.json()).then(data => resolve(data)).catch(error => reject(error))
    });
}

async function Spigot_Lint(url = "https://getbukkit.org/download/spigot"){
    return new Promise((resolve, reject)=>{
        fetch(url).then(r=>r.text()).then(html_file => {
            const returns = []
            new JSDOM(html_file).window.document.querySelectorAll("#download > div > div > div > div").forEach(DOM => {
                const New_Dom = {
                    version: DOM.querySelector("div:nth-child(1) > h2").innerHTML.trim(),
                    url: DOM.querySelector("div:nth-child(4) > div:nth-child(2) > a").href,
                }
                console.log(New_Dom);
                returns.push(New_Dom)
            })
            resolve(returns);
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = {
    lynx,
    GetJson,
    Spigot_Lint,
    Fetch_Minecraft_net,
}