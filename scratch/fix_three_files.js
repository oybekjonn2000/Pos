const fs = require('fs');
const path = require('path');

// 1. products.component.ts
const prodFile = path.join(__dirname, '../frontend/angular-pos/src/app/products/products.component.ts');
let prodContent = fs.readFileSync(prodFile, 'utf8');
prodContent = prodContent.replace(
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent],',
  'imports: [CommonModule, FormsModule, MatPaginatorModule, ExcelImportModalComponent, AppIconComponent],'
);
fs.writeFileSync(prodFile, prodContent, 'utf8');
console.log('Fixed products.component.ts imports');

// 2. landing.component.ts
const landFile = path.join(__dirname, '../frontend/angular-pos/src/app/public/landing/landing.component.ts');
let landContent = fs.readFileSync(landFile, 'utf8');
if (!landContent.includes("import { AppIconComponent }")) {
  landContent = "import { AppIconComponent } from '../../shared/components/icon/icon.component';\n" + landContent;
}

// Fix feature array to pure string[]
landContent = landContent.replace(
  /<li \[class\.feature-excluded\]="feat\.excluded">/g,
  '<li [class.feature-excluded]="feat.startsWith(\'- \')">'
);
landContent = landContent.replace(
  /<span class="check-icon"><app-icon \[name\]="feat\.excluded \? \'minus\' : \'check\'" \[size\]="14"><\/app-icon><\/span>/g,
  '<span class="check-icon"><app-icon [name]="feat.startsWith(\'- \') ? \'minus\' : \'check\'" [size]="14"></app-icon></span>'
);
landContent = landContent.replace(
  /\{\{\s*feat\.text\s*\|\|\s*feat\s*\}\}/g,
  "{{ feat.startsWith('- ') ? feat.substring(2) : feat }}"
);

landContent = landContent.replace(/\{\s*text:\s*'Oshxona Ekrani \(KDS\)',\s*excluded:\s*false\s*\}/g, "'Oshxona Ekrani (KDS)'");
landContent = landContent.replace(/\{\s*text:\s*'Mobil Ofitsiant Ilovasi',\s*excluded:\s*false\s*\}/g, "'Mobil Ofitsiant Ilovasi'");
landContent = landContent.replace(/\{\s*text:\s*'Oshxona Ekrani \(KDS\) kirmaydi',\s*excluded:\s*true\s*\}/g, "'- Oshxona Ekrani (KDS) kirmaydi'");
landContent = landContent.replace(/\{\s*text:\s*'Mobil Ofitsiant ilovasi kirmaydi',\s*excluded:\s*true\s*\}/g, "'- Mobil Ofitsiant ilovasi kirmaydi'");

fs.writeFileSync(landFile, landContent, 'utf8');
console.log('Fixed landing.component.ts');

// 3. pricing.component.ts
const priceFile = path.join(__dirname, '../frontend/angular-pos/src/app/public/pricing/pricing.component.ts');
let priceContent = fs.readFileSync(priceFile, 'utf8');
if (!priceContent.includes("import { AppIconComponent }")) {
  priceContent = "import { AppIconComponent } from '../../shared/components/icon/icon.component';\n" + priceContent;
}

priceContent = priceContent.replace(
  /<li \[class\.feature-excluded\]="feat\.excluded">/g,
  '<li [class.feature-excluded]="feat.startsWith(\'- \')">'
);
priceContent = priceContent.replace(
  /<span class="check-icon"><app-icon \[name\]="feat\.excluded \? \'minus\' : \'check\'" \[size\]="14"><\/app-icon><\/span>/g,
  '<span class="check-icon"><app-icon [name]="feat.startsWith(\'- \') ? \'minus\' : \'check\'" [size]="14"></app-icon></span>'
);
priceContent = priceContent.replace(
  /\{\{\s*feat\.text\s*\|\|\s*feat\s*\}\}/g,
  "{{ feat.startsWith('- ') ? feat.substring(2) : feat }}"
);

priceContent = priceContent.replace(/\{\s*text:\s*'Oshxona Ekrani \(KDS - Kitchen Display System\)',\s*excluded:\s*false\s*\}/g, "'Oshxona Ekrani (KDS - Kitchen Display System)'");
priceContent = priceContent.replace(/\{\s*text:\s*'Mobil Ofitsiant Ilovasi \(Android planshet \/ telefon\)',\s*excluded:\s*false\s*\}/g, "'Mobil Ofitsiant Ilovasi (Android planshet / telefon)'");
priceContent = priceContent.replace(/\{\s*text:\s*'Oshxona Ekrani \(KDS\) kirmaydi',\s*excluded:\s*true\s*\}/g, "'- Oshxona Ekrani (KDS) kirmaydi'");
priceContent = priceContent.replace(/\{\s*text:\s*'Mobil Ofitsiant ilovasi kirmaydi',\s*excluded:\s*true\s*\}/g, "'- Mobil Ofitsiant ilovasi kirmaydi'");

fs.writeFileSync(priceFile, priceContent, 'utf8');
console.log('Fixed pricing.component.ts');
