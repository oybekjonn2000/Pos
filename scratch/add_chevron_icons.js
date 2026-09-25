const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/icon/icon.component.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("'chevron-down':")) {
  content = content.replace(
    "'arrow-right': '<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line><polyline points=\"12 5 19 12 12 19\"></polyline>',",
    `'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',\n  'chevron-down': '<polyline points="6 9 12 15 18 9"></polyline>',\n  'chevron-up': '<polyline points="18 15 12 9 6 15"></polyline>',`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Added chevron-down and chevron-up to icon.component.ts');
}
