const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/angular-pos/src/app/kitchen/kitchen-management/kitchen-management.component.ts');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\uD83D\uDDD1\uFE0F?/g, '<app-icon name="trash" [size]="14"></app-icon>');
content = content.replace('"➕ Oshpaz Biriktirish"', '"Oshpaz Biriktirish"');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed kitchen-management.component.ts remaining emojis');
