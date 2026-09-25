const fs = require('fs');
const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/settings/settings.component.ts';

let content = fs.readFileSync(path, 'utf8');

// 1. Update SettingsCategory type
content = content.replace(
  "type SettingsCategory = \r\n  | 'RESTAURANT'\r\n  | 'GENERAL'",
  "type SettingsCategory = \r\n  | 'RESTAURANT'\r\n  | 'GENERAL'\r\n  | 'LANGUAGE'"
);
if (!content.includes("'LANGUAGE'")) {
  content = content.replace(
    "type SettingsCategory = \n  | 'RESTAURANT'\n  | 'GENERAL'",
    "type SettingsCategory = \n  | 'RESTAURANT'\n  | 'GENERAL'\n  | 'LANGUAGE'"
  );
}

// 2. Add LANGUAGE to nav in template
const navTargetUz = `<button class="nav-item" [class.active]="activeCategory() === 'GENERAL'" (click)="setCategory('GENERAL')">
            <span class="nav-icon"><app-icon name="globe" [size]="18"></app-icon></span>
            <span class="nav-label">Umumiy sozlamalar</span>
          </button>`;

const navReplacement = `<button class="nav-item" [class.active]="activeCategory() === 'GENERAL'" (click)="setCategory('GENERAL')">
            <span class="nav-icon"><app-icon name="settings" [size]="18"></app-icon></span>
            <span class="nav-label">{{ 'settings.general' | translate }}</span>
          </button>
          <button class="nav-item highlight-lang" [class.active]="activeCategory() === 'LANGUAGE'" (click)="setCategory('LANGUAGE')">
            <span class="nav-icon"><app-icon name="globe" [size]="18"></app-icon></span>
            <span class="nav-label">{{ 'settings.languageSection' | translate }}</span>
            <span class="nav-badge lang-badge">{{ i18n.currentLang().toUpperCase() }}</span>
          </button>`;

if (content.includes(navTargetUz)) {
  content = content.replace(navTargetUz, navReplacement);
} else {
  // Try CRLF / LF agnostic replace
  const regexNav = /<button class="nav-item" \[class\.active\]="activeCategory\(\) === 'GENERAL'" \(click\)="setCategory\('GENERAL'\)">\s*<span class="nav-icon"><app-icon name="globe" \[size\]="18"><\/app-icon><\/span>\s*<span class="nav-label">Umumiy sozlamalar<\/span>\s*<\/button>/;
  content = content.replace(regexNav, navReplacement);
}

// 3. Add LANGUAGE category section in template & update GENERAL section
const langSectionHtml = `
            <!-- LANGUAGE SETTINGS -->
            @if (activeCategory() === 'LANGUAGE') {
              <div class="category-card">
                <div class="card-header">
                  <h3><app-icon name="globe" [size]="20"></app-icon> {{ 'settings.languageSection' | translate }}</h3>
                  <p>{{ 'settings.languageSubtitle' | translate }}</p>
                </div>
                <div class="form-grid">
                  <div class="form-group span-2">
                    <label class="pos-field-label"><strong>{{ 'settings.selectLanguage' | translate }}</strong></label>
                    <div class="custom-lang-select-wrapper">
                      <select class="pos-select lang-dropdown-select" [ngModel]="i18n.currentLang()" (ngModelChange)="setAppLanguage($event)">
                        <option value="uz">🇺🇿 O‘zbekcha</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group span-2">
                    <div class="language-cards-container">
                      <div class="lang-card-item" [class.selected]="i18n.currentLang() === 'uz'" (click)="setAppLanguage('uz')">
                        <div class="lang-card-flag">🇺🇿</div>
                        <div class="lang-card-details">
                          <span class="lang-card-name">O‘zbekcha</span>
                          <span class="lang-card-desc">Birlamchi tizim tili (Standart)</span>
                        </div>
                        @if (i18n.currentLang() === 'uz') {
                          <span class="lang-check-badge"><app-icon name="check-circle" [size]="18"></app-icon></span>
                        }
                      </div>

                      <div class="lang-card-item" [class.selected]="i18n.currentLang() === 'ru'" (click)="setAppLanguage('ru')">
                        <div class="lang-card-flag">🇷🇺</div>
                        <div class="lang-card-details">
                          <span class="lang-card-name">Русский</span>
                          <span class="lang-card-desc">Русский интерфейс системы</span>
                        </div>
                        @if (i18n.currentLang() === 'ru') {
                          <span class="lang-check-badge"><app-icon name="check-circle" [size]="18"></app-icon></span>
                        }
                      </div>

                      <div class="lang-card-item" [class.selected]="i18n.currentLang() === 'en'" (click)="setAppLanguage('en')">
                        <div class="lang-card-flag">🇬🇧</div>
                        <div class="lang-card-details">
                          <span class="lang-card-name">English</span>
                          <span class="lang-card-desc">International English language</span>
                        </div>
                        @if (i18n.currentLang() === 'en') {
                          <span class="lang-check-badge"><app-icon name="check-circle" [size]="18"></app-icon></span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
`;

// Insert LANGUAGE category section right before <!-- 2. GENERAL SETTINGS -->
content = content.replace("<!-- 2. GENERAL SETTINGS -->", langSectionHtml + "\n            <!-- 2. GENERAL SETTINGS -->");

// Update the language dropdown in GENERAL settings
const generalLangTargetRegex = /<div class="form-group">\s*<label>Tizim tili<\/label>\s*<select class="pos-select" \[\(ngModel\)\]="general\.language">[\s\S]*?<\/select>\s*<\/div>/;
const generalLangReplacement = `<div class="form-group">
                    <label>{{ 'settings.languageSection' | translate }}</label>
                    <select class="pos-select" [ngModel]="i18n.currentLang()" (ngModelChange)="setAppLanguage($event)">
                      <option value="uz">🇺🇿 O‘zbekcha</option>
                      <option value="ru">🇷🇺 Русский</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>`;
content = content.replace(generalLangTargetRegex, generalLangReplacement);

// 4. Update saveActiveCategory to handle LANGUAGE
content = content.replace(
  "} else if (cat === 'GENERAL') {",
  "} else if (cat === 'LANGUAGE' || cat === 'GENERAL') {\n      this.general.language = this.i18n.currentLang();"
);

// 5. Add CSS styles
const stylesToAdd = `
    .lang-dropdown-select {
      font-size: 15px;
      font-weight: 600;
      padding: 10px 14px;
      cursor: pointer;
      width: 100%;
      border-radius: var(--radius-md, 8px);
    }
    .language-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 8px;
    }
    .lang-card-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-radius: var(--radius-lg, 12px);
      border: 2px solid var(--border);
      background: var(--bg-card);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .lang-card-item:hover {
      border-color: var(--primary, #2563eb);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .lang-card-item.selected {
      border-color: var(--primary, #2563eb);
      background: rgba(37, 99, 235, 0.08);
    }
    .lang-card-flag {
      font-size: 28px;
      line-height: 1;
    }
    .lang-card-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .lang-card-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .lang-card-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .lang-check-badge {
      color: var(--primary, #2563eb);
      display: flex;
      align-items: center;
    }
    .lang-badge {
      background: var(--primary, #2563eb);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
    }
`;

content = content.replace("styles: [`", "styles: [`" + stylesToAdd);

fs.writeFileSync(path, content, 'utf8');
console.log('settings.component.ts updated successfully!');
