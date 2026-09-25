const fs = require('fs');
const filePath = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/dashboard/dashboard.component.ts';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add TranslatePipe import
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';"
  );
  content = content.replace(
    "imports: [CommonModule, RouterModule, AppIconComponent],",
    "imports: [CommonModule, RouterModule, AppIconComponent, TranslatePipe],"
  );
}

// 2. Template replacements
content = content.replace(
  '<h1 class="welcome-title">Xush kelibsiz, {{ currentUserName }}!</h1>',
  '<h1 class="welcome-title">{{ \'dashboard.welcome\' | translate }}, {{ currentUserName }}!</h1>'
);

content = content.replace(
  '<p class="welcome-subtitle">Bugungi restoran faoliyati va asosiy ko\'rsatkichlar monitoringi</p>',
  '<p class="welcome-subtitle">{{ \'dashboard.subtitle\' | translate }}</p>'
);

content = content.replace(
  '<span>Yangilash</span>',
  '<span>{{ \'common.refresh\' | translate }}</span>'
);

// KPI 1
content = content.replace(
  '<span class="kpi-title">Bugungi Tushum</span>',
  '<span class="kpi-title">{{ \'dashboard.todayRevenue\' | translate }}</span>'
);
content = content.replace(
  "<div class=\"kpi-value\">{{ totalRevenue | number:'1.0-0' }} <small>so'm</small></div>",
  "<div class=\"kpi-value\">{{ totalRevenue | number:'1.0-0' }} <small>{{ 'common.currency' | translate }}</small></div>"
);
content = content.replace(
  '<span class="kpi-subtext">To\'langan {{ paidOrdersCount }} ta buyurtma bo\'yicha</span>',
  '<span class="kpi-subtext">{{ \'dashboard.paidOrdersCount\' | translate:{ count: paidOrdersCount } }}</span>'
);

// KPI 2
content = content.replace(
  '<span class="kpi-title">Faol Buyurtmalar</span>',
  '<span class="kpi-title">{{ \'dashboard.activeOrders\' | translate }}</span>'
);
content = content.replace(
  '<span class="kpi-subtext">{{ kitchenOrdersCount }} tasi oshxonada tayyorlanmoqda</span>',
  '<span class="kpi-subtext">{{ \'dashboard.cookingCount\' | translate:{ count: kitchenOrdersCount } }}</span>'
);

// KPI 3
content = content.replace(
  '<span class="kpi-title">Band Stollar</span>',
  '<span class="kpi-title">{{ \'dashboard.occupiedTables\' | translate }}</span>'
);
content = content.replace(
  '<span class="kpi-subtext">{{ freeTablesCount }} ta stol bo\'sh</span>',
  '<span class="kpi-subtext">{{ \'dashboard.freeTablesCount\' | translate:{ count: freeTablesCount } }}</span>'
);

// KPI 4
content = content.replace(
  '<span class="kpi-title">Tayyor Buyurtmalar</span>',
  '<span class="kpi-title">{{ \'dashboard.readyOrders\' | translate }}</span>'
);
content = content.replace(
  '<span class="kpi-subtext">Yetkazishga tayyor holatda</span>',
  '<span class="kpi-subtext">{{ \'dashboard.readyToServe\' | translate }}</span>'
);

// Quick actions
content = content.replace(
  '<strong>Yangi Buyurtma</strong>\n            <span>POS terminalni ochish</span>',
  '<strong>{{ \'dashboard.newOrder\' | translate }}</strong>\n            <span>{{ \'dashboard.openPos\' | translate }}</span>'
);
content = content.replace(
  '<strong>Yangi Buyurtma</strong>\r\n            <span>POS terminalni ochish</span>',
  '<strong>{{ \'dashboard.newOrder\' | translate }}</strong>\r\n            <span>{{ \'dashboard.openPos\' | translate }}</span>'
);

content = content.replace(
  '<strong>Stollar Rejasi</strong>\n            <span>Zallar va stollar holati</span>',
  '<strong>{{ \'nav.tables\' | translate }}</strong>\n            <span>{{ \'dashboard.tablesStatus\' | translate }}</span>'
);
content = content.replace(
  '<strong>Stollar Rejasi</strong>\r\n            <span>Zallar va stollar holati</span>',
  '<strong>{{ \'nav.tables\' | translate }}</strong>\r\n            <span>{{ \'dashboard.tablesStatus\' | translate }}</span>'
);

content = content.replace(
  '<strong>Oshxona Ekrani (KDS)</strong>\n            <span>Taomlarni pishirish</span>',
  '<strong>{{ \'nav.kitchen\' | translate }}</strong>\n            <span>{{ \'dashboard.cookOrders\' | translate }}</span>'
);
content = content.replace(
  '<strong>Oshxona Ekrani (KDS)</strong>\r\n            <span>Taomlarni pishirish</span>',
  '<strong>{{ \'nav.kitchen\' | translate }}</strong>\r\n            <span>{{ \'dashboard.cookOrders\' | translate }}</span>'
);

content = content.replace(
  '<strong>Kassa & To\'lov</strong>\n            <span>Cheklar va to\'lovlar</span>',
  '<strong>{{ \'nav.pos\' | translate }}</strong>\n            <span>{{ \'dashboard.checksAndPayments\' | translate }}</span>'
);
content = content.replace(
  '<strong>Kassa & To\'lov</strong>\r\n            <span>Cheklar va to\'lovlar</span>',
  '<strong>{{ \'nav.pos\' | translate }}</strong>\r\n            <span>{{ \'dashboard.checksAndPayments\' | translate }}</span>'
);

// Lists
content = content.replace(
  '<h2 class="pos-card__title"><app-icon name="clock" [size]="18"></app-icon> Oxirgi Faol Buyurtmalar</h2>',
  '<h2 class="pos-card__title"><app-icon name="clock" [size]="18"></app-icon> {{ \'dashboard.recentOrders\' | translate }}</h2>'
);
content = content.replace(
  '<a routerLink="/orders" class="view-all-link">Barchasi →</a>',
  '<a routerLink="/orders" class="view-all-link">{{ \'common.all\' | translate }} →</a>'
);
content = content.replace(
  '<p>Hozirda faol buyurtmalar mavjud emas.</p>',
  '<p>{{ \'orders.noActiveOrders\' | translate }}</p>'
);
content = content.replace(
  "<span class=\"sum-tag\">{{ (order.total || order.subtotal || 0) | number:'1.0-0' }} so'm</span>",
  "<span class=\"sum-tag\">{{ (order.total || order.subtotal || 0) | number:'1.0-0' }} {{ 'common.currency' | translate }}</span>"
);

content = content.replace(
  '<h2 class="pos-card__title"><app-icon name="tables" [size]="18"></app-icon> Stollar Xaritasi</h2>',
  '<h2 class="pos-card__title"><app-icon name="tables" [size]="18"></app-icon> {{ \'dashboard.tablesMap\' | translate }}</h2>'
);
content = content.replace(
  '<a routerLink="/tables" class="view-all-link">Boshqarish →</a>',
  '<a routerLink="/tables" class="view-all-link">{{ \'common.view\' | translate }} →</a>'
);
content = content.replace(
  "<span class=\"t-status\">{{ t.status === 'OCCUPIED' ? 'Band' : 'Bo‘sh' }}</span>",
  "<span class=\"t-status\">{{ (t.status === 'OCCUPIED' ? 'tables.statusOccupied' : 'tables.statusAvailable') | translate }}</span>"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('dashboard.component.ts updated!');
