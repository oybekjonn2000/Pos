const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen-management/kitchen-management.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed kitchen-management.component.ts imports array');
