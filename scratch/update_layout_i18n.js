const fs = require('fs');
const path = require('path');

// 1. topbar.component.ts
const topbarFile = path.join(__dirname, '../frontend/angular-pos/src/app/layout/topbar/topbar.component.ts');
let topbar = fs.readFileSync(topbarFile, 'utf8');

if (!topbar.includes('LanguageSelectorComponent')) {
  topbar = topbar.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';\nimport { TranslationService } from '../../core/services/translation.service';"
  );
  topbar = topbar.replace(
    "imports: [CommonModule, DatePipe, AppIconComponent],",
    "imports: [CommonModule, DatePipe, AppIconComponent, LanguageSelectorComponent, TranslatePipe],"
  );
}

// Add Language selector right next to theme switcher in topbar__right
if (!topbar.includes('<app-language-selector')) {
  topbar = topbar.replace(
    '<!-- Theme Switcher (Light / Dark) -->',
    '<!-- Language Selector -->\n        <app-language-selector></app-language-selector>\n\n        <!-- Theme Switcher (Light / Dark) -->'
  );
}

// Inject TranslationService in constructor if not present
if (!topbar.includes('public i18n: TranslationService')) {
  topbar = topbar.replace(
    'constructor(',
    'constructor(public i18n: TranslationService, '
  );
}

fs.writeFileSync(topbarFile, topbar, 'utf8');
console.log('Updated topbar.component.ts with i18n and LanguageSelectorComponent');

// 2. sidebar.component.ts
const sidebarFile = path.join(__dirname, '../frontend/angular-pos/src/app/layout/sidebar/sidebar.component.ts');
let sidebar = fs.readFileSync(sidebarFile, 'utf8');

if (!sidebar.includes('TranslatePipe')) {
  sidebar = sidebar.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';"
  );
  sidebar = sidebar.replace(
    "imports: [RouterLink, RouterLinkActive, AppIconComponent],",
    "imports: [RouterLink, RouterLinkActive, AppIconComponent, TranslatePipe],"
  );
}

// Update NavItem interface to support key
if (!sidebar.includes('key?: string;')) {
  sidebar = sidebar.replace(
    'interface NavItem {\n  icon: string;\n  label: string;',
    'interface NavItem {\n  icon: string;\n  label: string;\n  key?: string;'
  );
}

// Update restaurantNavItems to include keys
sidebar = sidebar.replace(
  "{ icon: 'dashboard', label: 'Boshqaruv paneli', route: '/dashboard'",
  "{ icon: 'dashboard', label: 'Boshqaruv paneli', key: 'nav.dashboard', route: '/dashboard'"
);
sidebar = sidebar.replace(
  "{ icon: 'tables', label: 'Joylar va Stollar', route: '/tables'",
  "{ icon: 'tables', label: 'Joylar va Stollar', key: 'nav.tables', route: '/tables'"
);
sidebar = sidebar.replace(
  "{ icon: 'orders', label: 'Buyurtmalar', route: '/orders'",
  "{ icon: 'orders', label: 'Buyurtmalar', key: 'nav.orders', route: '/orders'"
);
sidebar = sidebar.replace(
  "{ icon: 'chef', label: 'Oshxona (KDS)', route: '/kitchen'",
  "{ icon: 'chef', label: 'Oshxona (KDS)', key: 'nav.kitchen', route: '/kitchen'"
);
sidebar = sidebar.replace(
  "{ icon: 'smartphone', label: 'Mobil Ofitsiant', route: '/devices'",
  "{ icon: 'smartphone', label: 'Mobil Ofitsiant', key: 'nav.pos', route: '/devices'"
);
sidebar = sidebar.replace(
  "{ icon: 'products', label: 'Mahsulotlar', route: '/products'",
  "{ icon: 'products', label: 'Mahsulotlar', key: 'nav.products', route: '/products'"
);
sidebar = sidebar.replace(
  "{ icon: 'folder', label: 'Kategoriyalar', route: '/categories'",
  "{ icon: 'folder', label: 'Kategoriyalar', key: 'nav.categories', route: '/categories'"
);
sidebar = sidebar.replace(
  "{ icon: 'cooking-pot', label: 'Oshxonalar', route: '/kitchens'",
  "{ icon: 'cooking-pot', label: 'Oshxonalar', key: 'nav.kitchenManagement', route: '/kitchens'"
);
sidebar = sidebar.replace(
  "{ icon: 'user', label: 'Xodimlar', route: '/employees'",
  "{ icon: 'user', label: 'Xodimlar', key: 'nav.employees', route: '/employees'"
);
sidebar = sidebar.replace(
  "{ icon: 'trending-up', label: 'Hisobotlar', route: '/reports'",
  "{ icon: 'trending-up', label: 'Hisobotlar', key: 'nav.reports', route: '/reports'"
);
sidebar = sidebar.replace(
  "{ icon: 'credit-card', label: 'Tarif & Billing', route: '/restaurant/billing'",
  "{ icon: 'credit-card', label: 'Tarif & Billing', key: 'nav.billing', route: '/restaurant/billing'"
);
sidebar = sidebar.replace(
  "{ icon: 'settings', label: 'Sozlamalar', route: '/settings'",
  "{ icon: 'settings', label: 'Sozlamalar', key: 'nav.settings', route: '/settings'"
);

// Update template to use translate pipe
sidebar = sidebar.replace(
  '<span class="sidebar__label">{{ item.label }}</span>',
  '<span class="sidebar__label">{{ item.key ? (item.key | translate) : item.label }}</span>'
);
sidebar = sidebar.replace(
  "[title]=\"collapsed() && !mobileOpen ? item.label : ''\"",
  "[title]=\"collapsed() && !mobileOpen ? (item.key ? (item.key | translate) : item.label) : ''\""
);
sidebar = sidebar.replace(
  '<span class="sidebar__logout-text">Chiqish</span>',
  '<span class="sidebar__logout-text">{{ \'nav.logout\' | translate }}</span>'
);

fs.writeFileSync(sidebarFile, sidebar, 'utf8');
console.log('Updated sidebar.component.ts with i18n keys and translate pipe');

// 3. shell.component.ts
const shellFile = path.join(__dirname, '../frontend/angular-pos/src/app/layout/shell/shell.component.ts');
let shell = fs.readFileSync(shellFile, 'utf8');

if (!shell.includes('TranslatePipe')) {
  shell = shell.replace(
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';\nimport { TranslatePipe } from '../../shared/pipes/translate.pipe';"
  );
  shell = shell.replace(
    "imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent, TopbarComponent, LanServerConfigModalComponent, AppIconComponent],",
    "imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent, TopbarComponent, LanServerConfigModalComponent, AppIconComponent, LanguageSelectorComponent, TranslatePipe],"
  );
}

// Update bottom navigation labels
shell = shell.replace('<span class="mobile-nav-label">Stollar</span>', '<span class="mobile-nav-label">{{ \'nav.tables\' | translate }}</span>');
shell = shell.replace('<span class="mobile-nav-label">Buyurtmalar</span>', '<span class="mobile-nav-label">{{ \'nav.orders\' | translate }}</span>');
shell = shell.replace('<span class="mobile-nav-label">Oshxona</span>', '<span class="mobile-nav-label">{{ \'nav.kitchen\' | translate }}</span>');
shell = shell.replace('<span class="mobile-nav-label">Asosiy</span>', '<span class="mobile-nav-label">{{ \'nav.dashboard\' | translate }}</span>');
shell = shell.replace('<span class="mobile-nav-label">Bo\'limlar</span>', '<span class="mobile-nav-label">{{ \'common.all\' | translate }}</span>');
shell = shell.replace('<span class="mobile-nav-label">Profil</span>', '<span class="mobile-nav-label">{{ \'nav.settings\' | translate }}</span>');

// Add Language selector in mobile profile sheet body
if (!shell.includes('<app-language-selector')) {
  shell = shell.replace(
    '<!-- Theme Toggle Row -->',
    `<!-- Language Row -->
            <div class="sheet-row" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border);">
              <span style="font-weight: 500; font-size: 14px;">{{ 'nav.language' | translate }}</span>
              <app-language-selector></app-language-selector>
            </div>

            <!-- Theme Toggle Row -->`
  );
}

fs.writeFileSync(shellFile, shell, 'utf8');
console.log('Updated shell.component.ts with i18n and LanguageSelectorComponent');
