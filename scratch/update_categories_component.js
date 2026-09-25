const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/categories/categories.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent],",
    "imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent, TranslatePipe],"
  );
}

// 2. Template strings
content = content.replace(
  '<h1 class="page-title"><app-icon name="tag" [size]="24"></app-icon> Bo\'limlar & Kategoriyalar</h1>',
  '<h1 class="page-title"><app-icon name="tag" [size]="24"></app-icon> {{ \'categories.title\' | translate }}</h1>'
);
content = content.replace(
  '<span><app-icon name="plus" [size]="14"></app-icon> Yangi Kategoriya Qo\'shish</span>',
  '<span><app-icon name="plus" [size]="14"></app-icon> {{ \'categories.addCategory\' | translate }}</span>'
);
content = content.replace(
  'placeholder="Kategoriyani qidirish..."',
  '[placeholder]="\'common.search\' | translate"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('categories.component.ts updated!');
