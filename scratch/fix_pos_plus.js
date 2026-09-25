const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/angular-pos/src/app/orders/pos/pos.component.ts');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\u2795/g, '<app-icon name="plus" [size]="16"></app-icon>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed plus emoji in pos.component.ts');
