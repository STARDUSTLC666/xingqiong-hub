const fs = require('fs');
const html = fs.readFileSync('E:/GeminiSanctuary/wd-tagger/index.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('No inline script found');
new Function(match[1]);
console.log('index.html JS OK');
console.log('file-mode fallback:', html.includes("location.protocol === 'file:'"));
console.log('auto retry:', html.includes('setInterval'));
console.log('direct backend ports left:', (html.match(/127\.0\.0\.1:1843[34]/g) || []).length);
