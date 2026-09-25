const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/orders/pos/pos.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';\nimport { TranslationService } from '../../core/services/translation.service';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, AppIconComponent],",
    "imports: [CommonModule, FormsModule, AppIconComponent, TranslatePipe],"
  );
}

// 2. Inject TranslationService
if (!content.includes('public i18n = inject(TranslationService);')) {
  content = content.replace(
    "export class PosComponent implements OnInit {",
    "export class PosComponent implements OnInit {\n  public i18n = inject(TranslationService);"
  );
  if (!content.includes('inject,') && !content.includes(', inject')) {
    content = content.replace(
      "import { Component, OnInit, signal, computed",
      "import { Component, OnInit, signal, computed, inject"
    );
  }
}

// 3. Update getStatusLabel
const oldStatus = `  getStatusLabel(item: PosCartItem): string {
    if (item.voided || item.kitchenStatus === 'CANCELLED') return 'BEKOR QILINDI';
    const sent = item.sentQuantity || 0;
    const rem = item.quantity - sent;
    if (sent === 0) return 'YANGI';
    if (rem > 0) return \`\${sent}/\${item.quantity} OSHXONADA (+\${rem} YANGI)\`;
    switch (item.kitchenStatus) {
      case 'SENT_TO_KITCHEN': return 'OSHXONADA';
      case 'ACCEPTED': return 'QABUL QILINDI';
      case 'PREPARING':
      case 'COOKING': return 'TAYYORLANMOQDA';
      case 'READY': return 'TAYYOR';
      case 'DELIVERED':
      case 'SERVED': return 'TARQATILDI';
      default: return 'OSHXONADA';
    }
  }`;

const newStatus = `  getStatusLabel(item: PosCartItem): string {
    if (item.voided || item.kitchenStatus === 'CANCELLED') return this.i18n.t('status.CANCELLED');
    const sent = item.sentQuantity || 0;
    const rem = item.quantity - sent;
    if (sent === 0) return this.i18n.t('status.NEW');
    if (rem > 0) return \`\${sent}/\${item.quantity} \${this.i18n.t('orders.inKitchen')} (+\${rem} \${this.i18n.t('status.NEW')})\`;
    switch (item.kitchenStatus) {
      case 'SENT_TO_KITCHEN': return this.i18n.t('orders.inKitchen');
      case 'ACCEPTED': return this.i18n.t('status.ACCEPTED');
      case 'PREPARING':
      case 'COOKING': return this.i18n.t('status.COOKING');
      case 'READY': return this.i18n.t('status.READY');
      case 'DELIVERED':
      case 'SERVED': return this.i18n.t('status.SERVED');
      default: return this.i18n.t('orders.inKitchen');
    }
  }`;

content = content.replace(oldStatus, newStatus);
if (!content.includes('this.i18n.t(\'orders.inKitchen\')')) {
  content = content.replace(oldStatus.replace(/\n/g, '\r\n'), newStatus.replace(/\n/g, '\r\n'));
}

// 4. Template strings
content = content.replace(
  '<app-icon name="arrow-left" [size]="16"></app-icon> Stollar',
  '<app-icon name="arrow-left" [size]="16"></app-icon> {{ \'nav.tables\' | translate }}'
);
content = content.replace(
  '<button class="btn-change-table" (click)="onLeaveTable()">O\'zgartirish</button>',
  '<button class="btn-change-table" (click)="onLeaveTable()">{{ \'common.edit\' | translate }}</button>'
);
content = content.replace(
  'placeholder="Mahsulot qidirish..."',
  '[placeholder]="\'pos.searchProduct\' | translate"'
);
content = content.replace(
  '<app-icon name="restaurant" [size]="16"></app-icon> Barcha Oshxonalar',
  '<app-icon name="restaurant" [size]="16"></app-icon> {{ \'kitchen.allStations\' | translate }}'
);
content = content.replace(
  '<button class="cat-tab" [class.cat-tab--active]="!selectedCategoryId()" (click)="selectCategory(undefined)">\n            Barcha bo\'limlar',
  '<button class="cat-tab" [class.cat-tab--active]="!selectedCategoryId()" (click)="selectCategory(undefined)">\n            {{ \'common.all\' | translate }}'
);
content = content.replace(
  '<button class="cat-tab" [class.cat-tab--active]="!selectedCategoryId()" (click)="selectCategory(undefined)">\r\n            Barcha bo\'limlar',
  '<button class="cat-tab" [class.cat-tab--active]="!selectedCategoryId()" (click)="selectCategory(undefined)">\r\n            {{ \'common.all\' | translate }}'
);
content = content.replace(
  '<p>Mahsulotlar yuklanmoqda...</p>',
  '<p>{{ \'common.loading\' | translate }}</p>'
);
content = content.replace(
  '<p>Ushbu oshxona yoki bo\'limda mahsulotlar topilmadi.</p>',
  '<p>{{ \'common.noRecords\' | translate }}</p>'
);

content = content.replace(
  '<button type="button" class="btn-close-mobile-cart" (click)="toggleMobileCart(false)"><app-icon name="close" [size]="16"></app-icon> Yopish</button>',
  '<button type="button" class="btn-close-mobile-cart" (click)="toggleMobileCart(false)"><app-icon name="close" [size]="16"></app-icon> {{ \'common.close\' | translate }}</button>'
);
content = content.replace(
  '<span><app-icon name="shopping-bag" [size]="16"></app-icon> Olib Ketish</span>',
  '<span><app-icon name="shopping-bag" [size]="16"></app-icon> {{ \'pos.takeaway\' | translate }}</span>'
);
content = content.replace(
  '<span><app-icon name="cart" [size]="16"></app-icon> Buyurtma</span>',
  '<span><app-icon name="cart" [size]="16"></app-icon> {{ \'orders.orderNumber\' | translate }}</span>'
);
content = content.replace(
  '<button class="cart-clear-btn" (click)="clearCart()">Tozalash</button>',
  '<button class="cart-clear-btn" (click)="clearCart()">{{ \'common.clear\' | translate }}</button>'
);
content = content.replace(
  '<p>Buyurtma bo\'sh</p>',
  '<p>{{ \'pos.cartEmpty\' | translate }}</p>'
);

content = content.replace(
  '<app-icon name="chef" [size]="16"></app-icon> Oshxonaga',
  '<app-icon name="chef" [size]="16"></app-icon> {{ \'orders.sendToKitchen\' | translate }}'
);
content = content.replace(
  '<app-icon name="lock" [size]="16"></app-icon> HISOBNI YOPISH',
  '<app-icon name="lock" [size]="16"></app-icon> {{ \'orders.closedOrders\' | translate }}'
);
content = content.replace(
  '<h3 style="margin: 0;">Taomni bekor qilish</h3>',
  '<h3 style="margin: 0;">{{ \'orders.voidItem\' | translate }}</h3>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('pos.component.ts updated!');
