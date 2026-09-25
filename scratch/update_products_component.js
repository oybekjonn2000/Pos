const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/products/products.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../shared/pipes/translate.pipe';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent],",
    "imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent, TranslatePipe],"
  );
}

// 2. Template strings
content = content.replace(
  '<h1 class="page-title"><app-icon name="products" [size]="24"></app-icon> Mahsulotlar & Menyu</h1>',
  '<h1 class="page-title"><app-icon name="products" [size]="24"></app-icon> {{ \'products.title\' | translate }}</h1>'
);
content = content.replace(
  '<span><app-icon name="plus" [size]="14"></app-icon> Yangi Mahsulot</span>',
  '<span><app-icon name="plus" [size]="14"></app-icon> {{ \'products.addProduct\' | translate }}</span>'
);
content = content.replace(
  '<span class="filter-title">Oshxona:</span>',
  '<span class="filter-title">{{ \'kitchen.title\' | translate }}:</span>'
);
content = content.replace(
  '<span><app-icon name="restaurant" [size]="16"></app-icon> Barcha Oshxonalar</span>',
  '<span><app-icon name="restaurant" [size]="16"></app-icon> {{ \'kitchen.allStations\' | translate }}</span>'
);
content = content.replace(
  '<span class="filter-title">Kategoriya:</span>',
  '<span class="filter-title">{{ \'products.category\' | translate }}:</span>'
);
content = content.replace(
  'Barcha bo\'limlar\n        </button>',
  '{{ \'common.all\' | translate }}\n        </button>'
);
content = content.replace(
  'Barcha bo\'limlar\r\n        </button>',
  '{{ \'common.all\' | translate }}\r\n        </button>'
);
content = content.replace(
  '<p>Mahsulotlar yuklanmoqda...</p>',
  '<p>{{ \'common.loading\' | translate }}</p>'
);
content = content.replace(
  '<h3>Mahsulotlar topilmadi</h3>',
  '<h3>{{ \'common.noRecords\' | translate }}</h3>'
);

content = content.replace(
  '<th>Taom / Mahsulot</th>',
  '<th>{{ \'products.productName\' | translate }}</th>'
);
content = content.replace(
  '<th>Kategoriya</th>',
  '<th>{{ \'products.category\' | translate }}</th>'
);
content = content.replace(
  '<th>Oshxona (KDS)</th>',
  '<th>{{ \'products.kitchenStation\' | translate }}</th>'
);
content = content.replace(
  '<th style="text-align: right;">Sotish narxi</th>',
  '<th style="text-align: right;">{{ \'products.price\' | translate }}</th>'
);
content = content.replace(
  '<th style="text-align: right;">Tannarxi</th>',
  '<th style="text-align: right;">{{ \'products.costPrice\' | translate }}</th>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('products.component.ts updated!');
