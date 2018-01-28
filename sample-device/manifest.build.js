const fs = require('fs');
const base64Img = require('base64-img');
let manifest = require('./manifest.template.json');

fs.readdirSync('./icons')
    .forEach(name => {
        manifest.icons[name.replace('.png', '')] = base64Img.base64Sync(`./icons/${name}`);
    });

let manifest_content = JSON.stringify(manifest, null, 2);
/*let lambdas = require('./lambdas');
Object.keys(lambdas)
    .forEach(name => {
        manifest_content = manifest_content.replace(`{{${name}}}`, lambdas[name].toString().replace(/\n/g, ''))
    });
*/
fs.writeFileSync(`data/manifest.json`, manifest_content);
