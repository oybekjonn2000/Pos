const fs = require('fs');
const path = require('path');

// 1. landing.component.ts
const landingFile = path.join(__dirname, '../frontend/angular-pos/src/app/public/landing/landing.component.ts');
let landingContent = fs.readFileSync(landingFile, 'utf8');

if (!landingContent.includes('AppIconComponent')) {
  landingContent = landingContent.replace(
    "import { Component, inject }",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, inject }"
  );
  landingContent = landingContent.replace(
    "imports: [CommonModule, RouterLink]",
    "imports: [CommonModule, RouterLink, AppIconComponent]"
  );
}

landingContent = landingContent.replace(/<span class="brand-icon">🍽️<\/span>/g, '<span class="brand-icon"><app-icon name="utensils" [size]="28"></app-icon></span>');
landingContent = landingContent.replace(/{{ theme\.isDark\(\) \? \'☀️\' : \'🌙\' }}/g, '<app-icon [name]="theme.isDark() ? \'sun\' : \'moon\'" [size]="16"></app-icon>');
landingContent = landingContent.replace(/🚀 15 kun bepul boshlash/g, '<app-icon name="zap" [size]="16"></app-icon> 15 kun bepul boshlash');
landingContent = landingContent.replace(/💳 Tariflarni ko'rish/g, '<app-icon name="credit-card" [size]="16"></app-icon> Tariflarni ko\'rish');

landingContent = landingContent.replace(/<div class="feature-icon icon-blue">📱<\/div>/g, '<div class="feature-icon"><app-icon name="smartphone" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-amber">👨‍🍳<\/div>/g, '<div class="feature-icon"><app-icon name="chef" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-green">💵<\/div>/g, '<div class="feature-icon"><app-icon name="dollar-sign" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-purple">📦<\/div>/g, '<div class="feature-icon"><app-icon name="package" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-emerald">🖨️<\/div>/g, '<div class="feature-icon"><app-icon name="printer" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-indigo">🌐<\/div>/g, '<div class="feature-icon"><app-icon name="globe" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-rose">👥<\/div>/g, '<div class="feature-icon"><app-icon name="users" [size]="28"></app-icon></div>');
landingContent = landingContent.replace(/<div class="feature-icon icon-violet">📊<\/div>/g, '<div class="feature-icon"><app-icon name="bar-chart" [size]="28"></app-icon></div>');

landingContent = landingContent.replace(/🪑 Stollar: <strong class="text-success">♾️ Cheksiz<\/strong>/g, '<app-icon name="grid" [size]="14"></app-icon> Stollar: <strong class="text-success">Cheksiz</strong>');
landingContent = landingContent.replace(/👥 Xodimlar: <strong class="text-success">♾️ Cheksiz<\/strong>/g, '<app-icon name="users" [size]="14"></app-icon> Xodimlar: <strong class="text-success">Cheksiz</strong>');
landingContent = landingContent.replace(/🍔 Mahsulotlar: <strong class="text-success">♾️ Cheksiz<\/strong>/g, '<app-icon name="utensils" [size]="14"></app-icon> Mahsulotlar: <strong class="text-success">Cheksiz</strong>');
landingContent = landingContent.replace(/🍳 Oshxonalar: <strong class="text-success">♾️ Cheksiz<\/strong>/g, '<app-icon name="chef" [size]="14"></app-icon> Oshxonalar: <strong class="text-success">Cheksiz</strong>');

landingContent = landingContent.replace(/<li \[class\.feature-excluded\]="feat\.startsWith\('❌'\)">/g, '<li [class.feature-excluded]="feat.excluded">');
landingContent = landingContent.replace(/<span class="check-icon">{{ feat\.startsWith\('❌'\) \? '—' : '✓' }}<\/span>/g, '<span class="check-icon"><app-icon [name]="feat.excluded ? \'minus\' : \'check\'" [size]="14"></app-icon></span>');

landingContent = landingContent.replace(/🚀 Restoranni ro'yxatdan o'tkazish/g, '<app-icon name="zap" [size]="16"></app-icon> Restoranni ro\'yxatdan o\'tkazish');
landingContent = landingContent.replace(/🔑 Tizimga kirish/g, '<app-icon name="key" [size]="16"></app-icon> Tizimga kirish');

// Feature items string replacements
landingContent = landingContent.replace(/'✅ Oshxona Ekrani \(KDS\)'/g, "{ text: 'Oshxona Ekrani (KDS)', excluded: false }");
landingContent = landingContent.replace(/'✅ Mobil Ofitsiant Ilovasi'/g, "{ text: 'Mobil Ofitsiant Ilovasi', excluded: false }");
landingContent = landingContent.replace(/'❌ Oshxona Ekrani \(KDS\) kirmaydi'/g, "{ text: 'Oshxona Ekrani (KDS) kirmaydi', excluded: true }");
landingContent = landingContent.replace(/'❌ Mobil Ofitsiant ilovasi kirmaydi'/g, "{ text: 'Mobil Ofitsiant ilovasi kirmaydi', excluded: true }");
landingContent = landingContent.replace(/{{ feat }}/g, "{{ feat.text || feat }}");

fs.writeFileSync(landingFile, landingContent, 'utf8');
console.log('Updated landing.component.ts');

// 2. pricing.component.ts
const pricingFile = path.join(__dirname, '../frontend/angular-pos/src/app/public/pricing/pricing.component.ts');
let pricingContent = fs.readFileSync(pricingFile, 'utf8');

if (!pricingContent.includes('AppIconComponent')) {
  pricingContent = pricingContent.replace(
    "import { Component, inject }",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, inject }"
  );
  pricingContent = pricingContent.replace(
    "imports: [CommonModule, RouterLink]",
    "imports: [CommonModule, RouterLink, AppIconComponent]"
  );
}

pricingContent = pricingContent.replace(/<span class="brand-icon">🍽️<\/span>/g, '<span class="brand-icon"><app-icon name="utensils" [size]="28"></app-icon></span>');
pricingContent = pricingContent.replace(/✨ O'zbekiston bo'ylab 500\+ restoranlar ishonchi/g, '<app-icon name="sparkles" [size]="14"></app-icon> O\'zbekiston bo\'ylab 500+ restoranlar ishonchi');
pricingContent = pricingContent.replace(/♾️ Cheksiz/g, 'Cheksiz');
pricingContent = pricingContent.replace(/<span class="limit-icon">👥<\/span>/g, '<span class="limit-icon"><app-icon name="users" [size]="14"></app-icon></span>');
pricingContent = pricingContent.replace(/<span class="limit-icon">🍔<\/span>/g, '<span class="limit-icon"><app-icon name="utensils" [size]="14"></app-icon></span>');
pricingContent = pricingContent.replace(/<span class="limit-icon">🍳<\/span>/g, '<span class="limit-icon"><app-icon name="chef" [size]="14"></app-icon></span>');

pricingContent = pricingContent.replace(/<li \[class\.feature-excluded\]="feat\.startsWith\('❌'\)">/g, '<li [class.feature-excluded]="feat.excluded">');
pricingContent = pricingContent.replace(/<span class="check-icon">{{ feat\.startsWith\('❌'\) \? '—' : '✓' }}<\/span>/g, '<span class="check-icon"><app-icon [name]="feat.excluded ? \'minus\' : \'check\'" [size]="14"></app-icon></span>');

pricingContent = pricingContent.replace(/<div class="feature-box__icon">⚡<\/div>/g, '<div class="feature-box__icon"><app-icon name="zap" [size]="24"></app-icon></div>');
pricingContent = pricingContent.replace(/<div class="feature-box__icon">👨‍🍳<\/div>/g, '<div class="feature-box__icon"><app-icon name="chef" [size]="24"></app-icon></div>');
pricingContent = pricingContent.replace(/<div class="feature-box__icon">📊<\/div>/g, '<div class="feature-box__icon"><app-icon name="bar-chart" [size]="24"></app-icon></div>');
pricingContent = borderBox = pricingContent.replace(/<div class="feature-box__icon">🔒<\/div>/g, '<div class="feature-box__icon"><app-icon name="lock" [size]="24"></app-icon></div>');

pricingContent = pricingContent.replace(/'✅ Oshxona Ekrani \(KDS - Kitchen Display System\)'/g, "{ text: 'Oshxona Ekrani (KDS - Kitchen Display System)', excluded: false }");
pricingContent = pricingContent.replace(/'✅ Mobil Ofitsiant Ilovasi \(Android planshet \/ telefon\)'/g, "{ text: 'Mobil Ofitsiant Ilovasi (Android planshet / telefon)', excluded: false }");
pricingContent = pricingContent.replace(/'❌ Oshxona Ekrani \(KDS\) kirmaydi'/g, "{ text: 'Oshxona Ekrani (KDS) kirmaydi', excluded: true }");
pricingContent = pricingContent.replace(/'❌ Mobil Ofitsiant ilovasi kirmaydi'/g, "{ text: 'Mobil Ofitsiant ilovasi kirmaydi', excluded: true }");
pricingContent = pricingContent.replace(/{{ feat }}/g, "{{ feat.text || feat }}");

fs.writeFileSync(pricingFile, pricingContent, 'utf8');
console.log('Updated pricing.component.ts');
