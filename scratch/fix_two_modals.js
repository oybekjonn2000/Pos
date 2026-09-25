const fs = require('fs');
const path = require('path');

// 1. excel-import-modal.component.ts
const excelFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/excel-import-modal/excel-import-modal.component.ts');
let excelContent = fs.readFileSync(excelFile, 'utf8');
excelContent = excelContent.replace(
  'imports: [CommonModule, FormsModule],',
  'imports: [CommonModule, FormsModule, AppIconComponent],'
);
excelContent = excelContent.replace(
  '<span class="header-icon">{{ getIcon() }}</span>',
  '<span class="header-icon"><app-icon [name]="getIcon()" [size]="20"></app-icon></span>'
);
fs.writeFileSync(excelFile, excelContent, 'utf8');
console.log('Fixed excel-import-modal.component.ts');

// 2. lan-server-config-modal.component.ts
const lanFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/lan-server-config-modal/lan-server-config-modal.component.ts');
let lanContent = fs.readFileSync(lanFile, 'utf8');
lanContent = lanContent.replace(
  /\{\{\s*isTesting\(\)\s*\?\s*['"]Tekshirilmoqda\.\.\.['"]\s*:\s*['"]<app-icon name="zap" \[size\]="14"><\/app-icon> Ulanishni Tekshirish['"]\s*\}\}/g,
  '<span *ngIf="isTesting()">Tekshirilmoqda...</span><span *ngIf="!isTesting()"><app-icon name="zap" [size]="14"></app-icon> Ulanishni Tekshirish</span>'
);
fs.writeFileSync(lanFile, lanContent, 'utf8');
console.log('Fixed lan-server-config-modal.component.ts');
