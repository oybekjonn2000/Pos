const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/angular-pos/src/app/platform/restaurants/restaurant-detail/platform-restaurant-detail.component.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { AppIconComponent } from '../../../../shared/components/icon/icon.component';",
  "import { AppIconComponent } from '../../../shared/components/icon/icon.component';"
);
content = content.replace(
  'imports: [CommonModule, DecimalPipe, DatePipe, RouterLink],',
  'imports: [CommonModule, DecimalPipe, DatePipe, RouterLink, AppIconComponent],'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed platform-restaurant-detail.component.ts');
