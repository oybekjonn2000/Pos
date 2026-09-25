const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/employees/employees.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed employees.component.ts imports array');
