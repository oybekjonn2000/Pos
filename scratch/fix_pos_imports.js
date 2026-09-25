const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/orders/pos/pos.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, FormsModule],',
  'imports: [CommonModule, FormsModule, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed pos.component.ts imports');
