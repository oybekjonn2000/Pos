const fs = require('fs');
const path = require('path');

// 1. register.component.ts
const regFile = path.join(__dirname, '../frontend/angular-pos/src/app/auth/register/register.component.ts');
let regContent = fs.readFileSync(regFile, 'utf8');
if (!regContent.includes("import { AppIconComponent }")) {
  regContent = "import { AppIconComponent } from '../../shared/components/icon/icon.component';\n" + regContent;
  fs.writeFileSync(regFile, regContent, 'utf8');
}
console.log('Fixed register.component.ts import');

// 2. login.component.ts
const logFile = path.join(__dirname, '../frontend/angular-pos/src/app/auth/login/login.component.ts');
let logContent = fs.readFileSync(logFile, 'utf8');

logContent = logContent.replace(
  /<span>\{\{\s*employeeLoginLoading\(\)\s*\?\s*['"]Kirilmoqda\.\.\.['"]\s*:\s*['"]Kirish <app-icon name="arrow-right" \[size\]="14"><\/app-icon>['"]\s*\}\}<\/span>/g,
  '<span *ngIf="employeeLoginLoading()">Kirilmoqda...</span><span *ngIf="!employeeLoginLoading()">Kirish <app-icon name="arrow-right" [size]="14"></app-icon></span>'
);

logContent = logContent.replace(
  /<span>\{\{\s*desktopActivateLoading\(\)\s*\?\s*['"]Biriktirilmoqda\.\.\.['"]\s*:\s*['"]<app-icon name="zap" \[size\]="14"><\/app-icon> Restoranga Biriktirish va Kirish['"]\s*\}\}<\/span>/g,
  '<span *ngIf="desktopActivateLoading()">Biriktirilmoqda...</span><span *ngIf="!desktopActivateLoading()"><app-icon name="zap" [size]="14"></app-icon> Restoranga Biriktirish va Kirish</span>'
);

fs.writeFileSync(logFile, logContent, 'utf8');
console.log('Fixed login.component.ts buttons');
