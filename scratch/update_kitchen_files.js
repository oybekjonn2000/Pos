const fs = require('fs');
const path = require('path');

// 1. Update kitchen.component.ts
const kPath = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen.component.ts');
let kContent = fs.readFileSync(kPath, 'utf8');

if (!kContent.includes('AppIconComponent')) {
  kContent = kContent.replace(
    "import { FeatureService } from '../core/services/feature.service';",
    "import { FeatureService } from '../core/services/feature.service';\nimport { AppIconComponent } from '../shared/components/icon/icon.component';"
  );
  kContent = kContent.replace(
    "imports: [CommonModule, FormsModule, RouterModule],",
    "imports: [CommonModule, FormsModule, RouterModule, AppIconComponent],"
  );
}

kContent = kContent.replace('<h1 class="kds-title">👨‍🍳 Oshxona Ekrani (KDS)</h1>', '<h1 class="kds-title"><app-icon name="chef" [size]="24"></app-icon> Oshxona Ekrani (KDS)</h1>');
kContent = kContent.replace('<span class="station-icon">🍽️</span>', '<span class="station-icon"><app-icon name="restaurant" [size]="16"></app-icon></span>');
kContent = kContent.replace('<span class="time-filter-label">🕒 Vaqt / Sana:</span>', '<span class="time-filter-label"><app-icon name="clock" [size]="14"></app-icon> Vaqt / Sana:</span>');
kContent = kContent.replace('📅 Boshqa sana', '<app-icon name="clock" [size]="14"></app-icon> Boshqa sana');
kContent = kContent.replace('<span class="alert-icon-anim">⚠️</span>', '<span class="alert-icon-anim"><app-icon name="alert-triangle" [size]="18" class="icon--warning"></app-icon></span>');
kContent = kContent.replace('<button class="alert-dismiss-btn" (click)="cancellationAlert = null">✕</button>', '<button class="alert-dismiss-btn" (click)="cancellationAlert = null"><app-icon name="close" [size]="16"></app-icon></button>');
kContent = kContent.replace(
  '<div class="empty-icon">{{ currentFilter === \'SERVED\' ? \'✅\' : getKitchenIcon(selectedKitchen?.code) }}</div>',
  '<div class="empty-icon"><app-icon [name]="currentFilter === \'SERVED\' ? \'check-circle\' : getKitchenIcon(selectedKitchen?.code)" [size]="48"></app-icon></div>'
);
kContent = kContent.replace('🌐 Barcha davr buyurtmalarini ko‘rsatish', '<app-icon name="globe" [size]="14"></app-icon> Barcha davr buyurtmalarini ko‘rsatish');
kContent = kContent.replace(
  "{{ card.overallStatus === 'SERVED' ? '🕒 ' + formatTime(card.servedAt || card.latestSentAt) : '⏱️ ' + getElapsedTime(card) }}",
  "<app-icon name=\"clock\" [size]=\"14\"></app-icon> {{ card.overallStatus === 'SERVED' ? formatTime(card.servedAt || card.latestSentAt) : getElapsedTime(card) }}"
);
kContent = kContent.replace('🔔 YANGI BUYURTMA QO‘SHILDI', '<app-icon name="bell" [size]="14"></app-icon> YANGI BUYURTMA QO‘SHILDI');
kContent = kContent.replace('<span>👤 Ofitsiant:', '<span><app-icon name="user" [size]="12"></app-icon> Ofitsiant:');
kContent = kContent.replace('🏷️ {{ card.kitchenName }}', '<app-icon name="tag" [size]="12"></app-icon> {{ card.kitchenName }}');
kContent = kContent.replace('🕒 {{ formatTime(card.latestSentAt) }}', '<app-icon name="clock" [size]="12"></app-icon> {{ formatTime(card.latestSentAt) }}');
kContent = kContent.replace('💬 {{ card.notes }}', '<app-icon name="file-text" [size]="12"></app-icon> {{ card.notes }}');
kContent = kContent.replace("{{ prod.hasDistinctStatuses ? '⚡ Qisman yangi' : getStatusText(prod.status) }}", "{{ prod.hasDistinctStatuses ? 'Qisman yangi' : getStatusText(prod.status) }}");
kContent = kContent.replace("🔔 Yangi (Partiya #{{ sub.batchNumber }})", "<app-icon name=\"bell\" [size]=\"12\"></app-icon> Yangi (Partiya #{{ sub.batchNumber }})");
kContent = kContent.replace("✓ Qabul qilingan", "<app-icon name=\"check\" [size]=\"12\"></app-icon> Qabul qilingan");
kContent = kContent.replace("✅ Tayyor", "<app-icon name=\"check-circle\" [size]=\"12\"></app-icon> Tayyor");
kContent = kContent.replace("🍽️ Tarqatildi", "<app-icon name=\"restaurant\" [size]=\"12\"></app-icon> Tarqatildi");
kContent = kContent.replace("⚠️ {{ prod.notes }}", "<app-icon name=\"alert-triangle\" [size]=\"12\" class=\"icon--warning\"></app-icon> {{ prod.notes }}");
kContent = kContent.replace("📥 QABUL QILISH", "<app-icon name=\"download\" [size]=\"14\"></app-icon> QABUL QILISH");
kContent = kContent.replace("✅ TAYYOR", "<app-icon name=\"check-circle\" [size]=\"14\"></app-icon> TAYYOR");
kContent = kContent.replace("🍽️ TARQATILDI", "<app-icon name=\"restaurant\" [size]=\"14\"></app-icon> TARQATILDI");
kContent = kContent.replace("✅ Tarqatildi:", "<app-icon name=\"check-circle\" [size]=\"14\"></app-icon> Tarqatildi:");
kContent = kContent.replace("↩️ Qaytarish", "<app-icon name=\"undo\" [size]=\"14\"></app-icon> Qaytarish");
kContent = kContent.replace("⭐ PRO TARIF TALAB QILINADI", "<app-icon name=\"crown\" [size]=\"14\"></app-icon> PRO TARIF TALAB QILINADI");
kContent = kContent.replace('<div class="upgrade-icon">👨‍🍳</div>', '<div class="upgrade-icon"><app-icon name="chef" [size]="48"></app-icon></div>');
kContent = kContent.replace('<span class="perk-icon">⚡</span>', '<span class="perk-icon"><app-icon name="zap" [size]="16"></app-icon></span>');
kContent = kContent.replace('<span class="perk-icon">🎯</span>', '<span class="perk-icon"><app-icon name="check-circle" [size]="16"></app-icon></span>');
kContent = kContent.replace('<span class="perk-icon">⏱️</span>', '<span class="perk-icon"><app-icon name="clock" [size]="16"></app-icon></span>');
kContent = kContent.replace('<span class="perk-icon">📱</span>', '<span class="perk-icon"><app-icon name="smartphone" [size]="16"></app-icon></span>');
kContent = kContent.replace('♾️ Resurslar soni bo\'yicha hech qanday cheklov yo\'q', 'Resurslar soni bo\'yicha hech qanday cheklov yo\'q');
kContent = kContent.replace("{{ featureService.loading() ? '🔄 Tekshirilmoqda...' : '🔄 Obunani qayta tekshirish' }}", "{{ featureService.loading() ? 'Tekshirilmoqda...' : 'Obunani qayta tekshirish' }}");
kContent = kContent.replace('⚡ Pro Tarifga O\'tish', 'Pro Tarifga O\'tish');

kContent = kContent.replace("case 'PLOV': return '🍚';", "case 'PLOV': return 'cooking-pot';");
kContent = kContent.replace("case 'SOMSA': return '🥟';", "case 'SOMSA': return 'products';");
kContent = kContent.replace("case 'PIZZA': return '🍕';", "case 'PIZZA': return 'products';");
kContent = kContent.replace("case 'BAR': return '🍹';", "case 'BAR': return 'products';");
kContent = kContent.replace("case 'MAIN': return '🍲';", "case 'MAIN': return 'chef';");
kContent = kContent.replace("default: return '👨‍🍳';", "default: return 'chef';");

kContent = kContent.replace("case 'NEW': return '🟡 YANGI';", "case 'NEW': return 'YANGI';");
kContent = kContent.replace("case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';", "case 'SENT_TO_KITCHEN': return 'OSHXONADA';");
kContent = kContent.replace("case 'ACCEPTED': return '🟣 QABUL QILINDI';", "case 'ACCEPTED': return 'QABUL QILINDI';");
kContent = kContent.replace("case 'COOKING': return '🟣 QABUL QILINDI';", "case 'COOKING': return 'QABUL QILINDI';");
kContent = kContent.replace("case 'READY': return '🟢 TAYYOR';", "case 'READY': return 'TAYYOR';");
kContent = kContent.replace("case 'SERVED': return '✅ TARQATILDI';", "case 'SERVED': return 'TARQATILDI';");
kContent = kContent.replace("case 'CANCELLED': return '🔴 BEKOR QILINDI';", "case 'CANCELLED': return 'BEKOR QILINDI';");

fs.writeFileSync(kPath, kContent, 'utf8');
console.log('Updated kitchen.component.ts');

// 2. Update kitchen-management.component.ts
const kmPath = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen-management/kitchen-management.component.ts');
let kmContent = fs.readFileSync(kmPath, 'utf8');

if (!kmContent.includes('AppIconComponent')) {
  kmContent = kmContent.replace(
    "import { ExcelImportModalComponent } from '../../shared/components/excel-import-modal/excel-import-modal.component';",
    "import { ExcelImportModalComponent } from '../../shared/components/excel-import-modal/excel-import-modal.component';\nimport { AppIconComponent } from '../../shared/components/icon/icon.component';"
  );
  kmContent = kmContent.replace(
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent],",
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent, AppIconComponent],"
  );
}

kmContent = kmContent.replace('<div class="header-icon-wrap">🥘</div>', '<div class="header-icon-wrap"><app-icon name="cooking-pot" [size]="24"></app-icon></div>');
kmContent = kmContent.replace('<span>{{ downloadingTemplate ? \'Yuklanmoqda...\' : \'📥 Shablon\' }}</span>', '<span><app-icon name="download" [size]="14"></app-icon> {{ downloadingTemplate ? \'Yuklanmoqda...\' : \'Shablon\' }}</span>');
kmContent = kmContent.replace('<span>{{ exportingExcel ? \'Eksport...\' : \'📤 Export\' }}</span>', '<span><app-icon name="upload" [size]="14"></app-icon> {{ exportingExcel ? \'Eksport...\' : \'Export\' }}</span>');
kmContent = kmContent.replace('<span>📥 Import</span>', '<span><app-icon name="download" [size]="14"></app-icon> Import</span>');
kmContent = kmContent.replace('<span class="btn-icon">➕</span>', '<app-icon name="plus" [size]="14"></app-icon>');
kmContent = kmContent.replace('<div class="metric-icon metric-icon--purple">🥘</div>', '<div class="metric-icon metric-icon--purple"><app-icon name="cooking-pot" [size]="20"></app-icon></div>');
kmContent = kmContent.replace('<div class="metric-icon metric-icon--green">🟢</div>', '<div class="metric-icon metric-icon--green"><app-icon name="check-circle" [size]="20" class="icon--success"></app-icon></div>');
kmContent = kmContent.replace('<div class="metric-icon metric-icon--amber">⚪</div>', '<div class="metric-icon metric-icon--amber"><app-icon name="pause" [size]="20"></app-icon></div>');
kmContent = kmContent.replace('<div class="metric-icon metric-icon--blue">👨‍🍳</div>', '<div class="metric-icon metric-icon--blue"><app-icon name="chef" [size]="20"></app-icon></div>');
kmContent = kmContent.replace('<span class="search-icon">🔍</span>', '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
kmContent = kmContent.replace('(click)="searchQuery = \'\'; onSearchChange()">✕</button>', '(click)="searchQuery = \'\'; onSearchChange()"><app-icon name="close" [size]="14"></app-icon></button>');
kmContent = kmContent.replace('<span>🔄 Yangilash</span>', '<span><app-icon name="refresh" [size]="14"></app-icon> Yangilash</span>');
kmContent = kmContent.replace('<div class="empty-icon">🍳</div>', '<div class="empty-icon"><app-icon name="cooking-pot" [size]="48"></app-icon></div>');
kmContent = kmContent.replace('➕ Yangi oshxona qo\'shish', '<app-icon name="plus" [size]="16"></app-icon> Yangi oshxona qo\'shish');
kmContent = kmContent.replace('<span class="badge-icon">👨‍🍳</span>', '<span class="badge-icon"><app-icon name="chef" [size]="14"></app-icon></span>');
kmContent = kmContent.replace('<span class="badge-icon">🏷️</span>', '<span class="badge-icon"><app-icon name="tag" [size]="14"></app-icon></span>');
kmContent = kmContent.replaceAll('✏️ Tahrirlash', '<app-icon name="edit" [size]="14"></app-icon> Tahrirlash');
kmContent = kmContent.replace("{{ k.active ? '⏸ Deaktiv' : '▶ Aktiv' }}", "{{ k.active ? 'Deaktiv' : 'Aktiv' }}");
kmContent = kmContent.replace('🗑️\n                  </button>', '<app-icon name="trash" [size]="14"></app-icon>\n                  </button>');
kmContent = kmContent.replace('<span class="modal-icon">{{ isEditing ? \'✏️\' : \'➕\' }}</span>', '<span class="modal-icon"><app-icon [name]="isEditing ? \'edit\' : \'plus\'" [size]="20"></app-icon></span>');
kmContent = kmContent.replaceAll('<button class="close-modal-btn" (click)="closeFormModal()">✕</button>', '<button class="close-modal-btn" (click)="closeFormModal()"><app-icon name="close" [size]="16"></app-icon></button>');
kmContent = kmContent.replace('🖨️ {{ p.name }} ({{ p.connectionType }})', '<app-icon name="printer" [size]="14"></app-icon> {{ p.name }} ({{ p.connectionType }})');
kmContent = kmContent.replace('⚠️ Hozir: {{ cat.kitchenName }}', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> Hozir: {{ cat.kitchenName }}');
kmContent = kmContent.replace('✓ Bu oshxonada', '<app-icon name="check" [size]="14" class="icon--success"></app-icon> Bu oshxonada');
kmContent = kmContent.replace('<span class="modal-icon">👨‍🍳</span>', '<span class="modal-icon"><app-icon name="chef" [size]="20"></app-icon></span>');
kmContent = kmContent.replaceAll('<button class="close-modal-btn" (click)="closeStaffModal()">✕</button>', '<button class="close-modal-btn" (click)="closeStaffModal()"><app-icon name="close" [size]="16"></app-icon></button>');
kmContent = kmContent.replace('<span>👨‍🍳 Biriktirilgan oshpazlar:</span>', '<span><app-icon name="chef" [size]="14"></app-icon> Biriktirilgan oshpazlar:</span>');
kmContent = kmContent.replace('<span>➕ Oshpaz Biriktirish</span>', '<span><app-icon name="plus" [size]="14"></app-icon> Oshpaz Biriktirish</span>');
kmContent = kmContent.replace('➕ Yangi Oshpaz Biriktirish', '<app-icon name="plus" [size]="14"></app-icon> Yangi Oshpaz Biriktirish');
kmContent = kmContent.replace('<button class="close-assign-btn" (click)="closeAssignCookSection()">✕</button>', '<button class="close-assign-btn" (click)="closeAssignCookSection()"><app-icon name="close" [size]="14"></app-icon></button>');
kmContent = kmContent.replace('<span>ℹ️ Hozirda', '<span><app-icon name="info" [size]="14"></app-icon> Hozirda');
kmContent = kmContent.replace('👨‍🍳 {{ cook.fullName', '<app-icon name="chef" [size]="14"></app-icon> {{ cook.fullName');
kmContent = kmContent.replace('<div class="empty-icon">👨‍🍳</div>', '<div class="empty-icon"><app-icon name="chef" [size]="48"></app-icon></div>');
kmContent = kmContent.replace('<span>🔄 Boshqa oshxonaga o\'tkazish</span>', '<span><app-icon name="refresh" [size]="14"></app-icon> Boshqa oshxonaga o\'tkazish</span>');
kmContent = kmContent.replace('❌ Ajratish', '<app-icon name="close" [size]="14"></app-icon> Ajratish');
kmContent = kmContent.replace('<span class="modal-icon">🔄</span>', '<span class="modal-icon"><app-icon name="refresh" [size]="20"></app-icon></span>');
kmContent = kmContent.replaceAll('<button class="close-modal-btn" (click)="closeTransferModal()">✕</button>', '<button class="close-modal-btn" (click)="closeTransferModal()"><app-icon name="close" [size]="16"></app-icon></button>');
kmContent = kmContent.replace('🥘 {{ k.name }} ({{ k.code }})', '<app-icon name="cooking-pot" [size]="14"></app-icon> {{ k.name }} ({{ k.code }})');
kmContent = kmContent.replace('⚠️ O\'tkazish uchun', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> O\'tkazish uchun');
kmContent = kmContent.replace('🔄 Ko‘chirishni Tasdiqlash', '<app-icon name="refresh" [size]="14"></app-icon> Ko‘chirishni Tasdiqlash');
kmContent = kmContent.replace('<span class="modal-icon">🏷️</span>', '<span class="modal-icon"><app-icon name="tag" [size]="20"></app-icon></span>');
kmContent = kmContent.replaceAll('<button class="close-modal-btn" (click)="closeCategoriesModal()">✕</button>', '<button class="close-modal-btn" (click)="closeCategoriesModal()"><app-icon name="close" [size]="16"></app-icon></button>');
kmContent = kmContent.replace('<div class="empty-icon">📁</div>', '<div class="empty-icon"><app-icon name="folder" [size]="48"></app-icon></div>');
kmContent = kmContent.replace('<span class="modal-icon">⚠️</span>', '<span class="modal-icon"><app-icon name="alert-triangle" [size]="20" class="icon--warning"></app-icon></span>');
kmContent = kmContent.replaceAll('<button class="close-modal-btn" (click)="closeDeleteModal()">✕</button>', '<button class="close-modal-btn" (click)="closeDeleteModal()"><app-icon name="close" [size]="16"></app-icon></button>');
kmContent = kmContent.replace('<div class="info-icon">👨‍🍳</div>', '<div class="info-icon"><app-icon name="chef" [size]="18"></app-icon></div>');
kmContent = kmContent.replace('<div class="info-icon">🛡️</div>', '<div class="info-icon"><app-icon name="shield" [size]="18"></app-icon></div>');

fs.writeFileSync(kmPath, kmContent, 'utf8');
console.log('Updated kitchen-management.component.ts');
