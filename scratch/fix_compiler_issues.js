const fs = require('fs');
const path = require('path');

// 1. reports.component.ts
const repFile = path.join(__dirname, '../frontend/angular-pos/src/app/reports/reports.component.ts');
let repContent = fs.readFileSync(repFile, 'utf8');
repContent = repContent.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule]',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent]'
);
fs.writeFileSync(repFile, repContent, 'utf8');
console.log('Fixed reports.component.ts imports');

// 2. restaurant-billing.component.ts
const billFile = path.join(__dirname, '../frontend/angular-pos/src/app/restaurant/billing/restaurant-billing.component.ts');
let billContent = fs.readFileSync(billFile, 'utf8');
if (!billContent.includes("import { AppIconComponent }")) {
  billContent = "import { AppIconComponent } from '../../shared/components/icon/icon.component';\n" + billContent;
  fs.writeFileSync(billFile, billContent, 'utf8');
}
console.log('Fixed restaurant-billing.component.ts import');

// 3. lan-server-config-modal.component.ts
const lanFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/lan-server-config-modal/lan-server-config-modal.component.ts');
let lanContent = fs.readFileSync(lanFile, 'utf8');
if (!lanContent.includes("import { AppIconComponent }")) {
  lanContent = "import { AppIconComponent } from '../icon/icon.component';\n" + lanContent;
  fs.writeFileSync(lanFile, lanContent, 'utf8');
}
console.log('Fixed lan-server-config-modal.component.ts import');

// 4. settings.component.ts
const settFile = path.join(__dirname, '../frontend/angular-pos/src/app/settings/settings.component.ts');
let settContent = fs.readFileSync(settFile, 'utf8');
settContent = settContent.replace(
  /<span>\{\{\s*savingAdminPin\(\)\s*\?\s*['"]Saqlanmoqda\.\.\.['"]\s*:\s*['"]<app-icon name="lock" \[size\]="14"><\/app-icon> PIN-kodni Saqlash['"]\s*\}\}<\/span>/g,
  '<span *ngIf="savingAdminPin()">Saqlanmoqda...</span><span *ngIf="!savingAdminPin()"><app-icon name="lock" [size]="14"></app-icon> PIN-kodni Saqlash</span>'
);
fs.writeFileSync(settFile, settContent, 'utf8');
console.log('Fixed settings.component.ts pin button');

// 5. excel-import-modal.component.ts
const excelFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/excel-import-modal/excel-import-modal.component.ts');
let excelContent = fs.readFileSync(excelFile, 'utf8');
excelContent = excelContent.replace(
  /<span>\{\{\s*downloadingTemplate\s*\?\s*['"]Yuklanmoqda\.\.\.['"]\s*:\s*['"]<app-icon name="download" \[size\]="16"><\/app-icon> Shablonni Yuklab Olish['"]\s*\}\}<\/span>/g,
  '<span *ngIf="downloadingTemplate">Yuklanmoqda...</span><span *ngIf="!downloadingTemplate"><app-icon name="download" [size]="16"></app-icon> Shablonni Yuklab Olish</span>'
);
fs.writeFileSync(excelFile, excelContent, 'utf8');
console.log('Fixed excel-import-modal.component.ts template button');
