const fs = require('fs');
const path = require('path');

// 1. restaurants.component.ts
const restFile = path.join(__dirname, '../frontend/angular-pos/src/app/platform/restaurants/restaurants.component.ts');
let restContent = fs.readFileSync(restFile, 'utf8');
restContent = restContent.replace(
  'imports: [CommonModule, ReactiveFormsModule],',
  'imports: [CommonModule, ReactiveFormsModule, AppIconComponent],'
);
fs.writeFileSync(restFile, restContent, 'utf8');
console.log('Fixed restaurants.component.ts');

// 2. platform-sales.component.ts
const salesFile = path.join(__dirname, '../frontend/angular-pos/src/app/platform/sales/platform-sales.component.ts');
let salesContent = fs.readFileSync(salesFile, 'utf8');
salesContent = salesContent.replace(
  'imports: [CommonModule, FormsModule],',
  'imports: [CommonModule, FormsModule, AppIconComponent],'
);
fs.writeFileSync(salesFile, salesContent, 'utf8');
console.log('Fixed platform-sales.component.ts');

// 3. platform-subscriptions.component.ts
const subsFile = path.join(__dirname, '../frontend/angular-pos/src/app/platform/subscriptions/platform-subscriptions.component.ts');
let subsContent = fs.readFileSync(subsFile, 'utf8');
if (!subsContent.includes('import { AppIconComponent }')) {
  subsContent = "import { AppIconComponent } from '../../shared/components/icon/icon.component';\n" + subsContent;
  fs.writeFileSync(subsFile, subsContent, 'utf8');
}
console.log('Fixed platform-subscriptions.component.ts');
