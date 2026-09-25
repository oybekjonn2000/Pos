const fs = require('fs');

// 1. login.component.ts
const loginPath = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/auth/login/login.component.ts';
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Replace top nav
loginContent = loginContent.replace(
  '<span class="back-text">Bosh sahifa</span>',
  '<span class="back-text">{{ \'common.back\' | translate }}</span>'
);

const oldTopTheme = `<div class="theme-switcher"
               [title]="theme.isDark() ? 'Kunduzgi rejimga o‘tish (Light)' : 'Tungi rejimga o‘tish (Dark)'"
               (click)="theme.toggleTheme()">
            <button type="button" class="theme-btn" [class.active]="!theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('light')" title="Light Theme">
              <app-icon name="sun" [size]="14"></app-icon> Light
            </button>
            <button type="button" class="theme-btn" [class.active]="theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('dark')" title="Dark Theme">
              <app-icon name="moon" [size]="14"></app-icon> Dark
            </button>
          </div>`;

const newTopTheme = `<div style="display: flex; align-items: center; gap: 12px;">
            <app-language-selector></app-language-selector>
            <div class="theme-switcher"
                 [title]="theme.isDark() ? 'Kunduzgi rejimga o‘tish (Light)' : 'Tungi rejimga o‘tish (Dark)'"
                 (click)="theme.toggleTheme()">
              <button type="button" class="theme-btn" [class.active]="!theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('light')" title="Light Theme">
                <app-icon name="sun" [size]="14"></app-icon> Light
              </button>
              <button type="button" class="theme-btn" [class.active]="theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('dark')" title="Dark Theme">
                <app-icon name="moon" [size]="14"></app-icon> Dark
              </button>
            </div>
          </div>`;

loginContent = loginContent.replace(oldTopTheme, newTopTheme);
if (!loginContent.includes('<app-language-selector></app-language-selector>')) {
  loginContent = loginContent.replace(oldTopTheme.replace(/\n/g, '\r\n'), newTopTheme.replace(/\n/g, '\r\n'));
}

// In terminal header
loginContent = loginContent.replace(
  '<div class="terminal-brand-right">\r\n              <div class="lan-pill"',
  '<div class="terminal-brand-right">\r\n              <app-language-selector></app-language-selector>\r\n              <div class="lan-pill"'
);
loginContent = loginContent.replace(
  '<div class="terminal-brand-right">\n              <div class="lan-pill"',
  '<div class="terminal-brand-right">\n              <app-language-selector></app-language-selector>\n              <div class="lan-pill"'
);

fs.writeFileSync(loginPath, loginContent, 'utf8');

// 2. register.component.ts
const registerPath = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/auth/register/register.component.ts';
let registerContent = fs.readFileSync(registerPath, 'utf8');

const regHeader = `<div class="register-header">
          <div class="brand-badge"`;
const regHeaderWithLang = `<div class="register-header">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <app-language-selector></app-language-selector>
          </div>
          <div class="brand-badge"`;

registerContent = registerContent.replace(regHeader, regHeaderWithLang);
if (!registerContent.includes('<app-language-selector></app-language-selector>')) {
  registerContent = registerContent.replace(regHeader.replace(/\n/g, '\r\n'), regHeaderWithLang.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(registerPath, registerContent, 'utf8');
console.log('Fixed language selectors in login and register!');
