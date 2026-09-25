const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/angular-pos/src/app/orders/orders-list/orders-list.component.ts');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\u274C/g, '<app-icon name="close" [size]="14"></app-icon>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ❌ in orders-list.component.ts');
