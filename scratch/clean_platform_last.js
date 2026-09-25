const fs = require('fs');

let dev = fs.readFileSync('frontend/angular-pos/src/app/platform/devices/platform-devices.component.ts', 'utf8');
dev = dev.replace(/title="O'chirish">[\s\r\n]*🗑️[\s\r\n]*<\/button>/g, 'title="O\'chirish"><app-icon name="trash" [size]="14"></app-icon></button>');
fs.writeFileSync('frontend/angular-pos/src/app/platform/devices/platform-devices.component.ts', dev, 'utf8');

let rest = fs.readFileSync('frontend/angular-pos/src/app/platform/restaurants/restaurants.component.ts', 'utf8');
rest = rest.replace(/🟢 Faol/g, 'Faol');
fs.writeFileSync('frontend/angular-pos/src/app/platform/restaurants/restaurants.component.ts', rest, 'utf8');

let subs = fs.readFileSync('frontend/angular-pos/src/app/platform/subscriptions/platform-subscriptions.component.ts', 'utf8');
subs = subs.replace(/💬 "{{ req\.clientNotes }}"/g, '<app-icon name="message-square" [size]="14"></app-icon> "{{ req.clientNotes }}"');
fs.writeFileSync('frontend/angular-pos/src/app/platform/subscriptions/platform-subscriptions.component.ts', subs, 'utf8');

console.log('Fixed last 3 platform emojis');
