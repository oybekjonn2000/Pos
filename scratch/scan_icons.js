const fs = require('fs');
const path = require('path');

const emojiRegex = /(\p{Extended_Pictographic}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|[\u2600-\u27BF])/u;

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.angular') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (/\.(ts|html|css|scss|js)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targets = [
  path.join(__dirname, '../frontend/angular-pos/src'),
  path.join(__dirname, '../mobile/waiter-pos/www'),
  path.join(__dirname, '../desktop/electron')
];

let totalMatches = 0;
const resultsByFile = {};

for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (emojiRegex.test(line)) {
        // filter out comments or false positives if needed
        if (!resultsByFile[f]) resultsByFile[f] = [];
        resultsByFile[f].push({ line: index + 1, content: line.trim() });
        totalMatches++;
      }
    });
  }
}

console.log(`Total emoji matches found: ${totalMatches} in ${Object.keys(resultsByFile).length} files\n`);
for (const [file, lines] of Object.entries(resultsByFile)) {
  const rel = path.relative(path.join(__dirname, '..'), file);
  console.log(`File: ${rel} (${lines.length} matches)`);
  for (const item of lines.slice(0, 5)) {
    console.log(`  L${item.line}: ${item.content}`);
  }
  if (lines.length > 5) console.log(`  ... and ${lines.length - 5} more lines`);
}
