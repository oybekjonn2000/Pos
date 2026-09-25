const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/auth/login/login.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LanServerConfigModalComponent],',
  'imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LanServerConfigModalComponent, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed login.component.ts imports array');
