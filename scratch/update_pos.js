const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/angular-pos/src/app/orders/pos/pos.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add AppIconComponent to imports
if (!content.includes('AppIconComponent')) {
  content = content.replace(
    "import { NotificationService } from '../../core/services/notification.service';",
    "import { NotificationService } from '../../core/services/notification.service';\nimport { AppIconComponent } from '../../shared/components/icon/icon.component';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, RouterModule],",
    "imports: [CommonModule, FormsModule, RouterModule, AppIconComponent],"
  );
}

// 2. Replace topbar & header
content = content.replace('⬅ Stollar', '<app-icon name="arrow-left" [size]="16"></app-icon> Stollar');
content = content.replace('<span class="table-badge__icon">🪑</span>', '<span class="table-badge__icon"><app-icon name="tables" [size]="16"></app-icon></span>');
content = content.replace('Stol tanlang ➜', 'Stol tanlang <app-icon name="arrow-right" [size]="14"></app-icon>');
content = content.replace('<span class="search-icon">🔍</span>', '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
content = content.replace('🍽️ Barcha Oshxonalar', '<app-icon name="restaurant" [size]="16"></app-icon> Barcha Oshxonalar');

// 3. Cart & buttons
content = content.replace('<span>➕</span>', '<app-icon name="plus" [size]="16"></app-icon>');
content = content.replace('🛒 {{ totalCartItemsCount() }} ta taom', '<app-icon name="cart" [size]="18"></app-icon> {{ totalCartItemsCount() }} ta taom');
content = content.replace('✕ Yopish', '<app-icon name="close" [size]="16"></app-icon> Yopish');
content = content.replace('<span>🛍 Olib Ketish</span>', '<span><app-icon name="shopping-bag" [size]="16"></app-icon> Olib Ketish</span>');
content = content.replace('<span>🛒 Buyurtma</span>', '<span><app-icon name="cart" [size]="16"></app-icon> Buyurtma</span>');
content = content.replace('📋 Partiyalar', '<app-icon name="orders" [size]="16"></app-icon> Partiyalar');
content = content.replace('<div class="cart-empty__icon">📋</div>', '<div class="cart-empty__icon"><app-icon name="orders" [size]="48"></app-icon></div>');

// 4. Cart items actions
content = content.replace('<div class="void-reason-tag">⚠️ {{ item.voidReason }}</div>', '<div class="void-reason-tag"><app-icon name="alert-triangle" [size]="12" class="icon--warning"></app-icon> {{ item.voidReason }}</div>');
content = content.replace('✕ O\'chirish', '<app-icon name="close" [size]="14"></app-icon> O\'chirish');
content = content.replaceAll('🚫 Bekor qilish', '<app-icon name="ban" [size]="14"></app-icon> Bekor qilish');
content = content.replace('<span>❌ Bekor qilingan ({{ item.quantity }} ta)</span>', '<span><app-icon name="close" [size]="14" class="icon--danger"></app-icon> Bekor qilingan ({{ item.quantity }} ta)</span>');
content = content.replace('👨‍🍳 Oshxonaga', '<app-icon name="chef" [size]="16"></app-icon> Oshxonaga');
content = content.replace('🔒 HISOBNI YOPISH', '<app-icon name="lock" [size]="16"></app-icon> HISOBNI YOPISH');

// 5. Modals
content = content.replace('<span style="font-size: 20px;">🚫</span>', '<app-icon name="ban" [size]="24" class="icon--danger"></app-icon>');
content = content.replace('<button class="modal-close" (click)="closeCancelModal()">✕</button>', '<button class="modal-close" (click)="closeCancelModal()"><app-icon name="close" [size]="16"></app-icon></button>');
content = content.replace('<h3>📦 Oshxona Partiyalari Tarixi (Order Rounds)</h3>', '<h3><app-icon name="products" [size]="18"></app-icon> Oshxona Partiyalari Tarixi (Order Rounds)</h3>');
content = content.replace('<button class="modal-close" (click)="showRoundsModal.set(false)">✕</button>', '<button class="modal-close" (click)="showRoundsModal.set(false)"><app-icon name="close" [size]="16"></app-icon></button>');
content = content.replace("'🔔 Partiya #'", "'Partiya #'");
content = content.replace('<span>🕒 Yuborilgan: {{ formatBatchTime(b.sentAt || b.createdAt) }}</span>', '<span><app-icon name="clock" [size]="12"></app-icon> Yuborilgan: {{ formatBatchTime(b.sentAt || b.createdAt) }}</span>');
content = content.replace('<span> • 🏷️ {{ b.kitchenName }}</span>', '<span> • <app-icon name="tag" [size]="12"></app-icon> {{ b.kitchenName }}</span>');

// In cancel reasons modal template: replace reason.icon display if it uses plain text
content = content.replace('<span class="reason-icon">{{ r.icon }}</span>', '<span class="reason-icon"><app-icon [name]="r.icon" [size]="20"></app-icon></span>');

// 6. Cancel reasons definitions
content = content.replace("icon: '🙅‍♂️'", "icon: 'ban'");
content = content.replace("icon: '⚠️'", "icon: 'alert-triangle'");
content = content.replace("icon: '⏳'", "icon: 'hourglass'");
content = content.replace("icon: '📦'", "icon: 'products'");
content = content.replace("icon: '👨‍🍳'", "icon: 'chef'");
content = content.replace("icon: '✍️'", "icon: 'file-edit'");

// 7. Kitchen icon helper
content = content.replace("if (!code) return '👨‍🍳';", "if (!code) return 'chef';");
content = content.replace("case 'PALOV': case 'PALOVCHI': return '🥘';", "case 'PALOV': case 'PALOVCHI': return 'cooking-pot';");
content = content.replace("case 'SOMSA': case 'SOMSAPAZ': return '🥟';", "case 'SOMSA': case 'SOMSAPAZ': return 'products';");
content = content.replace("case 'BAR': return '🍹';", "case 'BAR': return 'products';");
content = content.replace("case 'PIZZA': case 'PITSA': return '🍕';", "case 'PIZZA': case 'PITSA': return 'products';");
content = content.replace("case 'MAIN': case 'MAIN_KITCHEN': return '👨‍🍳';", "case 'MAIN': case 'MAIN_KITCHEN': return 'chef';");
content = content.replace("default: return '🍳';", "default: return 'chef';");

// 8. Kitchen status labels
content = content.replace("if (item.voided || item.kitchenStatus === 'CANCELLED') return '🔴 BEKOR QILINDI';", "if (item.voided || item.kitchenStatus === 'CANCELLED') return 'BEKOR QILINDI';");
content = content.replace("if (sent === 0) return '🟡 YANGI';", "if (sent === 0) return 'YANGI';");
content = content.replace("if (rem > 0) return `🔵 ${sent}/${item.quantity} OSHXONADA (+${rem} YANGI)`;", "if (rem > 0) return `${sent}/${item.quantity} OSHXONADA (+${rem} YANGI)`;");
content = content.replace("case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';", "case 'SENT_TO_KITCHEN': return 'OSHXONADA';");
content = content.replace("case 'ACCEPTED': return '🟣 QABUL QILINDI';", "case 'ACCEPTED': return 'QABUL QILINDI';");
content = content.replace("case 'COOKING': return '🟠 TAYYORLANMOQDA';", "case 'COOKING': return 'TAYYORLANMOQDA';");
content = content.replace("case 'READY': return '🟢 TAYYOR';", "case 'READY': return 'TAYYOR';");
content = content.replace("case 'SERVED': return '✅ TARQATILDI';", "case 'SERVED': return 'TARQATILDI';");
content = content.replace("default: return '🔵 OSHXONADA';", "default: return 'OSHXONADA';");

// 9. Toast notification messages
content = content.replace("? '🛍 Olib ketish buyurtmasi oshxonaga yuborildi!'", "? 'Olib ketish buyurtmasi oshxonaga yuborildi!'");
content = content.replace(": '👨‍🍳 Buyurtma oshxonaga yuborildi va stol band qilindi!';", ": 'Buyurtma oshxonaga yuborildi va stol band qilindi!';");

content = content.replace("case 'NEW': return '🟡 YANGI';", "case 'NEW': return 'YANGI';");
content = content.replace("case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';", "case 'SENT_TO_KITCHEN': return 'OSHXONADA';");
content = content.replace("case 'ACCEPTED': return '🟣 QABUL QILINDI';", "case 'ACCEPTED': return 'QABUL QILINDI';");
content = content.replace("case 'COOKING': return '🟠 TAYYORLANMOQDA';", "case 'COOKING': return 'TAYYORLANMOQDA';");
content = content.replace("case 'READY': return '🟢 TAYYOR';", "case 'READY': return 'TAYYOR';");
content = content.replace("case 'SERVED': return '✅ TARQATILDI';", "case 'SERVED': return 'TARQATILDI';");
content = content.replace("case 'CANCELLED': return '🔴 BEKOR QILINDI';", "case 'CANCELLED': return 'BEKOR QILINDI';");

// Also check where getKitchenIcon is used in template:
// <span class="kitchen-tab-icon">{{ getKitchenIcon(k.code) }}</span> -> <span class="kitchen-tab-icon"><app-icon [name]="getKitchenIcon(k.code)" [size]="16"></app-icon></span>
content = content.replace(
  '{{ getKitchenIcon(k.code) }}',
  '<app-icon [name]="getKitchenIcon(k.code)" [size]="16"></app-icon>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated pos.component.ts');
