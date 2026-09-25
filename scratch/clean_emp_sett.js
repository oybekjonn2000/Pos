const fs = require('fs');

let emp = fs.readFileSync('frontend/angular-pos/src/app/employees/employees.component.ts', 'utf8');
emp = emp.replace(/title="Xodimni nofaol qilish"[\s\r\n]+\(click\)="toggleActive\(emp\)">[\s\r\n]+🚫/g, 'title="Xodimni nofaol qilish"\n                      (click)="toggleActive(emp)">\n                      <app-icon name="slash" [size]="14"></app-icon>');
fs.writeFileSync('frontend/angular-pos/src/app/employees/employees.component.ts', emp, 'utf8');

let sett = fs.readFileSync('frontend/angular-pos/src/app/settings/settings.component.ts', 'utf8');
sett = sett.replace(/<button class="toast-close" \(click\)="clearTestResult\(\)">✕<\/button>/g, '<button class="toast-close" (click)="clearTestResult()"><app-icon name="x" [size]="14"></app-icon></button>');
fs.writeFileSync('frontend/angular-pos/src/app/settings/settings.component.ts', sett, 'utf8');

console.log('Fixed employees and settings last emojis!');
