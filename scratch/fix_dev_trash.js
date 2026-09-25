const fs = require('fs');

let dev = fs.readFileSync('frontend/angular-pos/src/app/platform/devices/platform-devices.component.ts', 'utf8');
dev = dev.replace(/title="Qurilmani o'chirish \(Unbind\)">[\s\r\n]*🗑️[\s\r\n]*<\/button>/g, 'title="Qurilmani o\'chirish (Unbind)">\n                      <app-icon name="trash" [size]="14"></app-icon>\n                    </button>');
fs.writeFileSync('frontend/angular-pos/src/app/platform/devices/platform-devices.component.ts', dev, 'utf8');
console.log('Fixed dev delete button');
