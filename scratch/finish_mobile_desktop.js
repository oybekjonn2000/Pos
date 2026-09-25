const fs = require('fs');
const path = require('path');

// 1. mobile/waiter-pos/www/js/app.js
const appJsPath = path.join(__dirname, '../mobile/waiter-pos/www/js/app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace(
  `              <button type="button" class="btn-item-add" onclick="app.quickAddMore('\${it.productId || it.id}')" title="Yana 1 ta qo‘shish">\n                ➕\n              </button>`,
  `              <button type="button" class="btn-item-add" onclick="app.quickAddMore('\${it.productId || it.id}')" title="Yana 1 ta qo‘shish">\n                \${this.svgIcon('plus', 13)}\n              </button>`
);
fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Cleaned last emoji from waiter app.js');

// 2. desktop/electron/main.js
const mainJsPath = path.join(__dirname, '../desktop/electron/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');
mainJs = mainJs.replace("label: '🍽️ Restaurant POS Server',", "label: 'Restaurant POS Server',");
mainJs = mainJs.replace("label: '🖥️ Dasturni ochish',", "label: 'Dasturni ochish',");
mainJs = mainJs.replace("label: `📊 Server holati:", "label: `Server holati:");
mainJs = mainJs.replace("label: '🔄 Serverni qayta ishga tushirish',", "label: 'Serverni qayta ishga tushirish',");
mainJs = mainJs.replace("label: '❌ Dasturni butunlay yopish',", "label: 'Dasturni butunlay yopish',");
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('Cleaned tray menu emojis from electron main.js');
