const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/auth/register/register.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';\nimport { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';"
  );
  content = content.replace(
    "imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],",
    "imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent, TranslatePipe, LanguageSelectorComponent],"
  );
}

// 2. Add language selector to register header
const headerTarget = `<div class="register-header">
          <div class="brand-badge" routerLink="/">`;

const headerReplacement = `<div class="register-header">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <app-language-selector></app-language-selector>
          </div>
          <div class="brand-badge" routerLink="/">`;

if (content.includes(headerTarget)) {
  content = content.replace(headerTarget, headerReplacement);
}

// 3. Localize template strings
content = content.replace(
  '<h1 class="page-title">Restoran ochish va Ro\'yxatdan o\'tish</h1>',
  '<h1 class="page-title">{{ \'auth.register\' | translate }}</h1>'
);
content = content.replace(
  '<label for="restaurantName">Restoran nomi *</label>',
  '<label for="restaurantName">{{ \'auth.restaurantName\' | translate }} *</label>'
);
content = content.replace(
  '<label for="adminUsername">Admin logini *</label>',
  '<label for="adminUsername">{{ \'auth.username\' | translate }} *</label>'
);
content = content.replace(
  '<label for="adminPassword">Parol *</label>',
  '<label for="adminPassword">{{ \'auth.password\' | translate }} *</label>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('register.component.ts updated!');
