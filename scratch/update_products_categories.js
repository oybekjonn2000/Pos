const fs = require('fs');
const path = require('path');

// 1. Update products.component.ts
const pPath = path.join(__dirname, '../frontend/angular-pos/src/app/products/products.component.ts');
let pContent = fs.readFileSync(pPath, 'utf8');

if (!pContent.includes('AppIconComponent')) {
  pContent = pContent.replace(
    "import { ExcelImportModalComponent } from '../shared/components/excel-import-modal/excel-import-modal.component';",
    "import { ExcelImportModalComponent } from '../shared/components/excel-import-modal/excel-import-modal.component';\nimport { AppIconComponent } from '../shared/components/icon/icon.component';"
  );
  pContent = pContent.replace(
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent],",
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent, AppIconComponent],"
  );
}

pContent = pContent.replace('<h1 class="page-title">🍔 Mahsulotlar & Menyu</h1>', '<h1 class="page-title"><app-icon name="products" [size]="24"></app-icon> Mahsulotlar & Menyu</h1>');
pContent = pContent.replace('Oshxona ➔ Kategoriya ➔ Mahsulot', 'Oshxona → Kategoriya → Mahsulot');
pContent = pContent.replace('<span class="search-icon">🔍</span>', '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
pContent = pContent.replace("<span>{{ downloadingTemplate ? 'Yuklanmoqda...' : '📥 Shablon' }}</span>", "<span><app-icon name=\"download\" [size]=\"14\"></app-icon> {{ downloadingTemplate ? 'Yuklanmoqda...' : 'Shablon' }}</span>");
pContent = pContent.replace("<span>{{ exportingExcel ? 'Eksport...' : '📤 Export' }}</span>", "<span><app-icon name=\"upload\" [size]=\"14\"></app-icon> {{ exportingExcel ? 'Eksport...' : 'Export' }}</span>");
pContent = pContent.replace('<span>📥 Import</span>', '<span><app-icon name="download" [size]="14"></app-icon> Import</span>');
pContent = pContent.replace('<span>➕ Yangi Mahsulot</span>', '<span><app-icon name="plus" [size]="14"></app-icon> Yangi Mahsulot</span>');
pContent = pContent.replace('<span>🍽️ Barcha Oshxonalar</span>', '<span><app-icon name="restaurant" [size]="16"></app-icon> Barcha Oshxonalar</span>');
pContent = pContent.replace('<div class="empty-icon">🍽️</div>', '<div class="empty-icon"><app-icon name="products" [size]="48"></app-icon></div>');
pContent = pContent.replace('<span class="kitchen-tab-icon">{{ getKitchenIcon(k.code) }}</span>', '<span class="kitchen-tab-icon"><app-icon [name]="getKitchenIcon(k.code)" [size]="16"></app-icon></span>');
pContent = pContent.replace('<span class="cat-pill-icon">{{ getCategoryIcon(cat.name) }}</span>', '<span class="cat-pill-icon"><app-icon [name]="getCategoryIcon(cat.name)" [size]="14"></app-icon></span>');

pContent = pContent.replace('✏️\n                  </button>', '<app-icon name="edit" [size]="14"></app-icon>\n                  </button>');
pContent = pContent.replace('🗑️\n                  </button>', '<app-icon name="trash" [size]="14"></app-icon>\n                  </button>');
pContent = pContent.replace(
  "<h2 class=\"modal-title\">{{ isEditing ? '✏️ Mahsulotni tahrirlash' : '➕ Yangi Mahsulot Qo‘shish' }}</h2>",
  "<h2 class=\"modal-title\"><app-icon [name]=\"isEditing ? 'edit' : 'plus'\" [size]=\"20\"></app-icon> {{ isEditing ? 'Mahsulotni tahrirlash' : 'Yangi Mahsulot Qo‘shish' }}</h2>"
);
pContent = pContent.replace('<button class="close-btn" (click)="closeModal()">✕</button>', '<button class="close-btn" (click)="closeModal()"><app-icon name="close" [size]="16"></app-icon></button>');
pContent = pContent.replace('🔄 Rasmni almashtirish', '<app-icon name="refresh" [size]="14"></app-icon> Rasmni almashtirish');
pContent = pContent.replace('🗑️ Rasmni o‘chirish', '<app-icon name="trash" [size]="14"></app-icon> Rasmni o‘chirish');
pContent = pContent.replace('<div class="dropzone-icon">📷</div>', '<div class="dropzone-icon"><app-icon name="camera" [size]="32"></app-icon></div>');
pContent = pContent.replace('📁 Kompyuterdan tanlash', '<app-icon name="folder-open" [size]="14"></app-icon> Kompyuterdan tanlash');
pContent = pContent.replace('⚠️ {{ imageError }}', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> {{ imageError }}');

pContent = pContent.replace("if (!code) return '👨‍🍳';", "if (!code) return 'chef';");
pContent = pContent.replace("case 'PALOV': case 'PALOVCHI': return '🥘';", "case 'PALOV': case 'PALOVCHI': return 'cooking-pot';");
pContent = pContent.replace("case 'SOMSA': case 'SOMSAPAZ': return '🥟';", "case 'SOMSA': case 'SOMSAPAZ': return 'products';");
pContent = pContent.replace("case 'BAR': return '🍹';", "case 'BAR': return 'products';");
pContent = pContent.replace("case 'PIZZA': case 'PITSA': return '🍕';", "case 'PIZZA': case 'PITSA': return 'products';");
pContent = pContent.replace("case 'MAIN': case 'MAIN_KITCHEN': return '👨‍🍳';", "case 'MAIN': case 'MAIN_KITCHEN': return 'chef';");
pContent = pContent.replace("default: return '🍳';", "default: return 'chef';");

pContent = pContent.replace("if (n.includes('osh') || n.includes('palov')) return '🥘';", "if (n.includes('osh') || n.includes('palov')) return 'cooking-pot';");
pContent = pContent.replace("if (n.includes('somsa')) return '🥟';", "if (n.includes('somsa')) return 'products';");
pContent = pContent.replace("if (n.includes('pitsa') || n.includes('pizza')) return '🍕';", "if (n.includes('pitsa') || n.includes('pizza')) return 'products';");
pContent = pContent.replace("if (n.includes('cola') || n.includes('fanta') || n.includes('choy') || n.includes('suv') || n.includes('ichimlik')) return '🍹';", "if (n.includes('cola') || n.includes('fanta') || n.includes('choy') || n.includes('suv') || n.includes('ichimlik')) return 'products';");
pContent = pContent.replace("if (n.includes('shashlik') || n.includes('kabob')) return '🥩';", "if (n.includes('shashlik') || n.includes('kabob')) return 'products';");
pContent = pContent.replace("if (n.includes('manti')) return '🥟';", "if (n.includes('manti')) return 'products';");
pContent = pContent.replace("if (n.includes('salat')) return '🥗';", "if (n.includes('salat')) return 'products';");
pContent = pContent.replace("if (n.includes('shorva') || n.includes(\"sho'rva\")) return '🍲';", "if (n.includes('shorva') || n.includes(\"sho'rva\")) return 'cooking-pot';");
pContent = pContent.replace("return '🍽️';", "return 'products';");

fs.writeFileSync(pPath, pContent, 'utf8');
console.log('Updated products.component.ts');

// 2. Update categories.component.ts
const cPath = path.join(__dirname, '../frontend/angular-pos/src/app/categories/categories.component.ts');
let cContent = fs.readFileSync(cPath, 'utf8');

if (!cContent.includes('AppIconComponent')) {
  cContent = cContent.replace(
    "import { ExcelImportModalComponent } from '../shared/components/excel-import-modal/excel-import-modal.component';",
    "import { ExcelImportModalComponent } from '../shared/components/excel-import-modal/excel-import-modal.component';\nimport { AppIconComponent } from '../shared/components/icon/icon.component';"
  );
  cContent = cContent.replace(
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent],",
    "imports: [CommonModule, FormsModule, RouterModule, ExcelImportModalComponent, AppIconComponent],"
  );
}

cContent = cContent.replace('<h1 class="page-title">🏷️ Bo\'limlar & Kategoriyalar</h1>', '<h1 class="page-title"><app-icon name="tag" [size]="24"></app-icon> Bo\'limlar & Kategoriyalar</h1>');
cContent = cContent.replace('Oshxona ➔ Kategoriya ➔ Mahsulot', 'Oshxona → Kategoriya → Mahsulot');
cContent = cContent.replace("<span>{{ downloadingTemplate ? 'Yuklanmoqda...' : '📥 Shablon' }}</span>", "<span><app-icon name=\"download\" [size]=\"14\"></app-icon> {{ downloadingTemplate ? 'Yuklanmoqda...' : 'Shablon' }}</span>");
cContent = cContent.replace("<span>{{ exportingExcel ? 'Eksport...' : '📤 Export' }}</span>", "<span><app-icon name=\"upload\" [size]=\"14\"></app-icon> {{ exportingExcel ? 'Eksport...' : 'Export' }}</span>");
cContent = cContent.replace('<span>📥 Import</span>', '<span><app-icon name="download" [size]="14"></app-icon> Import</span>');
cContent = cContent.replace('<span>➕ Yangi Kategoriya Qo\'shish</span>', '<span><app-icon name="plus" [size]="14"></app-icon> Yangi Kategoriya Qo\'shish</span>');
cContent = cContent.replace('📋 Ro\'yxat', '<app-icon name="orders" [size]="14"></app-icon> Ro\'yxat');
cContent = cContent.replace('<span>🍽️ Barcha Oshxonalar</span>', '<span><app-icon name="restaurant" [size]="16"></app-icon> Barcha Oshxonalar</span>');
cContent = cContent.replace('<div class="empty-icon">📁</div>', '<div class="empty-icon"><app-icon name="folder" [size]="48"></app-icon></div>');
cContent = cContent.replaceAll('📦 {{ cat.productCount || 0 }} ta mahsulot', '<app-icon name="products" [size]="14"></app-icon> {{ cat.productCount || 0 }} ta mahsulot');
cContent = cContent.replaceAll('✏️ Tahrirlash', '<app-icon name="edit" [size]="14"></app-icon> Tahrirlash');
cContent = cContent.replaceAll('🗑️ O\'chirish', '<app-icon name="trash" [size]="14"></app-icon> O\'chirish');
cContent = cContent.replace(
  "<h2 class=\"modal-title\">{{ isEditing ? '✏️ Kategoriyani tahrirlash' : '➕ Yangi Kategoriya' }}</h2>",
  "<h2 class=\"modal-title\"><app-icon [name]=\"isEditing ? 'edit' : 'plus'\" [size]=\"20\"></app-icon> {{ isEditing ? 'Kategoriyani tahrirlash' : 'Yangi Kategoriya' }}</h2>"
);
cContent = cContent.replace('<button class="close-btn" (click)="closeModal()">✕</button>', '<button class="close-btn" (click)="closeModal()"><app-icon name="close" [size]="16"></app-icon></button>');
cContent = cContent.replace('⚠️ Oshxona tanlanishi kerak!', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> Oshxona tanlanishi kerak!');
cContent = cContent.replace('<span class="kitchen-tab-icon">{{ getKitchenIcon(k.code) }}</span>', '<span class="kitchen-tab-icon"><app-icon [name]="getKitchenIcon(k.code)" [size]="16"></app-icon></span>');

cContent = cContent.replace("if (!code) return '👨‍🍳';", "if (!code) return 'chef';");
cContent = cContent.replace("case 'PALOV': case 'PALOVCHI': return '🥘';", "case 'PALOV': case 'PALOVCHI': return 'cooking-pot';");
cContent = cContent.replace("case 'SOMSA': case 'SOMSAPAZ': return '🥟';", "case 'SOMSA': case 'SOMSAPAZ': return 'products';");
cContent = cContent.replace("case 'BAR': return '🍹';", "case 'BAR': return 'products';");
cContent = cContent.replace("case 'PIZZA': case 'PITSA': return '🍕';", "case 'PIZZA': case 'PITSA': return 'products';");
cContent = cContent.replace("case 'MAIN': case 'MAIN_KITCHEN': return '👨‍🍳';", "case 'MAIN': case 'MAIN_KITCHEN': return 'chef';");
cContent = cContent.replace("default: return '🍳';", "default: return 'chef';");

fs.writeFileSync(cPath, cContent, 'utf8');
console.log('Updated categories.component.ts');
