const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/angular-pos/src/app/orders/orders-list/orders-list.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add AppIconComponent to imports
if (!content.includes('AppIconComponent')) {
  content = content.replace(
    "import { NotificationService } from '../../core/services/notification.service';",
    "import { NotificationService } from '../../core/services/notification.service';\nimport { AppIconComponent } from '../../shared/components/icon/icon.component';"
  );
  content = content.replace(
    "imports: [CommonModule, FormsModule, RouterModule, MatPaginatorModule],",
    "imports: [CommonModule, FormsModule, RouterModule, MatPaginatorModule, AppIconComponent],"
  );
}

// 2. Replace header icons
content = content.replace('<h1 class="page-title">📋 Buyurtmalar & Kassa</h1>', '<h1 class="page-title"><app-icon name="orders" [size]="24"></app-icon> Buyurtmalar & Kassa</h1>');
content = content.replace('<span class="search-icon">🔍</span>', '<span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>');
content = content.replace('<span [class.spinning]="loading">🔄</span>', '<app-icon name="refresh" [size]="16" [class.spinning]="loading"></app-icon>');
content = content.replace('<span>➕ Joylar va Stollar</span>', '<span><app-icon name="plus" [size]="16"></app-icon> Joylar va Stollar</span>');

// 3. Filter tabs
content = content.replace("🔒 Yopilgan / To'lov Kutilmoqda", "<app-icon name=\"lock\" [size=\"14\"></app-icon> Yopilgan / To'lov Kutilmoqda");
content = content.replace("📁 Buyurtma Tarixi", "<app-icon name=\"scroll\" [size=\"14\"></app-icon> Buyurtma Tarixi");

// 4. History filter bar
content = content.replace('<span class="filter-label">📅 Sana:</span>', '<span class="filter-label"><app-icon name="clock" [size]="14"></app-icon> Sana:</span>');
content = content.replace('<span class="filter-label">💳 To\'lov turi:</span>', '<span class="filter-label"><app-icon name="credit-card" [size]="14"></app-icon> To\'lov turi:</span>');
content = content.replace('>💵 Naqd</button>', '><app-icon name="cash" [size]="14"></app-icon> Naqd</button>');
content = content.replace('>💳 Karta</button>', '><app-icon name="credit-card" [size]="14"></app-icon> Karta</button>');
content = content.replace('>📝 Qarz</button>', '><app-icon name="file-text" [size]="14"></app-icon> Qarz</button>');
content = content.replace('<span class="filter-label">🪑 Stol:</span>', '<span class="filter-label"><app-icon name="tables" [size]="14"></app-icon> Stol:</span>');

// 5. Empty state
content = content.replace('<div class="empty-icon">📂</div>', '<div class="empty-icon"><app-icon name="orders" [size]="48"></app-icon></div>');

// 6. Map pin
content = content.replaceAll("📍 {{ order.zoneName", "<app-icon name=\"map-pin\" [size]=\"14\"></app-icon> {{ order.zoneName");
content = content.replaceAll("📍 {{ selectedOrder.zoneName", "<app-icon name=\"map-pin\" [size]=\"14\"></app-icon> {{ selectedOrder.zoneName");

// 7. Actions in table
content = content.replaceAll("👁️ Ko'rish", "<app-icon name=\"eye\" [size]=\"14\"></app-icon> Ko'rish");
content = content.replaceAll("💳 To'lov qilish", "<app-icon name=\"credit-card\" [size]=\"14\"></app-icon> To'lov qilish");
content = content.replaceAll("🧾 Chek", "<app-icon name=\"receipt\" [size]=\"14\"></app-icon> Chek");
content = content.replace('title="Bekor qilish"\n                        (click)="openCancelOrderModal(order, $event)">\n                        ❌', 'title="Bekor qilish"\n                        (click)="openCancelOrderModal(order, $event)">\n                        <app-icon name="close" [size]="14"></app-icon>');

// 8. Payment method badge
content = content.replace(
  "{{ order.paymentMethod === 'CARD' ? '💳 Karta' : (order.paymentMethod === 'DEBT' ? '📝 Qarz' : '💵 Naqd') }}",
  "{{ order.paymentMethod === 'CARD' ? 'Karta' : (order.paymentMethod === 'DEBT' ? 'Qarz' : 'Naqd') }}"
);
content = content.replace(
  "<strong>{{ selectedOrder.paymentMethod === 'CARD' ? '💳 Karta' : '💵 Naqd' }}</strong>",
  "<strong>{{ selectedOrder.paymentMethod === 'CARD' ? 'Karta' : 'Naqd' }}</strong>"
);

// 9. Table breakdown
content = content.replace('💵 {{ historyOrdersCashSum | number:\'1.0-0\' }}', '<app-icon name="cash" [size]="12"></app-icon> {{ historyOrdersCashSum | number:\'1.0-0\' }}');
content = content.replace('💳 {{ historyOrdersCardSum | number:\'1.0-0\' }}', '<app-icon name="credit-card" [size]="12"></app-icon> {{ historyOrdersCardSum | number:\'1.0-0\' }}');

// 10. Summary chips
content = content.replace("{{ activeTab === 'PAID' ? '📁 Yopilgan buyurtmalar:' : '📋 Faol buyurtmalar:' }}", "{{ activeTab === 'PAID' ? 'Yopilgan buyurtmalar:' : 'Faol buyurtmalar:' }}");
content = content.replace('<span class="chip-label">🍽️ Taomlar soni:</span>', '<span class="chip-label"><app-icon name="products" [size]="14"></app-icon> Taomlar soni:</span>');
content = content.replace('<span class="chip-label">💵 Naqd:</span>', '<span class="chip-label"><app-icon name="cash" [size]="14"></app-icon> Naqd:</span>');
content = content.replace('<span class="chip-label">💳 Karta:</span>', '<span class="chip-label"><app-icon name="credit-card" [size]="14"></app-icon> Karta:</span>');

// 11. Modal details
content = content.replace('📁 TARIXIY BUYURTMA (FAQAT KO‘RISH)', '<app-icon name="scroll" [size]="16"></app-icon> TARIXIY BUYURTMA (FAQAT KO‘RISH)');
content = content.replaceAll('<button class="close-btn" (click)="closeModals()">✕</button>', '<button class="close-btn" (click)="closeModals()"><app-icon name="close" [size]="16"></app-icon></button>');
content = content.replace('💬 Izoh: {{ selectedOrder.notes }}', '<app-icon name="file-text" [size]="14"></app-icon> Izoh: {{ selectedOrder.notes }}');
content = content.replace('⚠️ Sabab: <em>{{ item.voidReason || \'Mijoz rad etdi\' }}</em>', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> Sabab: <em>{{ item.voidReason || \'Mijoz rad etdi\' }}</em>');
content = content.replaceAll('🚫 Bekor qilish', '<app-icon name="ban" [size]="14"></app-icon> Bekor qilish');
content = content.replace('🚫 Butun buyurtmani bekor qilish', '<app-icon name="ban" [size]="14"></app-icon> Butun buyurtmani bekor qilish');
content = content.replace('🔒 Tarixdagi yopilgan buyurtma faqat ko‘rish uchun. Stolga yoki oshxonaga qaytarilmaydi.', '<app-icon name="lock" [size]="14"></app-icon> Tarixdagi yopilgan buyurtma faqat ko‘rish uchun. Stolga yoki oshxonaga qaytarilmaydi.');
content = content.replace('🔒 Hisob yopilgan. Kassadan to\'lov qabul qilinishi kutilmoqda.', '<app-icon name="lock" [size]="14"></app-icon> Hisob yopilgan. Kassadan to\'lov qabul qilinishi kutilmoqda.');
content = content.replace('🧾 Chekni ko\'rish / Chop etish', '<app-icon name="receipt" [size]="14"></app-icon> Chekni ko\'rish / Chop etish');
content = content.replace('🔒 Hisobni yopish', '<app-icon name="lock" [size]="14"></app-icon> Hisobni yopish');
content = content.replace('💳 TO‘LOV QILISH', '<app-icon name="credit-card" [size]="14"></app-icon> TO‘LOV QILISH');
content = content.replace('💳 TO‘LANGAN', 'TO‘LANGAN');

// 12. Payment Modal
content = content.replace('<h2 class="modal-title">💳 To\'lovni qabul qilish</h2>', '<h2 class="modal-title"><app-icon name="credit-card" [size]="20"></app-icon> To\'lovni qabul qilish</h2>');
content = content.replace('<span class="icon">💵</span>', '<span class="icon"><app-icon name="cash" [size]="20"></app-icon></span>');
content = content.replace('<span class="icon">💳</span>', '<span class="icon"><app-icon name="credit-card" [size]="20"></app-icon></span>');
content = content.replace('<span class="icon">📝</span>', '<span class="icon"><app-icon name="file-text" [size]="20"></app-icon></span>');
content = content.replace('⚠️ Berilgan summa yetarli emas', '<app-icon name="alert-triangle" [size]="14" class="icon--warning"></app-icon> Berilgan summa yetarli emas');
content = content.replace('<div class="card-icon">💳</div>', '<div class="card-icon"><app-icon name="credit-card" [size]="32"></app-icon></div>');
content = content.replace('<span class="alert-icon">⚠️</span>', '<span class="alert-icon"><app-icon name="alert-triangle" [size]="16" class="icon--warning"></app-icon></span>');
content = content.replace("(payMethod === 'DEBT' ? '📝 Qarzni rasmiylashtirish' : '✅ To‘lovni tasdiqlash')", "(payMethod === 'DEBT' ? 'Qarzni rasmiylashtirish' : 'To‘lovni tasdiqlash')");

// 13. Receipt & Cancel Modals
content = content.replace('<h2 class="modal-title">🧾 Chek Chop Etish</h2>', '<h2 class="modal-title"><app-icon name="receipt" [size]="20"></app-icon> Chek Chop Etish</h2>');
content = content.replaceAll('🖨️ Chop etish (Print)', '<app-icon name="printer" [size]="16"></app-icon> Chop etish (Print)');
content = content.replace('🖨️ Chekni chiqarish (Print)', '<app-icon name="printer" [size]="16"></app-icon> Chekni chiqarish (Print)');
content = content.replace('🚫 {{ isFullOrderCancel ? "Buyurtmani to\'liq bekor qilish" : "Mahsulotni bekor qilish" }}', '<app-icon name="ban" [size]="18"></app-icon> {{ isFullOrderCancel ? "Buyurtmani to\'liq bekor qilish" : "Mahsulotni bekor qilish" }}');
content = content.replaceAll('<button class="close-btn" (click)="closeCancelModal()">✕</button>', '<button class="close-btn" (click)="closeCancelModal()"><app-icon name="close" [size]="16"></app-icon></button>');
content = content.replaceAll('<button class="close-btn" (click)="showCancelReceiptModal = false">✕</button>', '<button class="close-btn" (click)="showCancelReceiptModal = false"><app-icon name="close" [size]="16"></app-icon></button>');
content = content.replace('⚠️ <strong>DIQQAT:</strong>', '<app-icon name="alert-triangle" [size]="16" class="icon--warning"></app-icon> <strong>DIQQAT:</strong>');
content = content.replace('ℹ️ Qisman bekor qilish:', '<app-icon name="info" [size]="14"></app-icon> Qisman bekor qilish:');
content = content.replace('<span>⚠️ {{ isFullOrderCancel ? "HA, BUTUN BUYURTMANI BEKOR QILISH" : "BEKOR QILISHNI TASDIQLASH" }}</span>', '<span><app-icon name="alert-triangle" [size]="16" class="icon--warning"></app-icon> {{ isFullOrderCancel ? "HA, BUTUN BUYURTMANI BEKOR QILISH" : "BEKOR QILISHNI TASDIQLASH" }}</span>');
content = content.replace('<h2 class="modal-title">🧾 Bekor qilish cheki</h2>', '<h2 class="modal-title"><app-icon name="receipt" [size]="20"></app-icon> Bekor qilish cheki</h2>');

// 14. Helper methods status labels
content = content.replace("case 'CLOSED': return '🔒 YOPILGAN';", "case 'CLOSED': return 'YOPILGAN';");
content = content.replace("case 'OPEN': return '🟡 OCHIQ';", "case 'OPEN': return 'OCHIQ';");
content = content.replace("case 'DRAFT': return '⚪ QORALAMA';", "case 'DRAFT': return 'QORALAMA';");
content = content.replace("case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';", "case 'SENT_TO_KITCHEN': return 'OSHXONADA';");
content = content.replace("case 'COOKING': return '🟠 TAYYORLANMOQDA';", "case 'COOKING': return 'TAYYORLANMOQDA';");
content = content.replace("case 'READY': return '🟢 TAYYOR';", "case 'READY': return 'TAYYOR';");
content = content.replace("case 'PAID': return '💳 TO‘LANGAN';", "case 'PAID': return 'TO‘LANGAN';");
content = content.replace("case 'COMPLETED': return '✅ YAKUNLANGAN';", "case 'COMPLETED': return 'YAKUNLANGAN';");
content = content.replace("case 'CANCELLED': return '🔴 BEKOR QILINDI';", "case 'CANCELLED': return 'BEKOR QILINDI';");

content = content.replace("if (item.voided || item.kitchenStatus === 'CANCELLED') return '🔴 BEKOR QILINDI';", "if (item.voided || item.kitchenStatus === 'CANCELLED') return 'BEKOR QILINDI';");
content = content.replace("case 'NEW': return '🟡 YANGI';", "case 'NEW': return 'YANGI';");
content = content.replace("case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';", "case 'SENT_TO_KITCHEN': return 'OSHXONADA';");
content = content.replace("case 'ACCEPTED': return '🟣 QABUL QILINDI';", "case 'ACCEPTED': return 'QABUL QILINDI';");
content = content.replace("case 'COOKING': return '🟠 TAYYORLANMOQDA';", "case 'COOKING': return 'TAYYORLANMOQDA';");
content = content.replace("case 'READY': return '🟢 TAYYOR';", "case 'READY': return 'TAYYOR';");
content = content.replace("case 'SERVED': return '✅ TARQATILDI';", "case 'SERVED': return 'TARQATILDI';");
content = content.replace("default: return `🟡 ${st}`;", "default: return st;");

content = content.replace("return '🟢 TO‘LANGAN';", "return 'TO‘LANGAN';");
content = content.replace("return '🟠 TO‘LANMAGAN';", "return 'TO‘LANMAGAN';");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated orders-list.component.ts');
