const fs = require('fs');
const path = require('path');

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.angular') continue;
      scanDir(fullPath, results);
    } else if (/\.(ts|html|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(EMOJI_REGEX);
      if (matches) {
        results.push({ file: fullPath, count: matches.length, unique: [...new Set(matches)] });
      }
    }
  }
  return results;
}

const targets = [
  path.join(__dirname, '../frontend/angular-pos/src'),
  path.join(__dirname, '../mobile/waiter-pos/www'),
  path.join(__dirname, '../desktop/electron')
];

let total = 0;
for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  console.log(`Scanning: ${target}`);
  const results = scanDir(target);
  for (const r of results) {
    console.log(`  ${r.file.replace(/\\/g, '/')}: ${r.count} emojis (${r.unique.join(' ')})`);
    total += r.count;
  }
}
console.log(`Total emojis found: ${total}`);
