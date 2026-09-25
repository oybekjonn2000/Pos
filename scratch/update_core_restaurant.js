const fs = require('fs');
const path = require('path');

// 1. Fix remaining products.component.ts
function updateProducts() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/products/products.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  // Replace remaining ✏️ and 🗑️ in table
  content = content.replace(
    /<button class="pos-btn pos-btn--secondary pos-btn--sm" title="Tahrirlash" \(click\)="openEditModal\(p\)">\s*✏️\s*<\/button>/g,
    '<button class="pos-btn pos-btn--secondary pos-btn--sm" title="Tahrirlash" (click)="openEditModal(p)"><app-icon name="edit" [size]="15"></app-icon></button>'
  );
  content = content.replace(
    /<button class="pos-btn pos-btn--danger pos-btn--sm" title="O\'chirish" \(click\)="deleteProduct\(p\)">\s*🗑️\s*<\/button>/g,
    '<button class="pos-btn pos-btn--danger pos-btn--sm" title="O\'chirish" (click)="deleteProduct(p)"><app-icon name="trash" [size]="15"></app-icon></button>'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed remaining icons in products.component.ts');
}

// 2. Update employees.component.ts
function updateEmployees() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/employees/employees.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  // Import AppIconComponent
  if (!content.includes('AppIconComponent')) {
    content = content.replace(
      /import { Component, OnInit/g,
      "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { Component, OnInit"
    );
    content = content.replace(
      /imports: \[CommonModule, FormsModule\]/g,
      'imports: [CommonModule, FormsModule, AppIconComponent]'
    );
  }

  // Header & Buttons
  content = content.replace(
    /<h1 class="page-title">👥 Xodimlar & Lavozimlar<\/h1>/g,
    '<h1 class="page-title"><app-icon name="users" [size]="24" class="title-icon"></app-icon> Xodimlar & Lavozimlar</h1>'
  );
  content = content.replace(
    /<span>➕ Yangi Xodim Qo\'shish<\/span>/g,
    '<app-icon name="user-plus" [size]="16"></app-icon> <span>Yangi Xodim Qo\'shish</span>'
  );
  content = content.replace(
    /<div class="empty-icon">{{ activeTab === 'ACTIVE' \? '👥' : '🎉' }}<\/div>/g,
    '<div class="empty-icon"><app-icon [name]="activeTab === \'ACTIVE\' ? \'users\' : \'check-circle\'" [size]="48"></app-icon></div>'
  );
  content = content.replace(
    /<span class="pin-badge" \*ngIf="!emp\.username">🔢 PIN orqali<\/span>/g,
    '<span class="pin-badge" *ngIf="!emp.username"><app-icon name="hash" [size]="12"></app-icon> PIN orqali</span>'
  );

  // Table actions
  content = content.replace(
    /✏️ Tahrirlash/g,
    '<app-icon name="edit" [size]="14"></app-icon> Tahrirlash'
  );
  content = content.replace(
    /🔑 Parol/g,
    '<app-icon name="key" [size]="14"></app-icon> Parol'
  );
  content = content.replace(
    /🔢 PIN/g,
    '<app-icon name="hash" [size]="14"></app-icon> PIN'
  );
  content = content.replace(
    /title="Faolsizlantirish">[\s\r\n]*🚫[\s\r\n]*<\/button>/g,
    'title="Faolsizlantirish"><app-icon name="slash" [size]="14"></app-icon></button>'
  );
  content = content.replace(
    /✅ Faollashtirish/g,
    '<app-icon name="check" [size]="14"></app-icon> Faollashtirish'
  );

  // Modals
  content = content.replace(
    /<h2 class="modal-title">➕ Yangi Xodim Ro‘yxatga Olish<\/h2>/g,
    '<h2 class="modal-title"><app-icon name="user-plus" [size]="20"></app-icon> Yangi Xodim Ro‘yxatga Olish</h2>'
  );
  content = content.replace(
    /<h2 class="modal-title">✏️ Xodimni Tahrirlash: {{ selectedEmp\.firstName }} {{ selectedEmp\.lastName \|\| '' }}<\/h2>/g,
    '<h2 class="modal-title"><app-icon name="edit" [size]="20"></app-icon> Xodimni Tahrirlash: {{ selectedEmp.firstName }} {{ selectedEmp.lastName || \'\' }}</h2>'
  );
  content = content.replace(
    /<h2 class="modal-title">🔑 Parolni O'zgartirish<\/h2>/g,
    '<h2 class="modal-title"><app-icon name="key" [size]="20"></app-icon> Parolni O\'zgartirish</h2>'
  );
  content = content.replace(
    /<h2 class="modal-title">🔢 PIN-kodni O'zgartirish<\/h2>/g,
    '<h2 class="modal-title"><app-icon name="hash" [size]="20"></app-icon> PIN-kodni O\'zgartirish</h2>'
  );
  content = content.replace(
    /<button class="close-btn" \(click\)="closeModals\(\)">✕<\/button>/g,
    '<button class="close-btn" (click)="closeModals()"><app-icon name="x" [size]="18"></app-icon></button>'
  );
  content = content.replace(/⚠️ {{ createErrorMessage }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ createErrorMessage }}');
  content = content.replace(/⚠️ {{ editErrorMessage }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ editErrorMessage }}');
  content = content.replace(/⚠️ {{ pinErrorMessage }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ pinErrorMessage }}');

  // getRoleBadge
  content = content.replace("case 'ADMIN': return '👑 Admin';", "case 'ADMIN': return 'Admin';");
  content = content.replace("case 'MANAGER': return '👔 Menejer';", "case 'MANAGER': return 'Menejer';");
  content = content.replace("case 'WAITER': return '🛎️ Ofitsiant';", "case 'WAITER': return 'Ofitsiant';");
  content = content.replace("case 'KITCHEN': return '👨‍🍳 Oshpaz';", "case 'KITCHEN': return 'Oshpaz';");
  content = content.replace("case 'CASHIER': return '💳 Kassir';", "case 'CASHIER': return 'Kassir';");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated employees.component.ts');
}

// 3. Update inventory.component.ts
function updateInventory() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/inventory/inventory.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  // Import AppIconComponent
  if (!content.includes('AppIconComponent')) {
    content = content.replace(
      /import { Component, OnInit/g,
      "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { Component, OnInit"
    );
    content = content.replace(
      /imports: \[CommonModule, FormsModule\]/g,
      'imports: [CommonModule, FormsModule, AppIconComponent]'
    );
  }

  // Header & Toolbar
  content = content.replace(
    /<h1 class="page-title">📦 Ombor & Zaxiralar Tizimi<\/h1>/g,
    '<h1 class="page-title"><app-icon name="package" [size]="24" class="title-icon"></app-icon> Ombor & Zaxiralar Tizimi</h1>'
  );
  content = content.replace(
    /<span>🔄 Yangilash<\/span>/g,
    '<app-icon name="refresh" [size]="16"></app-icon> <span>Yangilash</span>'
  );
  content = content.replace(
    /<span>➕ Yangi Mahsulot<\/span>/g,
    '<app-icon name="plus" [size]="16"></app-icon> <span>Yangi Mahsulot</span>'
  );

  // Tabs
  content = content.replace(/<span>📊 Dashboard<\/span>/g, '<app-icon name="bar-chart" [size]="16"></app-icon> <span>Dashboard</span>');
  content = content.replace(/<span>📦 Mahsulotlar<\/span>/g, '<app-icon name="package" [size]="16"></app-icon> <span>Mahsulotlar</span>');
  content = content.replace(/<span>📥 Kirim \(Xaridlar\)<\/span>/g, '<app-icon name="download" [size]="16"></app-icon> <span>Kirim (Xaridlar)</span>');
  content = content.replace(/<span>📤 Chiqim \(Chiqindilar\)<\/span>/g, '<app-icon name="upload" [size]="16"></app-icon> <span>Chiqim (Chiqindilar)</span>');
  content = content.replace(/<span>📜 Harakatlar Tarixi<\/span>/g, '<app-icon name="file-text" [size]="16"></app-icon> <span>Harakatlar Tarixi</span>');
  content = content.replace(/<span>📋 Inventarizatsiya<\/span>/g, '<app-icon name="clipboard" [size]="16"></app-icon> <span>Inventarizatsiya</span>');
  content = content.replace(/<span>🍕 Retseptlar \(Tannarx\)<\/span>/g, '<app-icon name="utensils" [size]="16"></app-icon> <span>Retseptlar (Tannarx)</span>');
  content = content.replace(/<span>🏢 Omborlar & Ta\'minotchilar<\/span>/g, '<app-icon name="building" [size]="16"></app-icon> <span>Omborlar & Ta\'minotchilar</span>');

  // KPI Icons
  content = content.replace(/<div class="kpi-icon kpi-icon--blue">📦<\/div>/g, '<div class="kpi-icon kpi-icon--blue"><app-icon name="package" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--orange">⚠️<\/div>/g, '<div class="kpi-icon kpi-icon--orange"><app-icon name="alert-triangle" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--red">🚫<\/div>/g, '<div class="kpi-icon kpi-icon--red"><app-icon name="slash" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--green">💰<\/div>/g, '<div class="kpi-icon kpi-icon--green"><app-icon name="dollar-sign" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--teal">📥<\/div>/g, '<div class="kpi-icon kpi-icon--teal"><app-icon name="download" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--purple">📤<\/div>/g, '<div class="kpi-icon kpi-icon--purple"><app-icon name="upload" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--indigo">🍽️<\/div>/g, '<div class="kpi-icon kpi-icon--indigo"><app-icon name="utensils" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--gray">⚖️<\/div>/g, '<div class="kpi-icon kpi-icon--gray"><app-icon name="sliders" [size]="24"></app-icon></div>');

  // Quick Action Tiles & Panel Titles
  content = content.replace(/<h3 class="panel-title">⚡ Tezkor Operatsiyalar<\/h3>/g, '<h3 class="panel-title"><app-icon name="zap" [size]="18"></app-icon> Tezkor Operatsiyalar</h3>');
  content = content.replace(/<span class="tile-icon">📥<\/span>/g, '<span class="tile-icon"><app-icon name="download" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="tile-icon">📤<\/span>/g, '<span class="tile-icon"><app-icon name="upload" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="tile-icon">📋<\/span>/g, '<span class="tile-icon"><app-icon name="clipboard" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="tile-icon">🍕<\/span>/g, '<span class="tile-icon"><app-icon name="utensils" [size]="22"></app-icon></span>');

  content = content.replace(/<h3 class="panel-title">⚠️ Diqqat Talab Mahsulotlar<\/h3>/g, '<h3 class="panel-title"><app-icon name="alert-triangle" [size]="18"></app-icon> Diqqat Talab Mahsulotlar</h3>');
  content = content.replace(/<span>✅ Barcha mahsulotlar yetarli miqdorda mavjud<\/span>/g, '<app-icon name="check-circle" [size]="16"></app-icon> <span>Barcha mahsulotlar yetarli miqdorda mavjud</span>');
  content = content.replace(/<span class="search-icon">🔍<\/span>/g, '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');

  // Table action buttons
  content = content.replace(
    /<button class="pos-btn pos-btn--sm pos-btn--secondary" \(click\)="openAdjustModal\(item\)" title="Qo\'lda tuzatish">⚙️<\/button>/g,
    '<button class="pos-btn pos-btn--sm pos-btn--secondary" (click)="openAdjustModal(item)" title="Qo\'lda tuzatish"><app-icon name="settings" [size]="14"></app-icon></button>'
  );
  content = content.replace(
    /<button class="pos-btn pos-btn--sm pos-btn--secondary" \(click\)="openEditItemModal\(item\)" title="Tahrirlash">✏️<\/button>/g,
    '<button class="pos-btn pos-btn--sm pos-btn--secondary" (click)="openEditItemModal(item)" title="Tahrirlash"><app-icon name="edit" [size]="14"></app-icon></button>'
  );
  content = content.replace(
    /<button class="pos-btn pos-btn--sm pos-btn--danger" \(click\)="deleteItem\(item\)" title="O\'chirish">🗑️<\/button>/g,
    '<button class="pos-btn pos-btn--sm pos-btn--danger" (click)="deleteItem(item)" title="O\'chirish"><app-icon name="trash" [size]="14"></app-icon></button>'
  );

  // Sections
  content = content.replace(/<h2 class="section-title">📥 Omborga Mahsulot Kirimi \(Xaridlar\)<\/h2>/g, '<h2 class="section-title"><app-icon name="download" [size]="20"></app-icon> Omborga Mahsulot Kirimi (Xaridlar)</h2>');
  content = content.replace(/<span>➕ Yangi Kirim Hujjati<\/span>/g, '<app-icon name="plus" [size]="16"></app-icon> <span>Yangi Kirim Hujjati</span>');
  content = content.replace(/<h2 class="section-title">📤 Ombordan Chiqim & Isrof Qilish<\/h2>/g, '<h2 class="section-title"><app-icon name="upload" [size]="20"></app-icon> Ombordan Chiqim & Isrof Qilish</h2>');
  content = content.replace(/<span>➖ Chiqim Qilish<\/span>/g, '<app-icon name="minus" [size]="16"></app-icon> <span>Chiqim Qilish</span>');
  content = content.replace(/✅ Sanoqni Yakunlash & Tasdiqlash/g, '<app-icon name="check-circle" [size]="16"></app-icon> Sanoqni Yakunlash & Tasdiqlash');
  content = content.replace(/<h2 class="section-title">📋 Inventarizatsiya \(Sanoq & Nazorat\)<\/h2>/g, '<h2 class="section-title"><app-icon name="clipboard" [size]="20"></app-icon> Inventarizatsiya (Sanoq & Nazorat)</h2>');
  content = content.replace(/<span>➕ Yangi Inventarizatsiya Boshlash<\/span>/g, '<app-icon name="plus" [size]="16"></app-icon> <span>Yangi Inventarizatsiya Boshlash</span>');
  content = content.replace(/<h3 class="panel-title">🍽️ Taom Tanlang<\/h3>/g, '<h3 class="panel-title"><app-icon name="utensils" [size]="18"></app-icon> Taom Tanlang</h3>');
  content = content.replace(/💾 Retseptni Saqlash/g, '<app-icon name="save" [size]="16"></app-icon> Retseptni Saqlash');
  content = content.replace(/<button class="pos-btn pos-btn--sm pos-btn--danger" \(click\)="removeRecipeIngredient\(idx\)">✕<\/button>/g, '<button class="pos-btn pos-btn--sm pos-btn--danger" (click)="removeRecipeIngredient(idx)"><app-icon name="x" [size]="14"></app-icon></button>');
  content = content.replace(/<span>👈 Chapdagi ro\'yxatdan taom tanlang<\/span>/g, '<app-icon name="arrow-left" [size]="16"></app-icon> <span>Chapdagi ro\'yxatdan taom tanlang</span>');
  content = content.replace(/<h3 class="panel-title">🏢 Omborlar Ro\'yxati<\/h3>/g, '<h3 class="panel-title"><app-icon name="building" [size]="18"></app-icon> Omborlar Ro\'yxati</h3>');
  content = content.replace(/<div class="wh-icon">🏢<\/div>/g, '<div class="wh-icon"><app-icon name="building" [size]="28"></app-icon></div>');
  content = content.replace(/<h3 class="panel-title">🤝 Yetkazib Beruvchilar<\/h3>/g, '<h3 class="panel-title"><app-icon name="users" [size]="18"></app-icon> Yetkazib Beruvchilar</h3>');

  // Modals
  content = content.replace(/<h3>{{ editingItemId \? \'✏️ Mahsulotni Tahrirlash\' : \'➕ Yangi Ombor Mahsuloti\' }}<\/h3>/g, '<h3><app-icon [name]="editingItemId ? \'edit\' : \'plus\'" [size]="20"></app-icon> {{ editingItemId ? \'Mahsulotni Tahrirlash\' : \'Yangi Ombor Mahsuloti\' }}</h3>');
  content = content.replace(/<h3>📥 Yangi Tovar Kirimi<\/h3>/g, '<h3><app-icon name="download" [size]="20"></app-icon> Yangi Tovar Kirimi</h3>');
  content = content.replace(/<button class="pos-btn pos-btn--sm pos-btn--danger" \(click\)="removePurchaseRow\(i\)">✕<\/button>/g, '<button class="pos-btn pos-btn--sm pos-btn--danger" (click)="removePurchaseRow(i)"><app-icon name="x" [size]="14"></app-icon></button>');
  content = content.replace(/✅ Kirimni Tasdiqlash/g, '<app-icon name="check" [size]="16"></app-icon> Kirimni Tasdiqlash');
  content = content.replace(/<h3>📤 Ombordan Chiqim Qilish<\/h3>/g, '<h3><app-icon name="upload" [size]="20"></app-icon> Ombordan Chiqim Qilish</h3>');
  content = content.replace(/<h3>⚙️ Zaxirani Qo\'lda Tuzatish: {{ targetAdjustItem\?\.name }}<\/h3>/g, '<h3><app-icon name="settings" [size]="20"></app-icon> Zaxirani Qo\'lda Tuzatish: {{ targetAdjustItem?.name }}</h3>');
  content = content.replace(/<h3>🏢 Yangi Ombor Qo\'shish<\/h3>/g, '<h3><app-icon name="building" [size]="20"></app-icon> Yangi Ombor Qo\'shish</h3>');
  content = content.replace(/<h3>🤝 Yangi Yetkazib Beruvchi<\/h3>/g, '<h3><app-icon name="users" [size]="20"></app-icon> Yangi Yetkazib Beruvchi</h3>');
  content = content.replace(/<button class="close-btn" [^>]*>✕<\/button>/g, (m) => m.replace('✕', '<app-icon name="x" [size]="18"></app-icon>'));

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated inventory.component.ts');
}

// 4. Update reports.component.ts
function updateReports() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/reports/reports.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  // Import AppIconComponent
  if (!content.includes('AppIconComponent')) {
    content = content.replace(
      /import { Component, OnInit/g,
      "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { Component, OnInit"
    );
    content = content.replace(
      /imports: \[CommonModule, FormsModule\]/g,
      'imports: [CommonModule, FormsModule, AppIconComponent]'
    );
  }

  // Header & Controls
  content = content.replace(/<h1 class="page-title">📈 Tizim Hisobotlari & Analitika<\/h1>/g, '<h1 class="page-title"><app-icon name="trending-up" [size]="24" class="title-icon"></app-icon> Tizim Hisobotlari & Analitika</h1>');
  content = content.replace(/<span>🔄 Yangilash<\/span>/g, '<app-icon name="refresh" [size]="16"></app-icon> <span>Yangilash</span>');
  content = content.replace(/<span>📥 CSV Eksport<\/span>/g, '<app-icon name="download" [size]="16"></app-icon> <span>CSV Eksport</span>');

  // Tabs
  content = content.replace(/<span>📊 Savdo \(Umumiy\)<\/span>/g, '<app-icon name="bar-chart" [size]="16"></app-icon> <span>Savdo (Umumiy)</span>');
  content = content.replace(/<span>🍔 Mahsulotlar Savdosi<\/span>/g, '<app-icon name="utensils" [size]="16"></app-icon> <span>Mahsulotlar Savdosi</span>');
  content = content.replace(/<span>💵 Foyda & Zarar \(P&L\)<\/span>/g, '<app-icon name="dollar-sign" [size]="16"></app-icon> <span>Foyda & Zarar (P&L)</span>');
  content = content.replace(/<span>🏧 Kassa & To\'lovlar<\/span>/g, '<app-icon name="credit-card" [size]="16"></app-icon> <span>Kassa & To\'lovlar</span>');
  content = content.replace(/<span>🤵 Ofitsiantlar<\/span>/g, '<app-icon name="users" [size]="16"></app-icon> <span>Ofitsiantlar</span>');
  content = content.replace(/<span>🍳 Oshxonalar<\/span>/g, '<app-icon name="chef" [size]="16"></app-icon> <span>Oshxonalar</span>');
  content = content.replace(/<span>📦 Ombor Harakati<\/span>/g, '<app-icon name="package" [size]="16"></app-icon> <span>Ombor Harakati</span>');

  // KPI Icons
  content = content.replace(/<div class="kpi-icon kpi-icon--green">💰<\/div>/g, '<div class="kpi-icon kpi-icon--green"><app-icon name="dollar-sign" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--blue">🧾<\/div>/g, '<div class="kpi-icon kpi-icon--blue"><app-icon name="file-text" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--teal">💵<\/div>/g, '<div class="kpi-icon kpi-icon--teal"><app-icon name="dollar-sign" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--purple">💳<\/div>/g, '<div class="kpi-icon kpi-icon--purple"><app-icon name="credit-card" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--orange">❌<\/div>/g, '<div class="kpi-icon kpi-icon--orange"><app-icon name="x-circle" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="kpi-icon kpi-icon--blue">🌐<\/div>/g, '<div class="kpi-icon kpi-icon--blue"><app-icon name="globe" [size]="24"></app-icon></div>');

  // Titles
  content = content.replace(/<h3 class="chart-title">🕒 Soatlik Savdo Taqsimoti<\/h3>/g, '<h3 class="chart-title"><app-icon name="clock" [size]="18"></app-icon> Soatlik Savdo Taqsimoti</h3>');
  content = content.replace(/<h3 class="chart-title">💳 To\'lov Turlari Nisbati<\/h3>/g, '<h3 class="chart-title"><app-icon name="credit-card" [size]="18"></app-icon> To\'lov Turlari Nisbati</h3>');
  content = content.replace(/<span>💵 Naqd Pul<\/span>/g, '<app-icon name="dollar-sign" [size]="14"></app-icon> <span>Naqd Pul</span>');
  content = content.replace(/<span>💳 Bank Kartasi<\/span>/g, '<app-icon name="credit-card" [size]="14"></app-icon> <span>Bank Kartasi</span>');
  content = content.replace(/<span>🌐 Boshqa \/ Online<\/span>/g, '<app-icon name="globe" [size]="14"></app-icon> <span>Boshqa / Online</span>');
  content = content.replace(/<span class="medal-icon">{{ i === 0 \? '🥇' : \(i === 1 \? '🥈' : '🥉'\) }}<\/span>/g, '<span class="medal-icon">#{{ i + 1 }}</span>');
  content = content.replace(/<h2 class="formula-title">📐 Foyda Formulatsiyasi \(P&L\)<\/h2>/g, '<h2 class="formula-title"><app-icon name="sliders" [size]="20"></app-icon> Foyda Formulatsiyasi (P&L)</h2>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated reports.component.ts');
}

// 5. Update restaurant-billing.component.ts
function updateBilling() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/restaurant/billing/restaurant-billing.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace(
      /import { Component, computed/g,
      "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, computed"
    );
    content = content.replace(
      /imports: \[CommonModule, FormsModule\]/g,
      'imports: [CommonModule, FormsModule, AppIconComponent]'
    );
  }

  // Tabs & Buttons
  content = content.replace(/📝 Obunaga Ariza Berish/g, '<app-icon name="file-text" [size]="16"></app-icon> Obunaga Ariza Berish');
  content = content.replace(/📜 Arizalar Tarixi/g, '<app-icon name="clock" [size]="16"></app-icon> Arizalar Tarixi');
  content = content.replace(/📄 Yuklangan to'lov chekini ko'rish/g, '<app-icon name="file-text" [size]="16"></app-icon> Yuklangan to\'lov chekini ko\'rish');
  content = content.replace(/<span class="icon-static">❌<\/span>/g, '<span class="icon-static"><app-icon name="x" [size]="16"></app-icon></span>');
  content = content.replace(/<div class="feat-item">✓ /g, '<div class="feat-item"><app-icon name="check" [size]="14"></app-icon> ');
  content = content.replace(/<span class="copied-indicator">✓ Nusxalandi!<\/span>/g, '<span class="copied-indicator"><app-icon name="check" [size]="14"></app-icon> Nusxalandi!</span>');
  content = content.replace(/<span class="copy-text">📋 Nusxa olish<\/span>/g, '<span class="copy-text"><app-icon name="clipboard" [size]="14"></app-icon> Nusxa olish</span>');
  content = content.replace(/<div class="inst-icon">💡<\/div>/g, '<div class="inst-icon"><app-icon name="info" [size]="20"></app-icon></div>');
  content = content.replace(/<div class="upload-icon-circle">📤<\/div>/g, '<div class="upload-icon-circle"><app-icon name="upload" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="pdf-icon-box">📄<\/div>/g, '<div class="pdf-icon-box"><app-icon name="file-text" [size]="20"></app-icon></div>');
  content = content.replace(/<button type="button" class="btn-remove-file" \(click\)="removeFile\(\$event\)">✕<\/button>/g, '<button type="button" class="btn-remove-file" (click)="removeFile($event)"><app-icon name="x" [size]="14"></app-icon></button>');
  content = content.replace(/<span>🚀 Ariza Yuborish \(/g, '<app-icon name="send" [size]="16"></app-icon> <span>Ariza Yuborish (');
  content = content.replace(/<p class="submit-warning">⚠️ /g, '<p class="submit-warning"><app-icon name="alert-triangle" [size]="14"></app-icon> ');
  content = content.replace(/🔄 Yangilash/g, '<app-icon name="refresh" [size]="14"></app-icon> Yangilash');
  content = content.replace(/<span class="empty-icon">📭<\/span>/g, '<span class="empty-icon"><app-icon name="inbox" [size]="48"></app-icon></span>');
  content = content.replace(/<span class="thumb-hover-overlay">🔍<\/span>/g, '<span class="thumb-hover-overlay"><app-icon name="search" [size]="20"></app-icon></span>');
  content = content.replace(/📄 PDF Chek/g, '<app-icon name="file-text" [size]="16"></app-icon> PDF Chek');
  content = content.replace(/<button type="button" class="btn-close-modal" \(click\)="activeReceiptModal\.set\(null\)">✕<\/button>/g, '<button type="button" class="btn-close-modal" (click)="activeReceiptModal.set(null)"><app-icon name="x" [size]="18"></app-icon></button>');

  // Status labels
  content = content.replace("case 'PENDING_APPROVAL': return '🟡 Kutilmoqda';", "case 'PENDING_APPROVAL': return 'Kutilmoqda';");
  content = content.replace("case 'APPROVED': return '✅ Faollashtirilgan';", "case 'APPROVED': return 'Faollashtirilgan';");
  content = content.replace("case 'REJECTED': return '❌ Rad etilgan';", "case 'REJECTED': return 'Rad etilgan';");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated restaurant-billing.component.ts');
}

// 6. Update settings.component.ts
function updateSettings() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/settings/settings.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace(
      /import { Component, OnInit/g,
      "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { Component, OnInit"
    );
    content = content.replace(
      /imports: \[CommonModule, FormsModule\]/g,
      'imports: [CommonModule, FormsModule, AppIconComponent]'
    );
  }

  // Header & Toast
  content = content.replace(/💾 Saqlash/g, '<app-icon name="save" [size]="16"></app-icon> Saqlash');
  content = content.replace(/<span>{{ toastType\(\) === \'success\' \? \'✅\' : \'⚠️\' }} {{ toastMessage\(\) }}<\/span>/g, '<span><app-icon [name]="toastType() === \'success\' ? \'check-circle\' : \'alert-triangle\'" [size]="16"></app-icon> {{ toastMessage() }}</span>');
  content = content.replace(/<button class="toast-close" \(click\)="clearToast\(\)">✕<\/button>/g, '<button class="toast-close" (click)="clearToast()"><app-icon name="x" [size]="14"></app-icon></button>');

  // Settings Nav Icons
  content = content.replace(/<span class="nav-icon">⚙️<\/span>/g, '<span class="nav-icon"><app-icon name="settings" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🌐<\/span>/g, '<span class="nav-icon"><app-icon name="globe" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">👥<\/span>/g, '<span class="nav-icon"><app-icon name="users" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">👨‍🍳<\/span>/g, '<span class="nav-icon"><app-icon name="chef" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🖨️<\/span>/g, '<span class="nav-icon"><app-icon name="printer" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🍳<\/span>/g, '<span class="nav-icon"><app-icon name="chef" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🧾<\/span>/g, '<span class="nav-icon"><app-icon name="file-text" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">💳<\/span>/g, '<span class="nav-icon"><app-icon name="credit-card" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">📊<\/span>/g, '<span class="nav-icon"><app-icon name="bar-chart" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">📋<\/span>/g, '<span class="nav-icon"><app-icon name="clipboard" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🔔<\/span>/g, '<span class="nav-icon"><app-icon name="bell" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🔐<\/span>/g, '<span class="nav-icon"><app-icon name="lock" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">💾<\/span>/g, '<span class="nav-icon"><app-icon name="database" [size]="18"></app-icon></span>');
  content = content.replace(/<span class="nav-icon">🗑️<\/span>/g, '<span class="nav-icon"><app-icon name="trash" [size]="18"></app-icon></span>');

  // Section Headers
  content = content.replace(/<h3>🏛️ Restoran Profili va Rekvizitlari<\/h3>/g, '<h3><app-icon name="building" [size]="20"></app-icon> Restoran Profili va Rekvizitlari</h3>');
  content = content.replace(/<h3>🌐 Umumiy Tizim Sozlamalari<\/h3>/g, '<h3><app-icon name="globe" [size]="20"></app-icon> Umumiy Tizim Sozlamalari</h3>');
  content = content.replace(/<option value="light">☀️ Light Mode \(Kunduzgi rejim - Standart\)<\/option>/g, '<option value="light">Light Mode (Kunduzgi rejim - Standart)</option>');
  content = content.replace(/<option value="dark">🌙 Dark Mode \(Tungi rejim\)<\/option>/g, '<option value="dark">Dark Mode (Tungi rejim)</option>');
  content = content.replace(/<h3>👥 Rollar va Xavfsizlik Ruxsatlari<\/h3>/g, '<h3><app-icon name="shield" [size]="20"></app-icon> Rollar va Xavfsizlik Ruxsatlari</h3>');
  content = content.replace(/<h3>🍔 Mahsulotlar va Oshxona Bog\'lanishi<\/h3>/g, '<h3><app-icon name="utensils" [size]="20"></app-icon> Mahsulotlar va Oshxona Bog\'lanishi</h3>');
  content = content.replace(/chap menyudagi <strong>🍔 Products<\/strong> bo\'limiga/g, 'chap menyudagi <strong>Products</strong> bo\'limiga');
  content = content.replace(/<h3>👨‍🍳 Oshxonalar va Bo\'limlar Sozlamalari<\/h3>/g, '<h3><app-icon name="chef" [size]="20"></app-icon> Oshxonalar va Bo\'limlar Sozlamalari</h3>');
  content = content.replace(/🖨️ {{ k\.printerName }}/g, '<app-icon name="printer" [size]="14"></app-icon> {{ k.printerName }}');
  content = content.replace(/<span class="printer-tag offline">❌ Printer ulanmagan<\/span>/g, '<span class="printer-tag offline"><app-icon name="x" [size]="12"></app-icon> Printer ulanmagan</span>');

  content = content.replace(/<h3>🖨️ Restoran Printer Management Tizimi<\/h3>/g, '<h3><app-icon name="printer" [size]="20"></app-icon> Restoran Printer Management Tizimi</h3>');
  content = content.replace(/<strong class="feedback-title success-title">✅ TEST CHOP ETISH MUVAFFAQIYATLI<\/strong>/g, '<strong class="feedback-title success-title"><app-icon name="check-circle" [size]="16"></app-icon> TEST CHOP ETISH MUVAFFAQIYATLI</strong>');
  content = content.replace(/<strong class="feedback-title error-title">❌ PRINTERGA ULANISH IMKONI BO\'LMADI<\/strong>/g, '<strong class="feedback-title error-title"><app-icon name="alert-triangle" [size]="16"></app-icon> PRINTERGA ULANISH IMKONI BO\'LMADI</strong>');
  content = content.replace(/🖨️ {{ p\.name }}/g, '<app-icon name="printer" [size]="16"></app-icon> {{ p.name }}');
  content = content.replace(/<span class="val fallback-tag">🔄 {{ p\.fallbackPrinterName }}<\/span>/g, '<span class="val fallback-tag"><app-icon name="refresh" [size]="12"></app-icon> {{ p.fallbackPrinterName }}</span>');
  content = content.replace(/⚠️ {{ p\.lastError }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ p.lastError }}');
  content = content.replace(/⚡ TEST PRINT/g, '<app-icon name="zap" [size]="14"></app-icon> TEST PRINT');

  content = content.replace(/<h3>🧾 Kassa Cheki va Kvitansiya Sozlamalari<\/h3>/g, '<h3><app-icon name="file-text" [size]="20"></app-icon> Kassa Cheki va Kvitansiya Sozlamalari</h3>');
  content = content.replace(/<h3>💳 To\'lov Usullari va Kassa Integratsiyasi<\/h3>/g, '<h3><app-icon name="credit-card" [size]="20"></app-icon> To\'lov Usullari va Kassa Integratsiyasi</h3>');
  content = content.replace(/<h3>📊 Xizmat Haqi va Soliq Foizlari<\/h3>/g, '<h3><app-icon name="sliders" [size]="20"></app-icon> Xizmat Haqi va Soliq Foizlari</h3>');
  content = content.replace(/<h3>📋 Buyurtmalar Ishlash Tartibi<\/h3>/g, '<h3><app-icon name="clipboard" [size]="20"></app-icon> Buyurtmalar Ishlash Tartibi</h3>');
  content = content.replace(/<h3>🍳 Oshxona Ekrani \(KDS\) Sozlamalari<\/h3>/g, '<h3><app-icon name="chef" [size]="20"></app-icon> Oshxona Ekrani (KDS) Sozlamalari</h3>');
  content = content.replace(/<h3>🔔 Bildirishnomalar va Audio Signallar<\/h3>/g, '<h3><app-icon name="bell" [size]="20"></app-icon> Bildirishnomalar va Audio Signallar</h3>');
  content = content.replace(/<h3>🔐 Xavfsizlik va Kirish Nazorati<\/h3>/g, '<h3><app-icon name="lock" [size]="20"></app-icon> Xavfsizlik va Kirish Nazorati</h3>');
  content = content.replace(/<h3>🔢 Admin Shaxsiy PIN-kodini O\'zgartirish<\/h3>/g, '<h3><app-icon name="hash" [size]="20"></app-icon> Admin Shaxsiy PIN-kodini O\'zgartirish</h3>');
  content = content.replace(/✅ {{ adminPinSuccess\(\) }}/g, '<app-icon name="check-circle" [size]="14"></app-icon> {{ adminPinSuccess() }}');
  content = content.replace(/⚠️ {{ adminPinError\(\) }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ adminPinError() }}');
  content = content.replace(/🔐 PIN-kodni Saqlash/g, '<app-icon name="lock" [size]="14"></app-icon> PIN-kodni Saqlash');
  content = content.replace(/<h3>💾 Ma\'lumotlar Bazasi va Zaxiralash \(Backup\)<\/h3>/g, '<h3><app-icon name="database" [size]="20"></app-icon> Ma\'lumotlar Bazasi va Zaxiralash (Backup)</h3>');
  content = content.replace(/⚡ Hozir zaxira nusxa yaratish/g, '<app-icon name="zap" [size]="14"></app-icon> Hozir zaxira nusxa yaratish');
  content = content.replace(/<h4>📝 Oxirgi Sozlamalar Audit Tarixi \(Kim, qachon, nima o\'zgardi\)<\/h4>/g, '<h4><app-icon name="file-text" [size]="16"></app-icon> Oxirgi Sozlamalar Audit Tarixi (Kim, qachon, nima o\'zgardi)</h4>');

  // Reset Center
  content = content.replace(/<h3>🧹 Ma\'lumotlarni Tozalash \(Reset Center\)<\/h3>/g, '<h3><app-icon name="trash" [size]="20"></app-icon> Ma\'lumotlarni Tozalash (Reset Center)</h3>');
  content = content.replace(/<span class="info-icon">💡<\/span>/g, '<span class="info-icon"><app-icon name="info" [size]="18"></app-icon></span>');
  content = content.replace(/<div class="reset-item-icon">📋<\/div>/g, '<div class="reset-item-icon"><app-icon name="clipboard" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="reset-item-icon">🍔<\/div>/g, '<div class="reset-item-icon"><app-icon name="utensils" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="reset-item-icon">📑<\/div>/g, '<div class="reset-item-icon"><app-icon name="layers" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="reset-item-icon">👨‍🍳<\/div>/g, '<div class="reset-item-icon"><app-icon name="chef" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="reset-item-icon">🏷️<\/div>/g, '<div class="reset-item-icon"><app-icon name="tag" [size]="24"></app-icon></div>');
  content = content.replace(/<span class="danger-badge">⚠️ XAVFLI HUDUD<\/span>/g, '<span class="danger-badge"><app-icon name="alert-triangle" [size]="12"></app-icon> XAVFLI HUDUD</span>');
  content = content.replace(/⚠️ HAMMASINI TOZALASH/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> HAMMASINI TOZALASH');

  // Modals & Reset confirmation
  content = content.replace(/<span class="section-title">🔍 Windows tizimidagi o\'rnatilgan printerlar:<\/span>/g, '<span class="section-title"><app-icon name="search" [size]="16"></app-icon> Windows tizimidagi o\'rnatilgan printerlar:</span>');
  content = content.replace(/⚠️ Ushbu kompyuterda Windows tomonidan o\'rnatilgan printerlar topilmadi\./g, '<app-icon name="alert-triangle" [size]="14"></app-icon> Ushbu kompyuterda Windows tomonidan o\'rnatilgan printerlar topilmadi.');
  content = content.replace(/🖨️ {{ wp\.systemPrinterName }}/g, '<app-icon name="printer" [size]="14"></app-icon> {{ wp.systemPrinterName }}');
  content = content.replace(/⚠️ Bu printer hozir <strong>{{ deletingPrinter\(\)\?\.assignedKitchenName }}<\/strong> oshxonasiga biriktirilgan\./g, '<app-icon name="alert-triangle" [size]="14"></app-icon> Bu printer hozir <strong>{{ deletingPrinter()?.assignedKitchenName }}</strong> oshxonasiga biriktirilgan.');
  content = content.replace(/⚠️ {{ getResetEntityWarning\(pendingResetType\) }}/g, '<app-icon name="alert-triangle" [size]="14"></app-icon> {{ getResetEntityWarning(pendingResetType) }}');
  content = content.replace(/<h3>⚠️ DIQQAT: Barcha test ma\'lumotlarini tozalash<\/h3>/g, '<h3><app-icon name="alert-triangle" [size]="20"></app-icon> DIQQAT: Barcha test ma\'lumotlarini tozalash</h3>');
  content = content.replace(/Davom etish \(2-bosqich\) ➔/g, 'Davom etish (2-bosqich) <app-icon name="arrow-right" [size]="14"></app-icon>');
  content = content.replace(/<h3>🛑 YAKUNIY TASDIQLASH \(2\/2\)<\/h3>/g, '<h3><app-icon name="alert-triangle" [size]="20"></app-icon> YAKUNIY TASDIQLASH (2/2)</h3>');
  content = content.replace(/🔥 HA, BARCHASINI TOZALASH/g, '<app-icon name="trash" [size]="16"></app-icon> HA, BARCHASINI TOZALASH');
  content = content.replace(/<h3>✅ {{ resetResultTitle }}<\/h3>/g, '<h3><app-icon name="check-circle" [size]="20"></app-icon> {{ resetResultTitle }}</h3>');

  // Reset results table
  content = content.replace(/<td>📋 Buyurtmalar \(Orders\)<\/td>/g, '<td><app-icon name="clipboard" [size]="14"></app-icon> Buyurtmalar (Orders)</td>');
  content = content.replace(/<td>🍱 Buyurtma mahsulotlari \(Order Items\)<\/td>/g, '<td><app-icon name="utensils" [size]="14"></app-icon> Buyurtma mahsulotlari (Order Items)</td>');
  content = content.replace(/<td>💳 To\'lovlar \(Payments\)<\/td>/g, '<td><app-icon name="credit-card" [size]="14"></app-icon> To\'lovlar (Payments)</td>');
  content = content.replace(/<td>👨‍🍳 Oshxona partiyalari \(Kitchen Batches\)<\/td>/g, '<td><app-icon name="chef" [size]="14"></app-icon> Oshxona partiyalari (Kitchen Batches)</td>');
  content = content.replace(/<td>🚫 Bekor qilish cheklari<\/td>/g, '<td><app-icon name="slash" [size]="14"></app-icon> Bekor qilish cheklari</td>');
  content = content.replace(/<td>🍔 Mahsulotlar \(Products\)<\/td>/g, '<td><app-icon name="utensils" [size]="14"></app-icon> Mahsulotlar (Products)</td>');
  content = content.replace(/<td>📑 Kategoriyalar \(Categories\)<\/td>/g, '<td><app-icon name="layers" [size]="14"></app-icon> Kategoriyalar (Categories)</td>');
  content = content.replace(/<td>🍳 Oshxonalar \(Kitchens\)<\/td>/g, '<td><app-icon name="chef" [size]="14"></app-icon> Oshxonalar (Kitchens)</td>');
  content = content.replace(/<td>🏷️ Joylar \/ Zallar \(Zones\)<\/td>/g, '<td><app-icon name="tag" [size]="14"></app-icon> Joylar / Zallar (Zones)</td>');
  content = content.replace(/<td>👤 Saqlangan foydalanuvchilar \(Users\)<\/td>/g, '<td><app-icon name="user" [size]="14"></app-icon> Saqlangan foydalanuvchilar (Users)</td>');
  content = content.replace(/<td>🖨️ Saqlangan printerlar \(Printers\)<\/td>/g, '<td><app-icon name="printer" [size]="14"></app-icon> Saqlangan printerlar (Printers)</td>');
  content = content.replace(/<td>🛡️ Saqlangan rollar & huquqlar<\/td>/g, '<td><app-icon name="shield" [size]="14"></app-icon> Saqlangan rollar & huquqlar</td>');

  // Modal close buttons
  content = content.replace(/<button class="modal-close" [^>]*>✕<\/button>/g, (m) => m.replace('✕', '<app-icon name="x" [size]="18"></app-icon>'));

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated settings.component.ts');
}

updateProducts();
updateEmployees();
updateInventory();
updateReports();
updateBilling();
updateSettings();
