const { resolve, join } = require("path")
const { readdirSync, renameSync } = require("fs");

const _a = process.cwd()
console.log(_a);
const fileFolder = readdirSync(_a).filter(data => {return /.zip/gi.test(data)}).filter(data => {return /vc[0-9]/gi.test(data)})
for (let rename of fileFolder) {
    console.log({
        origin: join(_a, rename),
        to: join(_a, "Windows_x64_php_with_vc_redist.zip")
    });
    renameSync(join(_a, rename), join(_a, "Windows_x64_php_redist.zip"))
}