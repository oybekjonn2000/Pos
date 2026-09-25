const fs = require('fs');
const path = require('path');

const sideFile = path.join(__dirname, '../frontend/angular-pos/src/app/layout/sidebar/sidebar.component.ts');
let sideContent = fs.readFileSync(sideFile, 'utf8');

sideContent = sideContent.replace(
  /interface NavItem\s*\{[\s\r\n]*icon:\s*string;[\s\r\n]*label:\s*string;/g,
  'interface NavItem {\n  icon: string;\n  label: string;\n  key?: string;'
);

fs.writeFileSync(sideFile, sideContent, 'utf8');
console.log('Successfully added key?: string to NavItem');
