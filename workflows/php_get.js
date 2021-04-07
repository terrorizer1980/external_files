const {execSync} = require("child_process")
const { resolve } = require("path")
const AdmZip = require("adm-zip");
const { readFileSync, writeFileSync } = require("fs");

const php_json = resolve(__dirname, "..", "php_bin.json")
const repo_published = JSON.parse(readFileSync(php_json, "utf8"))
const jekins_url_base = "https://jenkins.pmmp.io/job/PHP-7.4-Aggregate"
const JekinsJSON = JSON.parse(execSync(`curl -sS "${jekins_url_base}/lastSuccessfulBuild/api/json"`))
if (JekinsJSON.displayName !== repo_published.release){
    repo_published.release = JekinsJSON.displayName
    for (let index in JekinsJSON.artifacts){
        let url_file = `${jekins_url_base}/lastSuccessfulBuild/artifact/${JekinsJSON.artifacts[index].relativePath}`
        let file_name = JekinsJSON.artifacts[index].relativePath
        if (file_name.includes(".zip")) execSync(`curl -sS "${url_file}" --output /tmp/${file_name}`);
        else {
            let ZIPFileName = file_name.split(".tar.gz").join(".zip")
            let ZIPFilePath = resolve(__dirname, "..", ZIPFileName)
            let Path = resolve("/tmp", `php_bin_${Math.trunc(Math.random * 10000000)}`)
            execSync(`curl -sS "${url_file}" | tar xfz - -C "${Path}"`)
            let zip = new AdmZip();
            zip.addLocalFolder(Path);
            zip.writeZip(ZIPFilePath);
            repo_published[ZIPFileName.replaceAll(".zip", "")] = `https://raw.githubusercontent.com/The-Bds-Maneger/Raw_files/main/${ZIPFileName}`
        }
    }
    writeFileSync(php_json, JSON.stringify(repo_published, null, 4))
} else console.log("Jupping pocketmine-PHP");