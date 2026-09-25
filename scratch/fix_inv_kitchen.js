const fs = require('fs');
const path = require('path');

// 1. inventory.component.ts
const invFile = path.join(__dirname, '../frontend/angular-pos/src/app/inventory/inventory.component.ts');
let invContent = fs.readFileSync(invFile, 'utf8');
invContent = invContent.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent],'
);
fs.writeFileSync(invFile, invContent, 'utf8');
console.log('Fixed inventory.component.ts imports');

// 2. kitchen-management.component.ts
const kmFile = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen-management/kitchen-management.component.ts');
let kmContent = fs.readFileSync(kmFile, 'utf8');

kmContent = kmContent.replace(
  /<span>\{\{\s*detachingEmployeeId === cook\.id \? ['"]Ajratilmoqda\.\.\.['"] : ['"]<app-icon name="close" \[size\]="14"><\/app-icon> Ajratish['"]\s*\}\}<\/span>/g,
  '<span *ngIf="detachingEmployeeId === cook.id">Ajratilmoqda...</span><span *ngIf="detachingEmployeeId !== cook.id"><app-icon name="x" [size]="14"></app-icon> Ajratish</span>'
);

kmContent = kmContent.replace(
  /<span>\{\{\s*transferring \? ['"]Ko‘chirilmoqda\.\.\.['"] : ['"]<app-icon name="refresh" \[size\]="14"><\/app-icon> Ko‘chirishni Tasdiqlash['"]\s*\}\}<\/span>/g,
  '<span *ngIf="transferring">Ko‘chirilmoqda...</span><span *ngIf="!transferring"><app-icon name="refresh" [size]="14"></app-icon> Ko‘chirishni Tasdiqlash</span>'
);

kmContent = kmContent.replace(
  /<app-icon name="cooking-pot" \[size\]="14"><\/app-icon> \{\{ k\.name \}\} \(\{\{ k\.code \}\}\)/g,
  '{{ k.name }} ({{ k.code }})'
);

fs.writeFileSync(kmFile, kmContent, 'utf8');
console.log('Fixed kitchen-management.component.ts');
