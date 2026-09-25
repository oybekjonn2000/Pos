const fs = require('fs');
const path = require('path');

// 1. login.component.ts
const loginFile = path.join(__dirname, '../frontend/angular-pos/src/app/auth/login/login.component.ts');
let loginContent = fs.readFileSync(loginFile, 'utf8');

if (!loginContent.includes('AppIconComponent')) {
  loginContent = loginContent.replace(
    "import { Component, OnInit",
    "import { AppIconComponent } from '../../shared/components/icon/icon.component';\nimport { Component, OnInit"
  );
  loginContent = loginContent.replace(
    "imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink]",
    "imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, AppIconComponent]"
  );
}

loginContent = loginContent.replace(/<span>☀<\/span> Light/g, '<app-icon name="sun" [size]="14"></app-icon> Light');
loginContent = loginContent.replace(/<span>🌙<\/span> Dark/g, '<app-icon name="moon" [size]="14"></app-icon> Dark');
loginContent = loginContent.replace(/<div class="terminal-brand-logo">🍽️<\/div>/g, '<div class="terminal-brand-logo"><app-icon name="utensils" [size]="28"></app-icon></div>');
loginContent = loginContent.replace(/<span class="lan-cog">⚙️<\/span>/g, '<span class="lan-cog"><app-icon name="settings" [size]="16"></app-icon></span>');
loginContent = loginContent.replace(/<span>{{ theme\.isDark\(\) \? \'🌙\' : \'☀️\' }}<\/span>/g, '<app-icon [name]="theme.isDark() ? \'moon\' : \'sun\'" [size]="16"></app-icon>');
loginContent = loginContent.replace(/<span>🔌<\/span> Ajratish/g, '<app-icon name="link" [size]="14"></app-icon> Ajratish');

loginContent = loginContent.replace(/<h1 class="staff-title">👨‍🍳/g, '<h1 class="staff-title"><app-icon name="chef" [size]="22"></app-icon>');
loginContent = loginContent.replace(/<span class="staff-search-icon">🔍<\/span>/g, '<span class="staff-search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
loginContent = loginContent.replace(/<button class="clear-search-btn" \(click\)="employeeSearchQuery\.set\(\'\'\)">✕<\/button>/g, '<button class="clear-search-btn" (click)="employeeSearchQuery.set(\'\')"><app-icon name="x" [size]="14"></app-icon></button>');

loginContent = loginContent.replace(/🤵 Ofitsiantlar/g, '<app-icon name="users" [size]="14"></app-icon> Ofitsiantlar');
loginContent = loginContent.replace(/💵 Kassirlar/g, '<app-icon name="credit-card" [size]="14"></app-icon> Kassirlar');
loginContent = loginContent.replace(/👨‍🍳 Oshpazlar/g, '<app-icon name="chef" [size]="14"></app-icon> Oshpazlar');
loginContent = loginContent.replace(/👑 Adminlar/g, '<app-icon name="shield" [size]="14"></app-icon> Adminlar');

loginContent = loginContent.replace(/<span class="staff-card-pin-only">🔢 PIN orqali<\/span>/g, '<span class="staff-card-pin-only"><app-icon name="hash" [size]="12"></app-icon> PIN orqali</span>');
loginContent = loginContent.replace(/<span class="tap-hint">Tanlash ➔<\/span>/g, '<span class="tap-hint">Tanlash <app-icon name="arrow-right" [size]="12"></app-icon></span>');
loginContent = loginContent.replace(/<div class="empty-icon">👥<\/div>/g, '<div class="empty-icon"><app-icon name="users" [size]="48"></app-icon></div>');
loginContent = loginContent.replace(/<button class="pin-modal-close" \(click\)="closeEmployeePasswordModal\(\)">✕<\/button>/g, '<button class="pin-modal-close" (click)="closeEmployeePasswordModal()"><app-icon name="x" [size]="18"></app-icon></button>');

loginContent = loginContent.replace(/🔢 PIN orqali/g, '<app-icon name="hash" [size]="14"></app-icon> PIN orqali');
loginContent = loginContent.replace(/🔑 Login va Parol/g, '<app-icon name="key" [size]="14"></app-icon> Login va Parol');
loginContent = loginContent.replace(/<span class="pin-error-icon">⚠️<\/span>/g, '<span class="pin-error-icon"><app-icon name="alert-triangle" [size]="16"></app-icon></span>');

loginContent = loginContent.replace(/Kirish ➔/g, 'Kirish <app-icon name="arrow-right" [size]="14"></app-icon>');
loginContent = loginContent.replace(/<div class="login-logo">🍽️<\/div>/g, '<div class="login-logo"><app-icon name="utensils" [size]="28"></app-icon></div>');
loginContent = loginContent.replace(/<div class="login-logo" routerLink="\/" style="cursor: pointer;" title="Bosh sahifaga o\'tish">🍽️<\/div>/g, '<div class="login-logo" routerLink="/" style="cursor: pointer;" title="Bosh sahifaga o\'tish"><app-icon name="utensils" [size]="28"></app-icon></div>');
loginContent = loginContent.replace(/<button type="button" class="btn-server-cog">⚙️ IP Sozlash<\/button>/g, '<button type="button" class="btn-server-cog"><app-icon name="settings" [size]="14"></app-icon> IP Sozlash</button>');
loginContent = loginContent.replace(/<div class="login-error-text">❌ {{ desktopActivateError\(\) }}<\/div>/g, '<div class="login-error-text"><app-icon name="alert-triangle" [size]="14"></app-icon> {{ desktopActivateError() }}</div>');
loginContent = loginContent.replace(/⚡ Restoranga Biriktirish va Kirish/g, '<app-icon name="zap" [size]="14"></app-icon> Restoranga Biriktirish va Kirish');
loginContent = loginContent.replace(/🔒 JOWI POS Architecture • Device Terminal Binding/g, '<app-icon name="lock" [size]="12"></app-icon> JOWI POS Architecture • Device Terminal Binding');

loginContent = loginContent.replace(/{{ showPassword\(\) \? \'👁️\' : \'👁️‍🗨️\' }}/g, '<app-icon [name]="showPassword() ? \'eye\' : \'eye-off\'" [size]="16"></app-icon>');
loginContent = loginContent.replace(/<div class="blocked-icon">🔒<\/div>/g, '<div class="blocked-icon"><app-icon name="lock" [size]="32"></app-icon></div>');
loginContent = loginContent.replace(/<div class="login-error-text">❌ {{ errorMessage\(\) }}<\/div>/g, '<div class="login-error-text"><app-icon name="alert-triangle" [size]="14"></app-icon> {{ errorMessage() }}</div>');

loginContent = loginContent.replace(/<span class="quick-icon">{{ acc\.icon }}<\/span>/g, '<span class="quick-icon"><app-icon [name]="acc.icon" [size]="20"></app-icon></span>');
loginContent = loginContent.replace(/<span class="quick-badge-arrow">⚡<\/span>/g, '<span class="quick-badge-arrow"><app-icon name="zap" [size]="12"></app-icon></span>');

// quickAccounts icon keys
loginContent = loginContent.replace("icon: '🌐',", "icon: 'globe',");
loginContent = loginContent.replace("icon: '👑',", "icon: 'shield',");
loginContent = loginContent.replace("icon: '🍽️',", "icon: 'utensils',");
loginContent = loginContent.replace("icon: '🍽️',", "icon: 'utensils',");
loginContent = loginContent.replace("icon: '🍕',", "icon: 'chef',");
loginContent = loginContent.replace("icon: '🥟',", "icon: 'chef',");

fs.writeFileSync(loginFile, loginContent, 'utf8');
console.log('Updated login.component.ts');

// 2. register.component.ts
const registerFile = path.join(__dirname, '../frontend/angular-pos/src/app/auth/register/register.component.ts');
let regContent = fs.readFileSync(registerFile, 'utf8');

if (!regContent.includes('AppIconComponent')) {
  regContent = regContent.replace(
    "import { Component } from '@angular/core';",
    "import { Component } from '@angular/core';\nimport { AppIconComponent } from '../../shared/components/icon/icon.component';"
  );
  regContent = regContent.replace(
    "imports: [CommonModule, ReactiveFormsModule, RouterLink]",
    "imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent]"
  );
}

regContent = regContent.replace(/<span class="brand-icon">🍽️<\/span>/g, '<span class="brand-icon"><app-icon name="utensils" [size]="28"></app-icon></span>');
regContent = regContent.replace(/<span class="alert-icon">⚠️<\/span>/g, '<span class="alert-icon"><app-icon name="alert-triangle" [size]="16"></app-icon></span>');
regContent = regContent.replace(/🎉 Qaysi tarifni tanlashingizdan qat\'iy nazar/g, '<app-icon name="sparkles" [size]="16"></app-icon> Qaysi tarifni tanlashingizdan qat\'iy nazar');
regContent = regContent.replace(/♾️ Cheksiz/g, '<app-icon name="check" [size]="14"></app-icon> Cheksiz');
regContent = regContent.replace(/<span>🚀 Restoranni yaratish va POS\'dan foydalanish<\/span>/g, '<span><app-icon name="zap" [size]="16"></app-icon> Restoranni yaratish va POS\'dan foydalanish</span>');

fs.writeFileSync(registerFile, regContent, 'utf8');
console.log('Updated register.component.ts');
