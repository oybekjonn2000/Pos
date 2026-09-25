const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/reports/reports.component.ts';
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
  '<h1 class="page-title"><app-icon name="trending-up" [size]="24" class="title-icon"></app-icon> Tizim Hisobotlari & Analitika</h1>',
  '<h1 class="page-title"><app-icon name="trending-up" [size]="24" class="title-icon"></app-icon> {{ \'reports.title\' | translate }}</h1>'
);
content = content.replace(
  '<app-icon name="refresh" [size]="16"></app-icon> <span>Yangilash</span>',
  '<app-icon name="refresh" [size]="16"></app-icon> <span>{{ \'common.refresh\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="download" [size]="16"></app-icon> <span>CSV Eksport</span>',
  '<app-icon name="download" [size]="16"></app-icon> <span>{{ \'reports.exportCsv\' | translate }}</span>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('reports.component.ts updated!');
