const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/orders/orders-list/orders-list.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';\nimport { TranslationService } from '../../core/services/translation.service';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, RouterModule, MatPaginatorModule, AppIconComponent],",
    "imports: [CommonModule, FormsModule, RouterModule, MatPaginatorModule, AppIconComponent, TranslatePipe],"
  );
}

// 2. Inject i18n
if (!content.includes('public i18n = inject(TranslationService);')) {
  content = content.replace(
    "export class OrdersListComponent implements OnInit {",
    "export class OrdersListComponent implements OnInit {\n  public i18n = inject(TranslationService);"
  );
  // Ensure inject is imported if not present
  if (!content.includes('inject,') && !content.includes(', inject')) {
    content = content.replace(
      "import { Component, OnInit, ChangeDetectorRef",
      "import { Component, OnInit, ChangeDetectorRef, inject"
    );
  }
}

// 3. Update getStatusLabel and getItemKitchenStatusLabel
const oldStatusLabel = `  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CLOSED': return 'YOPILGAN';
      case 'OPEN': return 'OCHIQ';
      case 'DRAFT': return 'QORALAMA';
      case 'SENT_TO_KITCHEN': return 'OSHXONADA';
      case 'PREPARING':
      case 'COOKING': return 'TAYYORLANMOQDA';
      case 'READY': return 'TAYYOR';
      case 'PAID': return 'TO‘LANGAN';
      case 'COMPLETED': return 'YAKUNLANGAN';
      case 'CANCELLED': return 'BEKOR QILINDI';
      default: return status || '—';
    }
  }`;

const newStatusLabel = `  getStatusLabel(status: string): string {
    const key = (status || '').toUpperCase();
    if (key === 'CLOSED') return this.i18n.t('orders.closedOrders');
    if (key === 'OPEN') return this.i18n.t('status.OPEN');
    if (key === 'DRAFT') return this.i18n.t('status.NEW');
    if (key === 'SENT_TO_KITCHEN') return this.i18n.t('orders.inKitchen');
    if (key === 'PREPARING' || key === 'COOKING') return this.i18n.t('status.COOKING');
    if (key === 'READY') return this.i18n.t('status.READY');
    if (key === 'PAID' || key === 'COMPLETED') return this.i18n.t('status.PAID');
    if (key === 'CANCELLED') return this.i18n.t('status.CANCELLED');
    return this.i18n.t('status.' + key) || status || '—';
  }`;

content = content.replace(oldStatusLabel, newStatusLabel);
if (!content.includes('this.i18n.t(\'orders.closedOrders\')')) {
  // Try CRLF replacement
  const oldStatusLabelCRLF = oldStatusLabel.replace(/\n/g, '\r\n');
  content = content.replace(oldStatusLabelCRLF, newStatusLabel.replace(/\n/g, '\r\n'));
}

const oldItemLabel = `  getItemKitchenStatusLabel(item: any): string {
    if (item.voided || item.kitchenStatus === 'CANCELLED') return 'BEKOR QILINDI';
    const st = (item.kitchenStatus || 'NEW').toUpperCase();
    switch (st) {
      case 'NEW': return 'YANGI';
      case 'SENT_TO_KITCHEN': return 'OSHXONADA';
      case 'ACCEPTED': return 'QABUL QILINDI';
      case 'PREPARING':
      case 'COOKING': return 'TAYYORLANMOQDA';
      case 'READY': return 'TAYYOR';
      case 'DELIVERED':
      case 'SERVED': return 'TARQATILDI';
      default: return st;
    }
  }`;

const newItemLabel = `  getItemKitchenStatusLabel(item: any): string {
    if (item.voided || item.kitchenStatus === 'CANCELLED') return this.i18n.t('status.CANCELLED');
    const st = (item.kitchenStatus || 'NEW').toUpperCase();
    switch (st) {
      case 'NEW': return this.i18n.t('status.NEW');
      case 'SENT_TO_KITCHEN': return this.i18n.t('orders.inKitchen');
      case 'ACCEPTED': return this.i18n.t('status.ACCEPTED');
      case 'PREPARING':
      case 'COOKING': return this.i18n.t('status.COOKING');
      case 'READY': return this.i18n.t('status.READY');
      case 'DELIVERED':
      case 'SERVED': return this.i18n.t('status.SERVED');
      default: return this.i18n.t('status.' + st) || st;
    }
  }`;

content = content.replace(oldItemLabel, newItemLabel);
if (!content.includes('this.i18n.t(\'status.ACCEPTED\')')) {
  // Try CRLF replacement
  content = content.replace(oldItemLabel.replace(/\n/g, '\r\n'), newItemLabel.replace(/\n/g, '\r\n'));
}

// 4. Template strings
content = content.replace(
  '<h1 class="page-title"><app-icon name="orders" [size]="24"></app-icon> Buyurtmalar & Kassa</h1>',
  '<h1 class="page-title"><app-icon name="orders" [size]="24"></app-icon> {{ \'orders.title\' | translate }}</h1>'
);
content = content.replace(
  '<p class="page-subtitle">Barcha buyurtmalar monitoringi, to\'lovlarni qabul qilish va chek chiqarish</p>',
  '<p class="page-subtitle">{{ \'orders.subtitle\' | translate }}</p>'
);
content = content.replace(
  '<span>Yangilash</span>',
  '<span>{{ \'common.refresh\' | translate }}</span>'
);
content = content.replace(
  '<span><app-icon name="plus" [size]="16"></app-icon> Joylar va Stollar</span>',
  '<span><app-icon name="plus" [size]="16"></app-icon> {{ \'nav.tables\' | translate }}</span>'
);

content = content.replace(
  '<app-icon name="lock" [size]="14"></app-icon> Yopilgan / To\'lov Kutilmoqda ({{ closedOrdersCount }})',
  '<app-icon name="lock" [size]="14"></app-icon> {{ \'orders.closedOrders\' | translate }} ({{ closedOrdersCount }})'
);
content = content.replace(
  'Ochiq ({{ openOrdersCount }})',
  '{{ \'orders.openOrders\' | translate }} ({{ openOrdersCount }})'
);
content = content.replace(
  'Oshxonada ({{ kitchenOrdersCount }})',
  '{{ \'orders.inKitchen\' | translate }} ({{ kitchenOrdersCount }})'
);
content = content.replace(
  'Tayyor ({{ readyOrdersCount }})',
  '{{ \'orders.readyOrders\' | translate }} ({{ readyOrdersCount }})'
);
content = content.replace(
  '<app-icon name="scroll" [size]="14"></app-icon> Buyurtma Tarixi ({{ paidOrdersCount }})',
  '<app-icon name="scroll" [size]="14"></app-icon> {{ \'orders.orderHistory\' | translate }} ({{ paidOrdersCount }})'
);

content = content.replace(
  '<span>Faol buyurtmalar:</span>',
  '<span>{{ \'dashboard.activeOrders\' | translate }}:</span>'
);
content = content.replace(
  '<span>Bugungi tushum:</span>',
  '<span>{{ \'dashboard.todayRevenue\' | translate }}:</span>'
);
content = content.replace(
  '<p>Buyurtmalar yuklanmoqda...</p>',
  '<p>{{ \'common.loading\' | translate }}</p>'
);
content = content.replace(
  '<h3>Buyurtmalar topilmadi</h3>',
  '<h3>{{ \'common.noRecords\' | translate }}</h3>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('orders-list.component.ts updated!');
