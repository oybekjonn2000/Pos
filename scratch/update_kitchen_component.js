const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/kitchen/kitchen.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';\nimport { TranslationService } from '../core/services/translation.service';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, MatPaginatorModule, RouterLink, AppIconComponent],",
    "imports: [CommonModule, FormsModule, MatPaginatorModule, RouterLink, AppIconComponent, TranslatePipe],"
  );
}

// 2. Inject TranslationService
if (!content.includes('public i18n = inject(TranslationService);')) {
  content = content.replace(
    "export class KitchenComponent implements OnInit, OnDestroy {",
    "export class KitchenComponent implements OnInit, OnDestroy {\n  public i18n = inject(TranslationService);"
  );
  if (!content.includes('inject,') && !content.includes(', inject')) {
    content = content.replace(
      "import { Component, OnInit, OnDestroy, ChangeDetectorRef",
      "import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject"
    );
  }
}

// 3. Update getStatusText
const oldStatus = `  getStatusText(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'NEW': return 'YANGI';
      case 'SENT_TO_KITCHEN': return 'OSHXONADA';
      case 'ACCEPTED': return 'QABUL QILINDI';
      case 'PREPARING':
      case 'COOKING': return 'QABUL QILINDI';
      case 'READY': return 'TAYYOR';
      case 'DELIVERED':
      case 'SERVED': return 'TARQATILDI';
      case 'CANCELLED': return 'BEKOR QILINDI';
      default: return status || 'YANGI';
    }
  }`;

const newStatus = `  getStatusText(status?: string): string {
    const key = (status || '').toUpperCase();
    if (key === 'NEW') return this.i18n.t('status.NEW');
    if (key === 'SENT_TO_KITCHEN') return this.i18n.t('orders.inKitchen');
    if (key === 'ACCEPTED' || key === 'COOKING' || key === 'PREPARING') return this.i18n.t('status.ACCEPTED');
    if (key === 'READY') return this.i18n.t('status.READY');
    if (key === 'SERVED' || key === 'DELIVERED') return this.i18n.t('status.SERVED');
    if (key === 'CANCELLED') return this.i18n.t('status.CANCELLED');
    return this.i18n.t('status.' + key) || status || this.i18n.t('status.NEW');
  }`;

content = content.replace(oldStatus, newStatus);
if (!content.includes('this.i18n.t(\'status.ACCEPTED\')')) {
  content = content.replace(oldStatus.replace(/\n/g, '\r\n'), newStatus.replace(/\n/g, '\r\n'));
}

// 4. Template strings
content = content.replace(
  '<h1 class="kds-title"><app-icon name="chef" [size]="24"></app-icon> Oshxona Ekrani (KDS)</h1>',
  '<h1 class="kds-title"><app-icon name="chef" [size]="24"></app-icon> {{ \'kitchen.title\' | translate }}</h1>'
);

content = content.replace(
  'Faol ({{ countActiveCards() }})',
  '{{ \'common.active\' | translate }} ({{ countActiveCards() }})'
);
content = content.replace(
  'Yangi ({{ countCardsByStatus(\'NEW\') }})',
  '{{ \'status.NEW\' | translate }} ({{ countCardsByStatus(\'NEW\') }})'
);
content = content.replace(
  'Qabul qilingan ({{ countCardsByStatus(\'ACCEPTED\') }})',
  '{{ \'status.ACCEPTED\' | translate }} ({{ countCardsByStatus(\'ACCEPTED\') }})'
);
content = content.replace(
  'Tayyor ({{ countCardsByStatus(\'READY\') }})',
  '{{ \'status.READY\' | translate }} ({{ countCardsByStatus(\'READY\') }})'
);
content = content.replace(
  'Tarqatilgan ({{ countCardsByStatus(\'SERVED\') }})',
  '{{ \'status.SERVED\' | translate }} ({{ countCardsByStatus(\'SERVED\') }})'
);

content = content.replace(
  '<span class="stations-label">Oshxona Stansiyasi:</span>',
  '<span class="stations-label">{{ \'kitchen.kitchenStation\' | translate }}:</span>'
);
content = content.replace(
  '<span class="station-name">Barchasi</span>',
  '<span class="station-name">{{ \'common.all\' | translate }}</span>'
);

content = content.replace(
  '<p>Buyurtmalar yuklanmoqda...</p>',
  '<p>{{ \'common.loading\' | translate }}</p>'
);

content = content.replace(
  '<app-icon name="download" [size]="14"></app-icon> QABUL QILISH',
  '<app-icon name="download" [size]="14"></app-icon> {{ \'kitchen.acceptBatch\' | translate }}'
);
content = content.replace(
  '<app-icon name="check-circle" [size]="14"></app-icon> TAYYOR',
  '<app-icon name="check-circle" [size]="14"></app-icon> {{ \'kitchen.markReady\' | translate }}'
);
content = content.replace(
  '<app-icon name="restaurant" [size]="14"></app-icon> TARQATILDI',
  '<app-icon name="restaurant" [size]="14"></app-icon> {{ \'kitchen.markServed\' | translate }}'
);
content = content.replace(
  '<app-icon name="undo" [size]="14"></app-icon> Qaytarish',
  '<app-icon name="undo" [size]="14"></app-icon> {{ \'common.back\' | translate }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('kitchen.component.ts updated!');
