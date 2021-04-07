const {execSync} = require("child_process")
const { resolve } = require("path")
const AdmZip = require("adm-zip");
const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const {exportVariable} = require("@actions/core")
const php_json = resolve(__dirname, "..", "php_bin.json")
console.log(php_json);
const repo_published = JSON.parse(readFileSync(php_json, "utf8"))
const jekins_url_base = "https://jenkins.pmmp.io/job/PHP-7.4-Aggregate"
const JekinsJSON = JSON.parse(execSync(`curl -sS "${jekins_url_base}/lastSuccessfulBuild/api/json"`))
if (JekinsJSON.displayName !== repo_published.release){
    exportVariable("upload", true)
    for (let index in JekinsJSON.artifacts){
        let url_file = `${jekins_url_base}/lastSuccessfulBuild/artifact/${JekinsJSON.artifacts[index].relativePath}`
        let file_name = JekinsJSON.artifacts[index].relativePath
        repo_published.release = JekinsJSON.displayName
        let ZIPFileName = file_name.split(".tar.gz").join(".zip")
        let ZIPFilePath = resolve(__dirname, "..", "php_files", ZIPFileName)
        let Path = resolve("/tmp", `php_bin_${Math.trunc(Math.random() * 10000000)}`)
        if (file_name.includes("debug")) console.log(`Skip: ${ZIPFileName}`);
        else {
            let JSon_object = ZIPFileName.replaceAll(".zip", "").replaceAll("PHP-7.4-", "");
            repo_published[JSon_object] = `https://github.com/The-Bds-Maneger/Bds-Maneger/releases/download/${process.env.tag_name}/${ZIPFileName}`
            if (file_name.includes(".zip")) execSync(`curl -sS "${url_file}" --output "${ZIPFilePath}"`)
            else {
                mkdirSync(Path)
                execSync(`curl -sS "${url_file}" | tar xfz - -C "${Path}"`)
                let zip = new AdmZip();
                zip.addLocalFolder(Path);
                zip.writeZip(ZIPFilePath);
            }
        }
        writeFileSync(php_json, JSON.stringify(repo_published, null, 4))
    }
} else {console.log("Jupping pocketmine-PHP");exportVariable("upload", false)};