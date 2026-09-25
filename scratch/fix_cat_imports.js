const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/categories/categories.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed categories.component.ts imports array');
