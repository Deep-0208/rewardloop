const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace any existing CACHE_NAME line
swContent = swContent.replace(/const CACHE_NAME = '.*';/, `const CACHE_NAME = 'rewardloop-v${pkg.version}';`);

fs.writeFileSync(swPath, swContent);
console.log('Injected Service Worker version:', pkg.version);
