const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/employees/employees.component.ts';
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
  '<h1 class="page-title"><app-icon name="users" [size]="24" class="title-icon"></app-icon> Xodimlar & Lavozimlar</h1>',
  '<h1 class="page-title"><app-icon name="users" [size]="24" class="title-icon"></app-icon> {{ \'employees.title\' | translate }}</h1>'
);
content = content.replace(
  '<p class="page-subtitle">Ofitsiantlar, kassirlar, oshpazlar va tizim foydalanuvchilarini boshqarish</p>',
  '<p class="page-subtitle">{{ \'employees.subtitle\' | translate }}</p>'
);
content = content.replace(
  '<app-icon name="user-plus" [size]="16"></app-icon> <span>Yangi Xodim Qo\'shish</span>',
  '<app-icon name="user-plus" [size]="16"></app-icon> <span>{{ \'employees.addEmployee\' | translate }}</span>'
);
content = content.replace(
  '<span class="slider-title">Faol xodimlar</span>',
  '<span class="slider-title">{{ \'employees.activeStaff\' | translate }}</span>'
);
content = content.replace(
  '<span class="slider-title">Nofaol xodimlar</span>',
  '<span class="slider-title">{{ \'employees.inactiveStaff\' | translate }}</span>'
);
content = content.replace(
  'placeholder="Qidiruv (Ism, login, telefon)..."',
  '[placeholder]="\'common.search\' | translate"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('employees.component.ts updated!');
