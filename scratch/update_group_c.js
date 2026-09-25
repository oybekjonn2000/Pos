const fs = require('fs');
const path = require('path');

function updatePlatformDashboard() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/dashboard/platform-dashboard.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, RouterLink]", "imports: [CommonModule, RouterLink, AppIconComponent]");
  }

  content = content.replace(/<span class="chip-icon">🌐<\/span>/g, '<span class="chip-icon"><app-icon name="globe" [size]="14"></app-icon></span>');
  content = content.replace(/➕ Yangi Restoran Qo‘shish/g, '<app-icon name="plus" [size]="16"></app-icon> Yangi Restoran Qo‘shish');
  content = content.replace(/<span class="metric-icon"[^>]*>🏢<\/span>/g, '<span class="metric-icon"><app-icon name="building" [size]="22"></app-icon></span>');
  content = content.replace(/🟢 {{ stats\(\)\?\.activeRestaurants \?\? 0 }} faol/g, '{{ stats()?.activeRestaurants ?? 0 }} faol');
  content = content.replace(/<span class="metric-icon"[^>]*>💰<\/span>/g, '<span class="metric-icon"><app-icon name="dollar-sign" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="metric-icon"[^>]*>📋<\/span>/g, '<span class="metric-icon"><app-icon name="clipboard" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="metric-icon"[^>]*>👥<\/span>/g, '<span class="metric-icon"><app-icon name="users" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="metric-icon"[^>]*>🧾<\/span>/g, '<span class="metric-icon"><app-icon name="file-text" [size]="22"></app-icon></span>');
  content = content.replace(/<span class="metric-icon"[^>]*>💳<\/span>/g, '<span class="metric-icon"><app-icon name="credit-card" [size]="22"></app-icon></span>');

  content = content.replace(/<div class="nav-tile__icon">🏢<\/div>/g, '<div class="nav-tile__icon"><app-icon name="building" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="nav-tile__icon">💰<\/div>/g, '<div class="nav-tile__icon"><app-icon name="dollar-sign" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="nav-tile__icon">👥<\/div>/g, '<div class="nav-tile__icon"><app-icon name="users" [size]="24"></app-icon></div>');
  content = content.replace(/<div class="nav-tile__icon">📈<\/div>/g, '<div class="nav-tile__icon"><app-icon name="trending-up" [size]="24"></app-icon></div>');

  content = content.replace(/<h2 class="section-title">🏢 Restoran Filiallari va Real Ko‘rsatkichlar<\/h2>/g, '<h2 class="section-title"><app-icon name="building" [size]="20"></app-icon> Restoran Filiallari va Real Ko‘rsatkichlar</h2>');
  content = content.replace(/🔄 Yangilash/g, '<app-icon name="refresh" [size]="14"></app-icon> Yangilash');
  content = content.replace(/<div class="empty-icon">🏢<\/div>/g, '<div class="empty-icon"><app-icon name="building" [size]="48"></app-icon></div>');
  content = content.replace(/<div class="res-avatar">🏢<\/div>/g, '<div class="res-avatar"><app-icon name="building" [size]="20"></app-icon></div>');
  content = content.replace(/<span class="badge-employees">👤 {{ r\.employeeCount }} ta<\/span>/g, '<span class="badge-employees"><app-icon name="user" [size]="12"></app-icon> {{ r.employeeCount }} ta</span>');
  content = content.replace(/{{ r\.status === 'ACTIVE' \? '🟢 FAOL' : \(r\.status === 'SUSPENDED' \? '⏸️ TO‘XTATILGAN' : '⚪ NOFAOL'\) }}/g, "{{ r.status === 'ACTIVE' ? 'FAOL' : (r.status === 'SUSPENDED' ? 'TO‘XTATILGAN' : 'NOFAOL') }}");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-dashboard.component.ts');
}

function updatePlatformDevices() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/devices/platform-devices.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule]", "imports: [CommonModule, FormsModule, AppIconComponent]");
  }

  content = content.replace(/<div class="header-icon-wrap">💻<\/div>/g, '<div class="header-icon-wrap"><app-icon name="monitor" [size]="24"></app-icon></div>');
  content = content.replace(/<span>🔄 Yangilash<\/span>/g, '<app-icon name="refresh" [size]="16"></app-icon> <span>Yangilash</span>');
  content = content.replace(/<div class="metric-icon metric-icon--purple">💻<\/div>/g, '<div class="metric-icon metric-icon--purple"><app-icon name="monitor" [size]="22"></app-icon></div>');
  content = content.replace(/<div class="metric-icon metric-icon--green">🟢<\/div>/g, '<div class="metric-icon metric-icon--green"><app-icon name="check-circle" [size]="22"></app-icon></div>');
  content = content.replace(/<div class="metric-icon metric-icon--blue">✓<\/div>/g, '<div class="metric-icon metric-icon--blue"><app-icon name="shield" [size]="22"></app-icon></div>');
  content = content.replace(/<div class="metric-icon metric-icon--amber">🔒<\/div>/g, '<div class="metric-icon metric-icon--amber"><app-icon name="lock" [size]="22"></app-icon></div>');
  content = content.replace(/<span class="search-icon">🔍<\/span>/g, '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
  content = content.replace(/<button \*ngIf="searchQuery" class="clear-search-btn" \(click\)="searchQuery = \'\'">✕<\/button>/g, '<button *ngIf="searchQuery" class="clear-search-btn" (click)="searchQuery = \'\'"><app-icon name="x" [size]="14"></app-icon></button>');
  content = content.replace(/<div class="empty-icon">💻<\/div>/g, '<div class="empty-icon"><app-icon name="monitor" [size]="48"></app-icon></div>');
  content = content.replace(/🔒 Bloklash/g, '<app-icon name="lock" [size]="14"></app-icon> Bloklash');
  content = content.replace(/⚡ Faollashtirish/g, '<app-icon name="zap" [size]="14"></app-icon> Faollashtirish');
  content = content.replace(/⛔ Revoke/g, '<app-icon name="slash" [size]="14"></app-icon> Revoke');
  content = content.replace(/title="O'chirish">[\s\r\n]*🗑️[\s\r\n]*<\/button>/g, 'title="O\'chirish"><app-icon name="trash" [size]="14"></app-icon></button>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-devices.component.ts');
}

function updatePlatformEmployees() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/employees/platform-employees.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule]", "imports: [CommonModule, FormsModule, AppIconComponent]");
  }

  content = content.replace(/<span class="badge-icon">👥<\/span>/g, '<span class="badge-icon"><app-icon name="users" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="btn-icon">🔄<\/span>/g, '<span class="btn-icon"><app-icon name="refresh" [size]="14"></app-icon></span>');
  content = content.replace(/<option value="true">🟢 Faol<\/option>/g, '<option value="true">Faol</option>');
  content = content.replace(/<div class="empty-icon">👥<\/div>/g, '<div class="empty-icon"><app-icon name="users" [size]="48"></app-icon></div>');
  content = content.replace(/{{ emp\.active \? \'🟢 Faol\' : \'⏸️ To‘xtatilgan\' }}/g, "{{ emp.active ? 'Faol' : 'To‘xtatilgan' }}");

  content = content.replace("if (r.includes('ADMIN')) return '👑 Admin';", "if (r.includes('ADMIN')) return 'Admin';");
  content = content.replace("if (r.includes('WAITER')) return '🍽️ Ofitsiant';", "if (r.includes('WAITER')) return 'Ofitsiant';");
  content = content.replace("if (r.includes('KITCHEN')) return '👨‍🍳 Oshxona';", "if (r.includes('KITCHEN')) return 'Oshxona';");
  content = content.replace("if (r.includes('CASHIER')) return '💵 Kassir';", "if (r.includes('CASHIER')) return 'Kassir';");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-employees.component.ts');
}

function updatePlatformPayments() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/payments/platform-payments.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule]", "imports: [CommonModule, FormsModule, AppIconComponent]");
  }

  content = content.replace(/🔄 Yangilash/g, '<app-icon name="refresh" [size]="14"></app-icon> Yangilash');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-payments.component.ts');
}

function updatePlatformReports() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/reports/platform-reports.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule]", "imports: [CommonModule, FormsModule, AppIconComponent]");
  }

  content = content.replace(/<span class="badge-icon">📈<\/span>/g, '<span class="badge-icon"><app-icon name="trending-up" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="btn-icon">🖨️<\/span>/g, '<span class="btn-icon"><app-icon name="printer" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="btn-icon">🔄<\/span>/g, '<span class="btn-icon"><app-icon name="refresh" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="kpi-icon">💰<\/span>/g, '<span class="kpi-icon"><app-icon name="dollar-sign" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="kpi-icon">📋<\/span>/g, '<span class="kpi-icon"><app-icon name="clipboard" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="kpi-icon">🏢<\/span>/g, '<span class="kpi-icon"><app-icon name="building" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="kpi-icon">📊<\/span>/g, '<span class="kpi-icon"><app-icon name="bar-chart" [size]="20"></app-icon></span>');
  content = content.replace(/<div class="empty-icon">📈<\/div>/g, '<div class="empty-icon"><app-icon name="trending-up" [size]="48"></app-icon></div>');
  content = content.replace(/<span class="res-avatar">🏢<\/span>/g, '<span class="res-avatar"><app-icon name="building" [size]="16"></app-icon></span>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-reports.component.ts');
}

function updatePlatformRestaurantDetail() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/restaurants/restaurant-detail/platform-restaurant-detail.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule, RouterLink]", "imports: [CommonModule, FormsModule, RouterLink, AppIconComponent]");
  }

  content = content.replace(/<div class="res-icon">🏢<\/div>/g, '<div class="res-icon"><app-icon name="building" [size]="28"></app-icon></div>');
  content = content.replace(/{{ detail\(\)\?\.status === 'ACTIVE' \? '🟢 FAOL' : \(detail\(\)\?\.status === 'SUSPENDED' \? '⏸️ TO‘XTATILGAN' : '⚪ NOFAOL'\) }}/g, "{{ detail()?.status === 'ACTIVE' ? 'FAOL' : (detail()?.status === 'SUSPENDED' ? 'TO‘XTATILGAN' : 'NOFAOL') }}");
  content = content.replace(/<span>📞 {{/g, '<span><app-icon name="phone" [size]="14"></app-icon> {{');
  content = content.replace(/<span>📍 {{/g, '<span><app-icon name="map-pin" [size]="14"></app-icon> {{');
  content = content.replace(/<span>📋 INN \/ STIR:/g, '<span><app-icon name="file-text" [size]="14"></app-icon> INN / STIR:');
  content = content.replace(/<span class="kpi-icon">💰<\/span>/g, '<span class="kpi-icon"><app-icon name="dollar-sign" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="kpi-icon">👥<\/span>/g, '<span class="kpi-icon"><app-icon name="users" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="sub-label">👑 Adminlar:<\/span>/g, '<span class="sub-label">Adminlar:</span>');
  content = content.replace(/<span class="sub-label">🍽️ Ofitsiantlar:<\/span>/g, '<span class="sub-label">Ofitsiantlar:</span>');
  content = content.replace(/<span class="sub-label">👨‍🍳 Oshpazlar:<\/span>/g, '<span class="sub-label">Oshpazlar:</span>');
  content = content.replace(/<span class="sub-label">💳 Kassirlar:<\/span>/g, '<span class="sub-label">Kassirlar:</span>');
  content = content.replace(/<span class="kpi-icon">📋<\/span>/g, '<span class="kpi-icon"><app-icon name="clipboard" [size]="20"></app-icon></span>');
  content = content.replace(/<span class="sub-label">🟢 To‘langan:<\/span>/g, '<span class="sub-label">To‘langan:</span>');
  content = content.replace(/<span class="sub-label">❌ Bekor qilingan:<\/span>/g, '<span class="sub-label">Bekor qilingan:</span>');
  content = content.replace(/👥 Xodimlar Nazorati/g, '<app-icon name="users" [size]="16"></app-icon> Xodimlar Nazorati');
  content = content.replace(/📋 Buyurtmalar Monitoringi/g, '<app-icon name="clipboard" [size]="16"></app-icon> Buyurtmalar Monitoringi');
  content = content.replace(/{{ emp\.active \? \'🟢 Faol\' : \'🔴 To‘xtatilgan\' }}/g, "{{ emp.active ? 'Faol' : 'To‘xtatilgan' }}");
  content = content.replace(/<span class="banner-icon">🛡️<\/span>/g, '<span class="banner-icon"><app-icon name="shield" [size]="20"></app-icon></span>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-restaurant-detail.component.ts');
}

function updatePlatformRestaurants() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/restaurants/restaurants.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule, RouterLink]", "imports: [CommonModule, FormsModule, RouterLink, AppIconComponent]");
  }

  content = content.replace(/<span class="badge-icon">🌐<\/span>/g, '<span class="badge-icon"><app-icon name="globe" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="btn-icon">➕<\/span>/g, '<span class="btn-icon"><app-icon name="plus" [size]="14"></app-icon></span>');
  content = content.replace(/<div class="stat-card__icon"[^>]*>🏢<\/div>/g, '<div class="stat-card__icon"><app-icon name="building" [size]="20"></app-icon></div>');
  content = content.replace(/<div class="stat-card__icon"[^>]*>🟢<\/div>/g, '<div class="stat-card__icon"><app-icon name="check-circle" [size]="20"></app-icon></div>');
  content = content.replace(/<div class="stat-card__icon"[^>]*>🛡️<\/div>/g, '<div class="stat-card__icon"><app-icon name="shield" [size]="20"></app-icon></div>');
  content = content.replace(/<span class="search-icon">🔍<\/span>/g, '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
  content = content.replace(/<option value="ACTIVE">🟢 Faol<\/option>/g, '<option value="ACTIVE">Faol</option>');
  content = content.replace(/<div class="empty-icon">🏢<\/div>/g, '<div class="empty-icon"><app-icon name="building" [size]="48"></app-icon></div>');
  content = content.replace(/<div class="res-avatar">🏢<\/div>/g, '<div class="res-avatar"><app-icon name="building" [size]="20"></app-icon></div>');
  content = content.replace(/{{ res\.status === 'ACTIVE' \? '🟢 FAOL' : \(res\.status === 'SUSPENDED' \? '⏸️ TO‘XTATILGAN' : '⚪ NOFAOL'\) }}/g, "{{ res.status === 'ACTIVE' ? 'FAOL' : (res.status === 'SUSPENDED' ? 'TO‘XTATILGAN' : 'NOFAOL') }}");
  content = content.replace(/📊 Tafsilotlar/g, '<app-icon name="bar-chart" [size]="14"></app-icon> Tafsilotlar');
  content = content.replace(/👤 \+ Admin/g, '<app-icon name="user-plus" [size]="14"></app-icon> Admin');
  content = content.replace(/<h3 class="modal-title">🏢 Yangi Restoran Ro‘yxatdan O‘tkazish<\/h3>/g, '<h3 class="modal-title"><app-icon name="building" [size]="20"></app-icon> Yangi Restoran Ro‘yxatdan O‘tkazish</h3>');
  content = content.replace(/<button type="button" class="btn-close" \(click\)="closeCreateModal\(\)">✕<\/button>/g, '<button type="button" class="btn-close" (click)="closeCreateModal()"><app-icon name="x" [size]="18"></app-icon></button>');
  content = content.replace(/<h3 class="modal-title">👤 Restoran Admini Yaratish: {{ selectedRestaurant\(\)\?\.name }}<\/h3>/g, '<h3 class="modal-title"><app-icon name="user" [size]="20"></app-icon> Restoran Admini Yaratish: {{ selectedRestaurant()?.name }}</h3>');
  content = content.replace(/<button type="button" class="btn-close" \(click\)="closeAdminModal\(\)">✕<\/button>/g, '<button type="button" class="btn-close" (click)="closeAdminModal()"><app-icon name="x" [size]="18"></app-icon></button>');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-restaurants.component.ts');
}

function updatePlatformSales() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/sales/platform-sales.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, OnInit", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit");
    content = content.replace("imports: [CommonModule, FormsModule, RouterLink]", "imports: [CommonModule, FormsModule, RouterLink, AppIconComponent]");
  }

  content = content.replace(/<span class="badge-icon">💰<\/span>/g, '<span class="badge-icon"><app-icon name="dollar-sign" [size]="14"></app-icon></span>');
  content = content.replace(/<span class="btn-icon">🔄<\/span>/g, '<span class="btn-icon"><app-icon name="refresh" [size]="14"></app-icon></span>');
  content = content.replace(/<div class="empty-icon">📊<\/div>/g, '<div class="empty-icon"><app-icon name="bar-chart" [size]="48"></app-icon></div>');
  content = content.replace(/<span class="res-avatar">🏢<\/span>/g, '<span class="res-avatar"><app-icon name="building" [size]="16"></app-icon></span>');
  content = content.replace(/{{ item\.status === 'ACTIVE' \? '🟢 Faol' : \(item\.status === 'SUSPENDED' \? '⏸️ To‘xtatilgan' : '⚪ Nofaol'\) }}/g, "{{ item.status === 'ACTIVE' ? 'Faol' : (item.status === 'SUSPENDED' ? 'To‘xtatilgan' : 'Nofaol') }}");
  content = content.replace(/📊 Batafsil/g, '<app-icon name="bar-chart" [size]="14"></app-icon> Batafsil');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-sales.component.ts');
}

function updatePlatformSubscriptions() {
  const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/subscriptions/platform-subscriptions.component.ts');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('AppIconComponent')) {
    content = content.replace("import { Component, computed", "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, computed");
    content = content.replace("imports: [CommonModule, FormsModule]", "imports: [CommonModule, FormsModule, AppIconComponent]");
  }

  content = content.replace(/🔄 Yangilash/g, '<app-icon name="refresh" [size]="14"></app-icon> Yangilash');
  content = content.replace(/📥 Kelib Tushgan Arizalar/g, '<app-icon name="inbox" [size]="16"></app-icon> Kelib Tushgan Arizalar');
  content = content.replace(/💳 Karta Rekvizitlari Sozlamasi/g, '<app-icon name="credit-card" [size]="16"></app-icon> Karta Rekvizitlari Sozlamasi');
  content = content.replace(/<span class="empty-icon">📭<\/span>/g, '<span class="empty-icon"><app-icon name="inbox" [size]="48"></app-icon></span>');
  content = content.replace(/<span class="thumb-hover-overlay">🔍<\/span>/g, '<span class="thumb-hover-overlay"><app-icon name="search" [size]="20"></app-icon></span>');
  content = content.replace(/📄 PDF Chek/g, '<app-icon name="file-text" [size]="16"></app-icon> PDF Chek');
  content = content.replace(/<span>✅ Faollashtirish<\/span>/g, '<span><app-icon name="check" [size]="14"></app-icon> Faollashtirish</span>');
  content = content.replace(/❌ Rad etish/g, '<app-icon name="x" [size]="14"></app-icon> Rad etish');
  content = content.replace(/<span class="approved-check">✓ Faollashtirilgan<\/span>/g, '<span class="approved-check"><app-icon name="check" [size]="14"></app-icon> Faollashtirilgan</span>');
  content = content.replace(/<span class="input-icon">💳<\/span>/g, '<span class="input-icon"><app-icon name="credit-card" [size]="16"></app-icon></span>');
  content = content.replace(/<span class="input-icon">👤<\/span>/g, '<span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>');
  content = content.replace(/<span class="input-icon">🏦<\/span>/g, '<span class="input-icon"><app-icon name="building" [size]="16"></app-icon></span>');
  content = content.replace(/<span>💾 Rekvizitlarni Saqlash<\/span>/g, '<span><app-icon name="save" [size]="14"></app-icon> Rekvizitlarni Saqlash</span>');
  content = content.replace(/<span class="save-success-msg">✓ Rekvizitlar muvaffaqiyatli saqlandi!<\/span>/g, '<span class="save-success-msg"><app-icon name="check" [size]="14"></app-icon> Rekvizitlar muvaffaqiyatli saqlandi!</span>');
  content = content.replace(/📋 Nusxa olish/g, '<app-icon name="clipboard" [size]="14"></app-icon> Nusxa olish');
  content = content.replace(/<div class="inst-icon">💡<\/div>/g, '<div class="inst-icon"><app-icon name="info" [size]="20"></app-icon></div>');
  content = content.replace(/<button type="button" class="btn-close-modal" \(click\)="activeReceiptModal\.set\(null\)">✕<\/button>/g, '<button type="button" class="btn-close-modal" (click)="activeReceiptModal.set(null)"><app-icon name="x" [size]="18"></app-icon></button>');
  content = content.replace(/<button type="button" class="btn-close-modal" \(click\)="closeRejectModal\(\)">✕<\/button>/g, '<button type="button" class="btn-close-modal" (click)="closeRejectModal()"><app-icon name="x" [size]="18"></app-icon></button>');
  content = content.replace(/❌ Rad etishni tasdiqlash/g, '<app-icon name="x" [size]="14"></app-icon> Rad etishni tasdiqlash');

  content = content.replace("case 'PENDING_APPROVAL': return '🟡 Kutilmoqda';", "case 'PENDING_APPROVAL': return 'Kutilmoqda';");
  content = content.replace("case 'APPROVED': return '✅ Faollashtirilgan';", "case 'APPROVED': return 'Faollashtirilgan';");
  content = content.replace("case 'REJECTED': return '❌ Rad etilgan';", "case 'REJECTED': return 'Rad etilgan';");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated platform-subscriptions.component.ts');
}

updatePlatformDashboard();
updatePlatformDevices();
updatePlatformEmployees();
updatePlatformPayments();
updatePlatformReports();
updatePlatformRestaurantDetail();
updatePlatformRestaurants();
updatePlatformSales();
updatePlatformSubscriptions();
