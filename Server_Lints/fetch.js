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

async function GetJson(url = ""){
    return new Promise((resolve, reject)=>{
        fetch(url).then(response => response.json()).then(data => resolve(data)).catch(error => reject(error))
    });
}


module.exports = {
    GetJson,
    Fetch_Minecraft_net,
}