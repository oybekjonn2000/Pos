const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/dashboard/platform-dashboard.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, DecimalPipe, RouterLink],',
  'imports: [CommonModule, DecimalPipe, RouterLink, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed platform-dashboard.component.ts imports');
