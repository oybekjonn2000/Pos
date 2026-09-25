const fs = require('fs');
const path = require('path');

// 1. Update mobile/waiter-pos/www/index.html
const mHtmlFile = path.join(__dirname, '../mobile/waiter-pos/www/index.html');
let mHtml = fs.readFileSync(mHtmlFile, 'utf8');

const svgBell = '<svg class="pos-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
const svgClose = '<svg class="pos-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const svgCloseLg = '<svg class="pos-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const svgUtensils = '<svg class="pos-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path><path d="M15 2v20"></path><path d="M6 2v7a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"></path><path d="M9 12v10"></path></svg>';
const svgWarn = '<svg class="pos-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
const svgArrowRight = '<svg class="pos-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
const svgCog = '<svg class="pos-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
const svgChef = '<svg class="pos-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>';
const svgRefresh = '<svg class="pos-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
const svgDoor = '<svg class="pos-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';

mHtml = mHtml.replace('<div class="banner-bell">🔔</div>', `<div class="banner-bell">${svgBell}</div>`);
mHtml = mHtml.replace('<button type="button" class="banner-close" onclick="event.stopPropagation(); app.dismissReadyBanner()">✕</button>', `<button type="button" class="banner-close" onclick="event.stopPropagation(); app.dismissReadyBanner()">${svgClose}</button>`);
mHtml = mHtml.replace('<div class="brand-icon">🍽️</div>', `<div class="brand-icon">${svgUtensils}</div>`);
mHtml = mHtml.replace(/<span>⚠️<\/span>/g, `<span>${svgWarn}</span>`);
mHtml = mHtml.replace('<span id="btnConnectText">Ulanish ➔</span>', `<span id="btnConnectText">Ulanish ${svgArrowRight}</span>`);
mHtml = mHtml.replace('<button class="icon-btn" onclick="app.showScreen(\'screenConnect\')" title="Server sozlamalari">⚙️</button>', `<button class="icon-btn" onclick="app.showScreen('screenConnect')" title="Server sozlamalari">${svgCog}</button>`);
mHtml = mHtml.replace('<h2 class="waiters-section-title">👨‍🍳 Ofitsiantni tanlang</h2>', `<h2 class="waiters-section-title">${svgChef} Ofitsiantni tanlang</h2>`);
mHtml = mHtml.replace(/🔔<span id="readyBadgeCount"/g, `${svgBell}<span id="readyBadgeCount"`);
mHtml = mHtml.replace('<button class="icon-btn" onclick="app.loadTables()" title="Yangilash">🔄</button>', `<button class="icon-btn" onclick="app.loadTables()" title="Yangilash">${svgRefresh}</button>`);
mHtml = mHtml.replace('<button class="icon-btn" onclick="app.logoutWaiter()" title="Chiqish">🚪</button>', `<button class="icon-btn" onclick="app.logoutWaiter()" title="Chiqish">${svgDoor}</button>`);
mHtml = mHtml.replace('<button class="sheet-close" onclick="app.closeOrderModal()">✕</button>', `<button class="sheet-close" onclick="app.closeOrderModal()">${svgCloseLg}</button>`);
mHtml = mHtml.replace('<span>Oshxonaga Yuborish ➔</span>', `<span>Oshxonaga Yuborish ${svgArrowRight}</span>`);
mHtml = mHtml.replace('<button type="button" class="sheet-close" onclick="app.closeCancelItemModal()">✕</button>', `<button type="button" class="sheet-close" onclick="app.closeCancelItemModal()">${svgCloseLg}</button>`);
mHtml = mHtml.replace('<div class="sheet-title">🔔 Oshxonada tayyor taomlar</div>', `<div class="sheet-title">${svgBell} Oshxonada tayyor taomlar</div>`);
mHtml = mHtml.replace('<button type="button" class="sheet-close" onclick="app.closeReadyDishesModal()">✕</button>', `<button type="button" class="sheet-close" onclick="app.closeReadyDishesModal()">${svgCloseLg}</button>`);

fs.writeFileSync(mHtmlFile, mHtml, 'utf8');
console.log('Updated mobile index.html');

// 2. Update mobile/waiter-pos/www/js/app.js
const mJsFile = path.join(__dirname, '../mobile/waiter-pos/www/js/app.js');
let mJs = fs.readFileSync(mJsFile, 'utf8');

// Insert svg helper method into app object if not present
if (!mJs.includes('svgIcon(')) {
  mJs = mJs.replace(
    'const app = {',
    `const app = {
  svgIcon(name, size = 16) {
    const icons = {
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
      check: '<polyline points="20 6 9 17 4 12"></polyline>',
      'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
      x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
      'x-circle': '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
      'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      globe: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
      'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
      utensils: '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path><path d="M15 2v20"></path><path d="M6 2v7a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"></path><path d="M9 12v10"></path>'
    };
    const body = icons[name] || icons.check;
    return '<svg class="pos-icon" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">' + body + '</svg>';
  },`
  );
}

mJs = mJs.replace("if (type === 'success') icon = '✅';", "if (type === 'success') icon = this.svgIcon('check-circle', 18);");
mJs = mJs.replace("if (type === 'error') icon = '❌';", "if (type === 'error') icon = this.svgIcon('x-circle', 18);");
mJs = mJs.replace("btnText.textContent = 'Ulanish ➔';", "btnText.innerHTML = 'Ulanish ' + this.svgIcon('arrow-right', 14);");
mJs = mJs.replace("<div style=\"font-size: 36px; margin-bottom: 8px;\">👥</div>", `<div style="font-size: 36px; margin-bottom: 8px;">\${this.svgIcon('users', 44)}</div>`);
mJs = mJs.replace("<span>🌐</span> Barchasi", `<span>\${this.svgIcon('globe', 14)}</span> Barchasi`);
mJs = mJs.replace("<span>📍</span> \${z.name}", `<span>\${this.svgIcon('map-pin', 14)}</span> \${z.name}`);
mJs = mJs.replace("statusBadge = '<span class=\"item-status-pill status--ready\">Tayyor! 🔔</span>';", `statusBadge = '<span class="item-status-pill status--ready">Tayyor! ' + this.svgIcon('bell', 13) + '</span>';`);
mJs = mJs.replace("🍽️ \${it.productName || it.name}", `\${this.svgIcon('utensils', 14)} \${it.productName || it.name}`);
mJs = mJs.replace("❌ Bekor", `\${this.svgIcon('x', 13)} Bekor`);
mJs = mJs.replace("➕ \${item.name}", `\${this.svgIcon('plus', 13)} \${item.name}`);
mJs = mJs.replace("submitBtn.innerHTML = '<span>Oshxonaga Yuborish ➔</span>';", "submitBtn.innerHTML = '<span>Oshxonaga Yuborish ' + this.svgIcon('arrow-right', 14) + '</span>';");
mJs = mJs.replace("🍽️ \${item.productName}", `\${this.svgIcon('utensils', 14)} \${item.productName}`);
mJs = mJs.replace("Yetkazildi ✅", `Yetkazildi \${this.svgIcon('check', 14)}`);
mJs = mJs.replace(
  /<button class="cart-btn-plus" onclick="app\.incrementCart\(\${idx}\)">\+<\/button>/g,
  '<button class="cart-btn-plus" onclick="app.incrementCart(${idx})">+</button>'
);
mJs = mJs.replace(
  /<button class="cart-btn-plus" onclick="app\.incrementCart\(\${idx}\)">➕<\/button>/g,
  '<button class="cart-btn-plus" onclick="app.incrementCart(${idx})">+</button>'
);

fs.writeFileSync(mJsFile, mJs, 'utf8');
console.log('Updated mobile app.js');

// 3. Update desktop/electron/splash.html
const splashFile = path.join(__dirname, '../desktop/electron/splash.html');
let splash = fs.readFileSync(splashFile, 'utf8');
splash = splash.replace(
  '<div class="logo-icon">🍽️</div>',
  `<div class="logo-icon">
      <svg class="pos-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--icon-color, #A9BCE6);">
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
        <path d="M15 2v20"></path>
        <path d="M6 2v7a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"></path>
        <path d="M9 12v10"></path>
      </svg>
    </div>`
);
fs.writeFileSync(splashFile, splash, 'utf8');
console.log('Updated desktop splash.html');
