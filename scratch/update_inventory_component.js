const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/inventory/inventory.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent],",
    "imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent, TranslatePipe],"
  );
}

// 2. Template strings
content = content.replace(
  '<h1 class="page-title"><app-icon name="package" [size]="24" class="title-icon"></app-icon> Ombor & Zaxiralar Tizimi</h1>',
  '<h1 class="page-title"><app-icon name="package" [size]="24" class="title-icon"></app-icon> {{ \'inventory.title\' | translate }}</h1>'
);
content = content.replace(
  '<p class="page-subtitle">Real-time inventory management, kirim-chiqim, retseptlar va inventarizatsiya</p>',
  '<p class="page-subtitle">{{ \'inventory.subtitle\' | translate }}</p>'
);
content = content.replace(
  '<app-icon name="refresh" [size]="16"></app-icon> <span>Yangilash</span>',
  '<app-icon name="refresh" [size]="16"></app-icon> <span>{{ \'common.refresh\' | translate }}</span>'
);

content = content.replace(
  '<app-icon name="bar-chart" [size]="16"></app-icon> <span>Dashboard</span>',
  '<app-icon name="bar-chart" [size]="16"></app-icon> <span>{{ \'inventory.dashboard\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="package" [size]="16"></app-icon> <span>Mahsulotlar</span>',
  '<app-icon name="package" [size]="16"></app-icon> <span>{{ \'inventory.items\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="download" [size]="16"></app-icon> <span>Kirim (Xaridlar)</span>',
  '<app-icon name="download" [size]="16"></app-icon> <span>{{ \'inventory.inbound\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="upload" [size]="16"></app-icon> <span>Chiqim (Chiqindilar)</span>',
  '<app-icon name="upload" [size]="16"></app-icon> <span>{{ \'inventory.outbound\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="file-text" [size]="16"></app-icon> <span>Harakatlar Tarixi</span>',
  '<app-icon name="file-text" [size]="16"></app-icon> <span>{{ \'inventory.movements\' | translate }}</span>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('inventory.component.ts updated!');
