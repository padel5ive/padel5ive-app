'use strict';
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file, 'utf8');
const marker = '<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->';
const assets = [
  'p5-structured-fairness-lab.js',
  'p5-structured-irregular-lab.js',
  'p5-structured-mexicano-diversity-lab.js'
];
const insert = marker + assets.map(name => '<script src="/assets/' + name + '"></script>').join('');
if (!html.includes('window.P5StructuredCycle534=') ||
    !html.includes('window.P5StructuredMX534=') ||
    !html.includes('window.P5Fair532=')) {
  throw Error('Structured engine baseline missing; integration aborted');
}
for (const name of assets) {
  if (!fs.existsSync('public/assets/' + name)) throw Error('Missing lab asset: ' + name);
}
// PDF renderer contains a literal </body> inside embedded JavaScript.
// Always inject at the LAST document-level </body>, never the first occurrence.
const close = html.lastIndexOf('</body>');
if (close < 0 || !/^<\/body>\s*<\/html>\s*$/i.test(html.slice(close))) {
  throw Error('Dashboard document closing body/html tags missing');
}
const occurrences = html.split(marker).length - 1;
if (occurrences === 0) {
  html = html.slice(0, close) + insert + html.slice(close);
  fs.writeFileSync(file, html, 'utf8');
} else if (occurrences !== 1) {
  throw Error('Duplicate structured lab injection marker');
}
const lastBody = html.lastIndexOf('</body>');
if (html.slice(lastBody - insert.length, lastBody) !== insert) {
  throw Error('Structured lab scripts not immediately before final body close');
}
console.log('PASS: Structured lab scripts inserted once at final HTML body, outside embedded JS/PDF templates.');
