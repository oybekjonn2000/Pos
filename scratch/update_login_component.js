const fs = require('fs');

const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/auth/login/login.component.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!content.includes('TranslatePipe')) {
  content = content.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';\nimport { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';"
  );
  content = content.replace(
    "imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LanServerConfigModalComponent, AppIconComponent],",
    "imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LanServerConfigModalComponent, AppIconComponent, TranslatePipe, LanguageSelectorComponent],"
  );
}

// 2. Add language selector to login top nav
const topNavTarget = `<div class="login-top-nav">
          <a routerLink="/" class="back-home-btn" title="Bosh sahifaga qaytish">
            <span class="back-arrow">←</span>
            <span class="back-text">Bosh sahifa</span>
          </a>`;

const topNavReplacement = `<div class="login-top-nav">
          <a routerLink="/" class="back-home-btn" title="Bosh sahifaga qaytish">
            <span class="back-arrow">←</span>
            <span class="back-text">{{ 'common.back' | translate }}</span>
          </a>
          <div style="display: flex; align-items: center; gap: 10px;">
            <app-language-selector></app-language-selector>`;

if (content.includes(topNavTarget)) {
  content = content.replace(topNavTarget, topNavReplacement);
  // close the div
  content = content.replace(
    `          </div>\n        </div>\n      }`,
    `          </div>\n          </div>\n        </div>\n      }`
  );
}

// 3. Add language selector to terminal header
const termRightTarget = `<div class="terminal-brand-right">
              <div class="lan-pill"`;

const termRightReplacement = `<div class="terminal-brand-right">
              <app-language-selector></app-language-selector>
              <div class="lan-pill"`;

if (content.includes(termRightTarget)) {
  content = content.replace(termRightTarget, termRightReplacement);
}

// 4. Form labels and text
content = content.replace(
  '<h2 class="login-card__title">Welcome back</h2>',
  '<h2 class="login-card__title">{{ \'auth.login\' | translate }}</h2>'
);
content = content.replace(
  '<p class="login-card__desc">Sign in to continue to your POS</p>',
  '<p class="login-card__desc">{{ \'auth.loginSubtitle\' | translate }}</p>'
);
content = content.replace(
  '<label class="form-label">Login, email yoki telefon</label>',
  '<label class="form-label">{{ \'auth.username\' | translate }}</label>'
);
content = content.replace(
  '<span class="form-error">Login kiritilishi shart</span>',
  '<span class="form-error">{{ \'validation.required\' | translate }}</span>'
);
content = content.replace(
  '<label class="form-label">Parol</label>',
  '<label class="form-label">{{ \'auth.password\' | translate }}</label>'
);
content = content.replace(
  '<span class="form-error">Parol kiritilishi shart</span>',
  '<span class="form-error">{{ \'validation.required\' | translate }}</span>'
);
content = content.replace(
  '<a routerLink="/register" class="register-prompt-link">Ro‘yxatdan o‘tish</a>',
  '<a routerLink="/register" class="register-prompt-link">{{ \'auth.register\' | translate }}</a>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('login.component.ts updated!');
