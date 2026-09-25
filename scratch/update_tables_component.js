const fs = require('fs');
const filePath = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/tables/tables.component.ts';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add TranslatePipe import
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, AppIconComponent],",
    "imports: [CommonModule, FormsModule, AppIconComponent, TranslatePipe],"
  );
}

// 2. Localize template strings
content = content.replace(
  '<h1 class="page-title">Stollar Xaritasi</h1>',
  '<h1 class="page-title">{{ \'tables.title\' | translate }}</h1>'
);
content = content.replace(
  '<p class="page-subtitle">Restoran stollari va ularning real holati (Band / Bo\'sh)</p>',
  '<p class="page-subtitle">{{ \'tables.subtitle\' | translate }}</p>'
);
content = content.replace(
  '<app-icon name="refresh" [size]="16"></app-icon> Yangilash',
  '<app-icon name="refresh" [size]="16"></app-icon> {{ \'common.refresh\' | translate }}'
);
content = content.replace(
  '<app-icon name="hall" [size]="16"></app-icon> + Yangi Joy',
  '<app-icon name="hall" [size]="16"></app-icon> + {{ \'tables.addZone\' | translate }}'
);
content = content.replace(
  '<app-icon name="plus" [size]="16"></app-icon> Stol Qo\'shish',
  '<app-icon name="plus" [size]="16"></app-icon> {{ \'tables.newTable\' | translate }}'
);

content = content.replace(
  '<span class="stat-label">Jami Stollar:</span>',
  '<span class="stat-label">{{ \'common.total\' | translate }} {{ \'tables.table\' | translate }}:</span>'
);
content = content.replace(
  '<span class="stat-label">Bo\'sh (FREE):</span>',
  '<span class="stat-label">{{ \'tables.statusAvailable\' | translate }}:</span>'
);
content = content.replace(
  '<span class="stat-label">Band (OCCUPIED):</span>',
  '<span class="stat-label">{{ \'tables.statusOccupied\' | translate }}:</span>'
);

content = content.replace(
  '<span class="zone-filter-title">Joylashuv (Zona):</span>',
  '<span class="zone-filter-title">{{ \'tables.zoneName\' | translate }}:</span>'
);
content = content.replace(
  '<span class="zone-tab-name">Barchasi</span>',
  '<span class="zone-tab-name">{{ \'common.all\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="edit" [size]="14"></app-icon> Tahrirlash',
  '<app-icon name="edit" [size]="14"></app-icon> {{ \'common.edit\' | translate }}'
);
content = content.replace(
  '<app-icon name="trash" [size]="14"></app-icon> O\'chirish',
  '<app-icon name="trash" [size]="14"></app-icon> {{ \'common.delete\' | translate }}'
);

content = content.replace(
  '<p>Stollar yuklanmoqda...</p>',
  '<p>{{ \'common.loading\' | translate }}</p>'
);
content = content.replace(
  '<h3>Stollar topilmadi</h3>',
  '<h3>{{ \'common.noRecords\' | translate }}</h3>'
);

content = content.replace(
  '<span class="table-status-badge badge--free">BOʻSH</span>',
  '<span class="table-status-badge badge--free">{{ \'tables.statusAvailable\' | translate }}</span>'
);
content = content.replace(
  '<span class="table-status-badge badge--occupied">BAND (Mening stolim)</span>',
  '<span class="table-status-badge badge--occupied">{{ \'tables.statusOccupied\' | translate }}</span>'
);
content = content.replace(
  '<app-icon name="plus" [size]="14"></app-icon> Buyurtma ochish',
  '<app-icon name="plus" [size]="14"></app-icon> {{ \'tables.openOrder\' | translate }}'
);
content = content.replace(
  '<app-icon name="eye" [size]="14"></app-icon> OCHISH',
  '<app-icon name="eye" [size]="14"></app-icon> {{ \'common.view\' | translate }}'
);
content = content.replace(
  '<h3 class="modal-title">Yangi Stol Qo\'shish</h3>',
  '<h3 class="modal-title">{{ \'tables.newTable\' | translate }}</h3>'
);
content = content.replace(
  '<button class="btn btn--secondary" (click)="closeModal()">Bekor qilish</button>',
  '<button class="btn btn--secondary" (click)="closeModal()">{{ \'common.cancel\' | translate }}</button>'
);
content = content.replace(
  '<app-icon name="save" [size]="16"></app-icon> Saqlash',
  '<app-icon name="save" [size]="16"></app-icon> {{ \'common.save\' | translate }}'
);
content = content.replace(
  '<button class="btn btn--secondary" (click)="closeZoneModal()">Bekor qilish</button>',
  '<button class="btn btn--secondary" (click)="closeZoneModal()">{{ \'common.cancel\' | translate }}</button>'
);
content = content.replace(
  '<app-icon name="save" [size]="16"></app-icon> Saqlash',
  '<app-icon name="save" [size]="16"></app-icon> {{ \'common.save\' | translate }}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('tables.component.ts updated!');
