const fs = require('fs');
const path = require('path');

// 1. kitchen.component.ts
const kFile = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen.component.ts');
let kContent = fs.readFileSync(kFile, 'utf8');
kContent = kContent.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule, RouterLink],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, RouterLink, AppIconComponent],'
);
fs.writeFileSync(kFile, kContent, 'utf8');
console.log('Fixed kitchen.component.ts imports');

// 2. orders-list.component.ts
const oFile = path.join(__dirname, '../frontend/angular-pos/src/app/orders/orders-list/orders-list.component.ts');
let oContent = fs.readFileSync(oFile, 'utf8');
oContent = oContent.replace(/\[size="14"/g, '[size]="14"');
fs.writeFileSync(oFile, oContent, 'utf8');
console.log('Fixed orders-list.component.ts size attribute');
