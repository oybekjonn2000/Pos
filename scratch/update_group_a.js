const fs = require('fs');
const path = require('path');

// 1. app.html
const appHtml = path.join(__dirname, '../frontend/angular-pos/src/app/app.html');
fs.writeFileSync(appHtml, '<router-outlet />\n', 'utf8');
console.log('Cleaned app.html');

// 2. Placeholder components
const placeholders = [
  { file: 'customers/customers.component.ts', icon: 'users', title: 'Customers' },
  { file: 'devices/devices.component.ts', icon: 'monitor', title: 'Device Management' },
  { file: 'setup/setup.component.ts', icon: 'sliders', title: 'Setup Wizard' },
  { file: 'shifts/shifts.component.ts', icon: 'clock', title: 'Shift Management' }
];

for (const p of placeholders) {
  const filePath = path.join(__dirname, '../frontend/angular-pos/src/app', p.file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component } from '@angular/core';", "import { Component } from '@angular/core';\nimport { AppIconComponent } from '../shared/components/icon/icon.component';");
    content = content.replace("imports: [", "imports: [AppIconComponent, ");
    if (!content.includes('imports:')) {
      content = content.replace("standalone: true,", "standalone: true,\n  imports: [AppIconComponent],");
    }
  }
  content = content.replace(
    /<div style="font-size: 48px; margin-bottom: 16px;">🚧<\/div>/g,
    `<div style="margin-bottom: 16px;"><app-icon name="${p.icon}" [size]="48"></app-icon></div>`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${p.file}`);
}

// 3. toast-container.component.ts
const toastFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/toast-container.component.ts');
let toastContent = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from './icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: \`
    <div class="toast-container">
      @for (toast of notify.notifications(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type">
          <span class="toast__icon"><app-icon [name]="getIconName(toast.type)" [size]="18"></app-icon></span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="notify.remove(toast.id)"><app-icon name="x" [size]="14"></app-icon></button>
        </div>
      }
    </div>
  \`
})
export class ToastContainerComponent {
  constructor(public notify: NotificationService) {}

  getIconName(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      case 'info':
      default: return 'info';
    }
  }
}
`;
fs.writeFileSync(toastFile, toastContent, 'utf8');
console.log('Updated toast-container.component.ts');

// 4. lan-server-config-modal.component.ts
const lanFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/lan-server-config-modal/lan-server-config-modal.component.ts');
let lanContent = fs.readFileSync(lanFile, 'utf8');
if (!lanContent.includes('AppIconComponent')) {
  lanContent = lanContent.replace(
    /import { Component, OnInit/g,
    "import { AppIconComponent } from '../icon/icon.component';\nimport { Component, OnInit"
  );
  lanContent = lanContent.replace(
    /imports: \[CommonModule, FormsModule\]/g,
    'imports: [CommonModule, FormsModule, AppIconComponent]'
  );
}
lanContent = lanContent.replace(/<span class="icon">🌐<\/span>/g, '<span class="icon"><app-icon name="globe" [size]="20"></app-icon></span>');
lanContent = lanContent.replace(/<button class="close-btn" \(click\)="close\(\)">✕<\/button>/g, '<button class="close-btn" (click)="close()"><app-icon name="x" [size]="18"></app-icon></button>');
lanContent = lanContent.replace(/🟢 Serverga ulanish faol \(ONLINE\)/g, '<app-icon name="check-circle" [size]="14"></app-icon> Serverga ulanish faol (ONLINE)');
lanContent = lanContent.replace(/🟡 Server bilan qayta ulanilmoqda\.\.\./g, '<app-icon name="refresh" [size]="14"></app-icon> Server bilan qayta ulanilmoqda...');
lanContent = lanContent.replace(/🔴 Server bilan aloqa yo\'q \(OFFLINE\)/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> Server bilan aloqa yo\'q (OFFLINE)');
lanContent = lanContent.replace(/<span class="input-icon">💻<\/span>/g, '<span class="input-icon"><app-icon name="monitor" [size]="16"></app-icon></span>');
lanContent = lanContent.replace(/<span class="input-icon">🔌<\/span>/g, '<span class="input-icon"><app-icon name="link" [size]="16"></app-icon></span>');
lanContent = lanContent.replace(/<span class="res-icon">{{ testResult\(\)\?\.ok \? \'✅\' : \'⚠️\' }}<\/span>/g, '<span class="res-icon"><app-icon [name]="testResult()?.ok ? \'check-circle\' : \'alert-triangle\'" [size]="16"></app-icon></span>');
lanContent = lanContent.replace(/🔍 Avtomatik Qidirish/g, '<app-icon name="search" [size]="14"></app-icon> Avtomatik Qidirish');
lanContent = lanContent.replace(/⚡ Ulanishni Tekshirish/g, '<app-icon name="zap" [size]="14"></app-icon> Ulanishni Tekshirish');
lanContent = lanContent.replace(/💾 Saqlash va Ulanish/g, '<app-icon name="save" [size]="14"></app-icon> Saqlash va Ulanish');
fs.writeFileSync(lanFile, lanContent, 'utf8');
console.log('Updated lan-server-config-modal.component.ts');

// 5. excel-import-modal.component.ts
const excelFile = path.join(__dirname, '../frontend/angular-pos/src/app/shared/components/excel-import-modal/excel-import-modal.component.ts');
let excelContent = fs.readFileSync(excelFile, 'utf8');
if (!excelContent.includes('AppIconComponent')) {
  excelContent = excelContent.replace(
    /import { Component, Input/g,
    "import { AppIconComponent } from '../icon/icon.component';\nimport { Component, Input"
  );
  excelContent = excelContent.replace(
    /imports: \[CommonModule\]/g,
    'imports: [CommonModule, AppIconComponent]'
  );
}
excelContent = excelContent.replace(/<button class="close-btn" \(click\)="close\(\)" \[disabled\]="loading \|\| importing">✕<\/button>/g, '<button class="close-btn" (click)="close()" [disabled]="loading || importing"><app-icon name="x" [size]="18"></app-icon></button>');
excelContent = excelContent.replace(/<div class="drop-icon">📊<\/div>/g, '<div class="drop-icon"><app-icon name="bar-chart" [size]="32"></app-icon></div>');
excelContent = excelContent.replace(/📂 Faylni tanlash/g, '<app-icon name="folder" [size]="16"></app-icon> Faylni tanlash');
excelContent = excelContent.replace(/<strong>💡 To\'g\'ri formatdagi shablon kerakmi\?<\/strong>/g, '<strong><app-icon name="info" [size]="16"></app-icon> To\'g\'ri formatdagi shablon kerakmi?</strong>');
excelContent = excelContent.replace(/📥 Shablonni Yuklab Olish/g, '<app-icon name="download" [size]="16"></app-icon> Shablonni Yuklab Olish');
excelContent = excelContent.replace(/<span class="file-icon">📄<\/span>/g, '<span class="file-icon"><app-icon name="file-text" [size]="16"></app-icon></span>');
excelContent = excelContent.replace(/🔄 Boshqa fayl tanlash/g, '<app-icon name="refresh" [size]="14"></app-icon> Boshqa fayl tanlash');
excelContent = excelContent.replace(/<span class="stat-lbl">✅ Yaroqli \(OK\)<\/span>/g, '<span class="stat-lbl"><app-icon name="check-circle" [size]="14"></app-icon> Yaroqli (OK)</span>');
excelContent = excelContent.replace(/<span class="stat-lbl">⚠️ Xatoli \(ERROR\)<\/span>/g, '<span class="stat-lbl"><app-icon name="alert-triangle" [size]="14"></app-icon> Xatoli (ERROR)</span>');
excelContent = excelContent.replace(/<span>⚠️ <strong>{{ preview\.errorRows }} ta<\/strong>/g, '<span><app-icon name="alert-triangle" [size]="14"></app-icon> <strong>{{ preview.errorRows }} ta</strong>');
excelContent = excelContent.replace(/{{ item\.valid \? \'✅ OK\' : \'❌ XATO\' }}/g, '{{ item.valid ? \'OK\' : \'XATO\' }}');
excelContent = excelContent.replace(/<span class="result-icon">{{ result\.success \? \'🎉\' : \'⚠️\' }}<\/span>/g, '<span class="result-icon"><app-icon [name]="result.success ? \'check-circle\' : \'alert-triangle\'" [size]="32"></app-icon></span>');
excelContent = excelContent.replace(/🚀 {{ preview\.validRows }} ta qatorni import qilish/g, '<app-icon name="upload" [size]="16"></app-icon> {{ preview.validRows }} ta qatorni import qilish');
excelContent = excelContent.replace("case 'kitchens': return '🥘';", "case 'kitchens': return 'utensils';");
excelContent = excelContent.replace("case 'categories': return '🏷️';", "case 'categories': return 'tag';");
excelContent = excelContent.replace("case 'products': return '🍔';", "case 'products': return 'package';");

fs.writeFileSync(excelFile, excelContent, 'utf8');
console.log('Updated excel-import-modal.component.ts');
