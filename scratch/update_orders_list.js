const fs = require('fs');
const path = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/orders/orders-list/orders-list.component.ts';

let content = fs.readFileSync(path, 'utf8');

// 1. Tab button: add Qarzlar tab button
const targetTab = `<app-icon name="scroll" [size]="14"></app-icon> {{ 'orders.orderHistory' | translate }} ({{ paidOrdersCount }})
          </button>
        </div>`;

const replaceTab = `<app-icon name="scroll" [size]="14"></app-icon> {{ 'orders.orderHistory' | translate }} ({{ paidOrdersCount }})
          </button>
          <button
            class="tab-btn tab-btn--debt"
            [class.active]="activeTab === 'DEBT'"
            (click)="setTab('DEBT')">
            <app-icon name="file-text" [size]="14"></app-icon> Qarzlar ({{ debtOrdersCount }})
          </button>
        </div>`;

if (content.includes(targetTab)) {
  content = content.replace(targetTab, replaceTab);
  console.log('Tab button updated');
} else {
  console.log('Target tab not found directly, trying normalized line endings');
  const normalized = targetTab.replace(/\r?\n/g, '\r\n');
  if (content.includes(normalized)) {
    content = content.replace(normalized, replaceTab.replace(/\r?\n/g, '\r\n'));
    console.log('Tab button updated with CRLF');
  } else {
    console.error('Failed to find targetTab');
  }
}

// 2. Table row payment column & settle button
const targetPaymentCol = `                      <span class="payment-method-badge" [class.badge-card]="order.paymentMethod === 'CARD'" [class.badge-debt]="order.paymentMethod === 'DEBT'" [class.badge-cash]="order.paymentMethod !== 'CARD' && order.paymentMethod !== 'DEBT'">
                        {{ order.paymentMethod === 'CARD' ? 'Karta' : (order.paymentMethod === 'DEBT' ? 'Qarz' : 'Naqd') }}
                      </span>
                      <span class="paid-sub-amount" *ngIf="order.paidAmount">
                        {{ order.paidAmount | number:'1.0-0' }} so'm
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="mobile-label">Xodimlar:</span>
                    <div class="staff-info">
                      <div class="staff-line"><span>Ofitsiant:</span> <strong>{{ order.waiterName || '—' }}</strong></div>
                      <div class="staff-line"><span>Kassir:</span> <strong>{{ order.cashierName || '—' }}</strong></div>
                    </div>
                  </td>
                  <td>
                    <span class="mobile-label">Holat:</span>
                    <span class="status-pill pill--paid">
                      TO‘LANGAN
                    </span>
                  </td>
                  <td class="actions-col">
                    <div class="action-buttons">
                      <button
                        class="pos-btn pos-btn--secondary pos-btn--sm"
                        title="Tafsilotlar (Faqat ko'rish)"
                        (click)="openDetailModal(order)">
                        <app-icon name="eye" [size]="14"></app-icon> Ko'rish
                      </button>
                      <button
                        class="pos-btn pos-btn--primary pos-btn--sm"
                        title="Chek chiqarish"
                        (click)="openReceiptModal(order)">
                        <app-icon name="receipt" [size]="14"></app-icon> Chek
                      </button>`;

const replacePaymentCol = `                      <span class="payment-method-badge" [class.badge-card]="order.paymentMethod === 'CARD'" [class.badge-debt]="order.paymentMethod === 'DEBT'" [class.badge-cash]="order.paymentMethod !== 'CARD' && order.paymentMethod !== 'DEBT'">
                        {{ order.paymentMethod === 'CARD' ? 'Karta' : (order.paymentMethod === 'DEBT' ? 'Qarz (Nasiya)' : 'Naqd') }}
                      </span>
                      <div class="debt-customer-mini" *ngIf="order.paymentMethod === 'DEBT' && (order.customerName || order.customerPhone)">
                        <span class="debt-c-name" *ngIf="order.customerName">
                          <app-icon name="user" [size]="11"></app-icon> <strong>{{ order.customerName }}</strong>
                        </span>
                        <span class="debt-c-phone" *ngIf="order.customerPhone">
                          <app-icon name="phone" [size]="10"></app-icon> {{ order.customerPhone }}
                        </span>
                        <span class="debt-c-due" *ngIf="order.debtDueDate">
                          <app-icon name="calendar" [size]="10"></app-icon> Muddat: {{ order.debtDueDate }}
                        </span>
                        <span class="debt-status-pill" [class.paid]="order.debtStatus === 'PAID'">
                          {{ order.debtStatus === 'PAID' ? 'To‘langan' : 'Ochiq qarz' }}
                        </span>
                      </div>
                      <span class="paid-sub-amount" *ngIf="order.paidAmount">
                        {{ order.paidAmount | number:'1.0-0' }} so'm
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="mobile-label">Xodimlar:</span>
                    <div class="staff-info">
                      <div class="staff-line"><span>Ofitsiant:</span> <strong>{{ order.waiterName || '—' }}</strong></div>
                      <div class="staff-line"><span>Kassir:</span> <strong>{{ order.cashierName || '—' }}</strong></div>
                    </div>
                  </td>
                  <td>
                    <span class="mobile-label">Holat:</span>
                    <span class="status-pill pill--paid" [style.background]="order.paymentMethod === 'DEBT' && order.debtStatus !== 'PAID' ? 'rgba(245, 158, 11, 0.15)' : ''" [style.color]="order.paymentMethod === 'DEBT' && order.debtStatus !== 'PAID' ? '#f59e0b' : ''">
                      {{ order.paymentMethod === 'DEBT' && order.debtStatus !== 'PAID' ? 'QARZDA' : 'TO‘LANGAN' }}
                    </span>
                  </td>
                  <td class="actions-col">
                    <div class="action-buttons">
                      <button
                        class="pos-btn pos-btn--secondary pos-btn--sm"
                        title="Tafsilotlar (Faqat ko'rish)"
                        (click)="openDetailModal(order)">
                        <app-icon name="eye" [size]="14"></app-icon> Ko'rish
                      </button>
                      <button
                        *ngIf="order.paymentMethod === 'DEBT' && order.debtStatus !== 'PAID'"
                        class="pos-btn pos-btn--warning pos-btn--sm"
                        title="Qarz to'langan deb belgilash"
                        (click)="settleDebt(order, $event)">
                        <app-icon name="check" [size]="13"></app-icon> Qarzni yopish
                      </button>
                      <button
                        class="pos-btn pos-btn--primary pos-btn--sm"
                        title="Chek chiqarish"
                        (click)="openReceiptModal(order)">
                        <app-icon name="receipt" [size]="14"></app-icon> Chek
                      </button>`;

function doReplace(t, r) {
  const normT = t.replace(/\r?\n/g, '\r\n');
  const normR = r.replace(/\r?\n/g, '\r\n');
  if (content.includes(normT)) {
    content = content.replace(normT, normR);
    return true;
  }
  const lfT = t.replace(/\r?\n/g, '\n');
  const lfR = r.replace(/\r?\n/g, '\n');
  if (content.includes(lfT)) {
    content = content.replace(lfT, lfR);
    return true;
  }
  return false;
}

if (doReplace(targetPaymentCol, replacePaymentCol)) {
  console.log('Payment col updated');
} else {
  console.error('Failed to update Payment col');
}

// 3. Footer breakdown & summary
const targetBreakdown = `<span *ngIf="historyOrdersCardSum > 0" class="breakdown-card"><app-icon name="credit-card" [size]="12"></app-icon> {{ historyOrdersCardSum | number:'1.0-0' }}</span>
                    </div>`;

const replaceBreakdown = `<span *ngIf="historyOrdersCardSum > 0" class="breakdown-card"><app-icon name="credit-card" [size]="12"></app-icon> {{ historyOrdersCardSum | number:'1.0-0' }}</span>
                      <span *ngIf="historyOrdersDebtSum > 0" class="breakdown-debt"><app-icon name="file-text" [size]="12"></app-icon> {{ historyOrdersDebtSum | number:'1.0-0' }}</span>
                    </div>`;

if (doReplace(targetBreakdown, replaceBreakdown)) {
  console.log('Breakdown updated');
} else {
  console.error('Failed to update breakdown');
}

// 4. Summary bar chips
const targetChips = `<div class="summary-stat-chip" *ngIf="activeTab === 'PAID' && historyOrdersCardSum > 0">
              <span class="chip-label"><app-icon name="credit-card" [size]="14"></app-icon> Karta:</span>
              <strong class="chip-value card-text">{{ historyOrdersCardSum | number:'1.0-0' }} so'm</strong>
            </div>
          </div>`;

const replaceChips = `<div class="summary-stat-chip" *ngIf="activeTab === 'PAID' && historyOrdersCardSum > 0">
              <span class="chip-label"><app-icon name="credit-card" [size]="14"></app-icon> Karta:</span>
              <strong class="chip-value card-text">{{ historyOrdersCardSum | number:'1.0-0' }} so'm</strong>
            </div>

            <div class="summary-stat-chip chip--debt" *ngIf="(activeTab === 'PAID' || activeTab === 'DEBT') && historyOrdersDebtSum > 0">
              <span class="chip-label"><app-icon name="file-text" [size]="14"></app-icon> Qarz (Nasiya):</span>
              <strong class="chip-value debt-text">{{ historyOrdersDebtSum | number:'1.0-0' }} so'm</strong>
            </div>
          </div>`;

if (doReplace(targetChips, replaceChips)) {
  console.log('Chips updated');
} else {
  console.error('Failed to update chips');
}

// 5. Order Detail Modal: Debt Details Card
const targetDetailMeta = `<div class="modal-body">
            <div class="detail-meta-grid">`;

const replaceDetailMeta = `<div class="modal-body">
            <!-- QARZ (NASIYA) TAFSILOTLARI BLOKI -->
            <div *ngIf="selectedOrder.paymentMethod === 'DEBT' || selectedOrder.customerName || selectedOrder.debtStatus" class="debt-details-card">
              <div class="debt-card-header">
                <div class="debt-card-title">
                  <app-icon name="file-text" [size]="18" class="icon--debt"></app-icon>
                  <strong>Qarz (Nasiya) ma'lumotlari</strong>
                </div>
                <span class="debt-badge-status" [class.badge-paid]="selectedOrder.debtStatus === 'PAID'">
                  {{ selectedOrder.debtStatus === 'PAID' ? 'TO‘LANGAN' : 'OCHIQ (TO‘LANMAGAN)' }}
                </span>
              </div>
              <div class="debt-info-grid">
                <div class="debt-info-item">
                  <span class="debt-info-label"><app-icon name="user" [size]="13"></app-icon> Mijoz (Qarzdor):</span>
                  <strong class="debt-info-value">{{ selectedOrder.customerName || '—' }}</strong>
                </div>
                <div class="debt-info-item">
                  <span class="debt-info-label"><app-icon name="phone" [size]="13"></app-icon> Telefon raqami:</span>
                  <strong class="debt-info-value">{{ selectedOrder.customerPhone || '—' }}</strong>
                </div>
                <div class="debt-info-item">
                  <span class="debt-info-label"><app-icon name="credit-card" [size]="13"></app-icon> Qarz summasi:</span>
                  <strong class="debt-info-value debt-sum-val">{{ (selectedOrder.paidAmount || selectedOrder.total || 0) | number:'1.0-0' }} so'm</strong>
                </div>
                <div class="debt-info-item" *ngIf="selectedOrder.debtDueDate">
                  <span class="debt-info-label"><app-icon name="calendar" [size]="13"></app-icon> Qaytarish muddati:</span>
                  <strong class="debt-info-value">{{ selectedOrder.debtDueDate }}</strong>
                </div>
                <div class="debt-info-item debt-info-item--full" *ngIf="selectedOrder.debtNotes">
                  <span class="debt-info-label"><app-icon name="file-text" [size]="13"></app-icon> Izoh / Sabab:</span>
                  <span class="debt-info-notes">{{ selectedOrder.debtNotes }}</span>
                </div>
              </div>
              <div class="debt-card-actions" *ngIf="selectedOrder.debtStatus !== 'PAID'">
                <button type="button" class="pos-btn pos-btn--success pos-btn--sm" (click)="settleDebt(selectedOrder)">
                  <app-icon name="check" [size]="14"></app-icon> Qarz to'landi (Yopish)
                </button>
              </div>
            </div>

            <div class="detail-meta-grid">`;

if (doReplace(targetDetailMeta, replaceDetailMeta)) {
  console.log('Detail modal debt card added');
} else {
  console.error('Failed to add Detail modal debt card');
}

// 6. Detail modal payment method text
const targetModalPay = `<div *ngIf="selectedOrder.paymentMethod"><span>To‘lov turi:</span> <strong>{{ selectedOrder.paymentMethod === 'CARD' ? 'Karta' : 'Naqd' }}</strong></div>`;
const replaceModalPay = `<div *ngIf="selectedOrder.paymentMethod"><span>To‘lov turi:</span> <strong [style.color]="selectedOrder.paymentMethod === 'DEBT' ? '#f59e0b' : ''">{{ selectedOrder.paymentMethod === 'CARD' ? 'Karta' : (selectedOrder.paymentMethod === 'DEBT' ? 'Qarz (Nasiya)' : 'Naqd') }}</strong></div>`;

if (doReplace(targetModalPay, replaceModalPay)) {
  console.log('Detail modal payment method text updated');
} else {
  console.error('Failed to update modal payment method');
}

// 7. Receipt modal payment & customer
const targetReceiptPay = `<div class="r-total-row" *ngIf="selectedOrder.paymentMethod">
                  <span>To'lov usuli:</span>
                  <span>{{ selectedOrder.paymentMethod === 'CARD' ? 'KARTA' : 'NAQD' }}</span>
                </div>`;

const replaceReceiptPay = `<div class="r-total-row" *ngIf="selectedOrder.paymentMethod">
                  <span>To'lov usuli:</span>
                  <span>{{ selectedOrder.paymentMethod === 'CARD' ? 'KARTA' : (selectedOrder.paymentMethod === 'DEBT' ? 'QARZ (NASIYA)' : 'NAQD') }}</span>
                </div>
                <div class="r-total-row" *ngIf="selectedOrder.paymentMethod === 'DEBT' && selectedOrder.customerName">
                  <span>Mijoz (Qarzdor):</span>
                  <span>{{ selectedOrder.customerName }}</span>
                </div>
                <div class="r-total-row" *ngIf="selectedOrder.paymentMethod === 'DEBT' && selectedOrder.customerPhone">
                  <span>Tel:</span>
                  <span>{{ selectedOrder.customerPhone }}</span>
                </div>
                <div class="r-total-row" *ngIf="selectedOrder.paymentMethod === 'DEBT' && selectedOrder.debtDueDate">
                  <span>Qaytarish muddati:</span>
                  <span>{{ selectedOrder.debtDueDate }}</span>
                </div>`;

if (doReplace(targetReceiptPay, replaceReceiptPay)) {
  console.log('Receipt modal updated');
} else {
  console.error('Failed to update receipt modal');
}

// 8. SCSS styles
const targetStyles = `      &.badge-debt {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
    }

    .paid-sub-amount {`;

const replaceStyles = `      &.badge-debt {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
    }

    .debt-customer-mini {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
      padding: 4px 8px;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 6px;
      font-size: 11px;
      text-align: left;

      .debt-c-name {
        color: #f59e0b;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .debt-c-phone {
        color: var(--text-secondary);
        font-family: var(--font-mono, monospace);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .debt-c-due {
        color: #ef4444;
        font-size: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .debt-status-pill {
        display: inline-block;
        font-size: 9.5px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        margin-top: 2px;
        width: fit-content;

        &.paid {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
      }
    }

    .debt-details-card {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;

      .debt-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(245, 158, 11, 0.2);

        .debt-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f59e0b;
          font-size: 15px;
          font-weight: 700;
        }

        .debt-badge-status {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);

          &.badge-paid {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.35);
          }
        }
      }

      .debt-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;

        .debt-info-item {
          display: flex;
          flex-direction: column;
          gap: 3px;

          &--full {
            grid-column: 1 / -1;
          }

          .debt-info-label {
            font-size: 11.5px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .debt-info-value {
            font-size: 13.5px;
            color: var(--text-primary);

            &.debt-sum-val {
              color: #f59e0b;
              font-size: 16px;
              font-weight: 800;
            }
          }

          .debt-info-notes {
            font-size: 12.5px;
            color: var(--text-secondary);
            background: var(--bg-tertiary);
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid var(--border);
          }
        }
      }

      .debt-card-actions {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid rgba(245, 158, 11, 0.15);
        display: flex;
        justify-content: flex-end;
      }
    }

    .tab-btn--debt {
      &.active {
        color: #f59e0b !important;
        border-bottom-color: #f59e0b !important;
      }
    }

    .chip--debt {
      .debt-text {
        color: #f59e0b !important;
      }
    }

    .breakdown-debt {
      color: #f59e0b;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .paid-sub-amount {`;

if (doReplace(targetStyles, replaceStyles)) {
  console.log('Styles updated');
} else {
  console.error('Failed to update styles');
}

// 9. activeTab type
const targetTabType = `activeTab: 'ALL' | 'CLOSED' | 'ACTIVE' | 'KITCHEN' | 'READY' | 'PAID' = 'ALL';`;
const replaceTabType = `activeTab: 'ALL' | 'CLOSED' | 'ACTIVE' | 'KITCHEN' | 'READY' | 'PAID' | 'DEBT' = 'ALL';`;
if (doReplace(targetTabType, replaceTabType)) {
  console.log('activeTab type updated');
} else {
  console.error('Failed to update activeTab type');
}

// 10. setTab and filteredOrders
const targetSetTab = `  setTab(tab: 'ALL' | 'CLOSED' | 'ACTIVE' | 'KITCHEN' | 'READY' | 'PAID'): void {
    this.activeTab = tab;
    this.pageIndex = 0;
    if (tab === 'PAID') {
      this.loadHistoryOrders();
    }
  }

  get filteredOrders(): Order[] {
    if (this.activeTab === 'PAID') {
      return this.historyOrders.filter(order => {
        // Date filter
        if (this.dateFilter !== 'ALL') {
          const orderDate = this.getOrderDate(order);
          if (!orderDate) return false;
          const now = new Date();

          if (this.dateFilter === 'TODAY') {
            const isToday = orderDate.getFullYear() === now.getFullYear() &&
                            orderDate.getMonth() === now.getMonth() &&
                            orderDate.getDate() === now.getDate();
            if (!isToday) return false;
          } else if (this.dateFilter === 'YESTERDAY') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = orderDate.getFullYear() === yesterday.getFullYear() &&
                                orderDate.getMonth() === yesterday.getMonth() &&
                                orderDate.getDate() === yesterday.getDate();
            if (!isYesterday) return false;
          } else if (this.dateFilter === 'THIS_WEEK') {
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            if (orderDate < oneWeekAgo) return false;
          } else if (this.dateFilter === 'THIS_MONTH') {
            const isThisMonth = orderDate.getFullYear() === now.getFullYear() &&
                                orderDate.getMonth() === now.getMonth();
            if (!isThisMonth) return false;
          }
        }

        // Payment method filter
        if (this.paymentMethodFilter !== 'ALL') {
          if ((order.paymentMethod || '').toUpperCase() !== this.paymentMethodFilter) {
            return false;
          }
        }

        // Table filter
        if (this.selectedTableFilter !== 'ALL') {
          if (order.tableId !== this.selectedTableFilter) {
            return false;
          }
        }

        // Search filter
        if (this.searchQuery.trim()) {
          const q = this.searchQuery.toLowerCase();
          const numMatch = order.orderNumber?.toLowerCase().includes(q);
          const tblMatch = (order.tableName || order.tableNumber)?.toLowerCase().includes(q);
          const waiterMatch = order.waiterName?.toLowerCase().includes(q);
          const cashierMatch = order.cashierName?.toLowerCase().includes(q);
          return numMatch || tblMatch || waiterMatch || cashierMatch;
        }

        return true;
      });
    }`;

const replaceSetTab = `  setTab(tab: 'ALL' | 'CLOSED' | 'ACTIVE' | 'KITCHEN' | 'READY' | 'PAID' | 'DEBT'): void {
    this.activeTab = tab;
    this.pageIndex = 0;
    if (tab === 'PAID' || tab === 'DEBT') {
      this.loadHistoryOrders();
    }
  }

  get filteredOrders(): Order[] {
    if (this.activeTab === 'PAID' || this.activeTab === 'DEBT') {
      return this.historyOrders.filter(order => {
        // Debt tab filter
        if (this.activeTab === 'DEBT') {
          const isDebt = (order.paymentMethod || '').toUpperCase() === 'DEBT' || !!order.debtStatus;
          if (!isDebt) return false;
        }

        // Date filter
        if (this.dateFilter !== 'ALL') {
          const orderDate = this.getOrderDate(order);
          if (!orderDate) return false;
          const now = new Date();

          if (this.dateFilter === 'TODAY') {
            const isToday = orderDate.getFullYear() === now.getFullYear() &&
                            orderDate.getMonth() === now.getMonth() &&
                            orderDate.getDate() === now.getDate();
            if (!isToday) return false;
          } else if (this.dateFilter === 'YESTERDAY') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = orderDate.getFullYear() === yesterday.getFullYear() &&
                                orderDate.getMonth() === yesterday.getMonth() &&
                                orderDate.getDate() === yesterday.getDate();
            if (!isYesterday) return false;
          } else if (this.dateFilter === 'THIS_WEEK') {
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            if (orderDate < oneWeekAgo) return false;
          } else if (this.dateFilter === 'THIS_MONTH') {
            const isThisMonth = orderDate.getFullYear() === now.getFullYear() &&
                                orderDate.getMonth() === now.getMonth();
            if (!isThisMonth) return false;
          }
        }

        // Payment method filter (if on PAID tab)
        if (this.activeTab !== 'DEBT' && this.paymentMethodFilter !== 'ALL') {
          if ((order.paymentMethod || '').toUpperCase() !== this.paymentMethodFilter) {
            return false;
          }
        }

        // Table filter
        if (this.selectedTableFilter !== 'ALL') {
          if (order.tableId !== this.selectedTableFilter) {
            return false;
          }
        }

        // Search filter
        if (this.searchQuery.trim()) {
          const q = this.searchQuery.toLowerCase();
          const numMatch = order.orderNumber?.toLowerCase().includes(q);
          const tblMatch = (order.tableName || order.tableNumber)?.toLowerCase().includes(q);
          const waiterMatch = order.waiterName?.toLowerCase().includes(q);
          const cashierMatch = order.cashierName?.toLowerCase().includes(q);
          const customerMatch = order.customerName?.toLowerCase().includes(q) || order.customerPhone?.includes(q);
          const notesMatch = order.notes?.toLowerCase().includes(q) || order.debtNotes?.toLowerCase().includes(q);
          return numMatch || tblMatch || waiterMatch || cashierMatch || customerMatch || notesMatch;
        }

        return true;
      });
    }`;

if (doReplace(targetSetTab, replaceSetTab)) {
  console.log('setTab and filteredOrders updated');
} else {
  console.error('Failed to update setTab');
}

// 11. Sum getters and settleDebt method
const targetGetters = `  get historyOrdersPaidSum(): number {
    if (this.activeTab !== 'PAID') return 0;
    return this.filteredOrders.reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get historyOrdersCashSum(): number {
    if (this.activeTab !== 'PAID') return 0;
    return this.filteredOrders
      .filter(o => (o.paymentMethod || 'CASH').toUpperCase() === 'CASH')
      .reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get historyOrdersCardSum(): number {
    if (this.activeTab !== 'PAID') return 0;
    return this.filteredOrders
      .filter(o => (o.paymentMethod || '').toUpperCase() === 'CARD')
      .reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }`;

const replaceGetters = `  get historyOrdersPaidSum(): number {
    if (this.activeTab !== 'PAID' && this.activeTab !== 'DEBT') return 0;
    return this.filteredOrders.reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get historyOrdersCashSum(): number {
    if (this.activeTab !== 'PAID' && this.activeTab !== 'DEBT') return 0;
    return this.filteredOrders
      .filter(o => (o.paymentMethod || 'CASH').toUpperCase() === 'CASH')
      .reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get historyOrdersCardSum(): number {
    if (this.activeTab !== 'PAID' && this.activeTab !== 'DEBT') return 0;
    return this.filteredOrders
      .filter(o => (o.paymentMethod || '').toUpperCase() === 'CARD')
      .reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get historyOrdersDebtSum(): number {
    if (this.activeTab !== 'PAID' && this.activeTab !== 'DEBT') return 0;
    return this.filteredOrders
      .filter(o => (o.paymentMethod || '').toUpperCase() === 'DEBT')
      .reduce((sum, o) => sum + (o.paidAmount != null ? o.paidAmount : (o.total || o.subtotal || 0)), 0);
  }

  get debtOrdersCount(): number {
    return this.historyOrders.filter(o => (o.paymentMethod || '').toUpperCase() === 'DEBT' || o.debtStatus === 'OPEN').length;
  }

  settleDebt(order: Order, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const customer = order.customerName || 'Ushbu mijoz';
    const amount = (order.paidAmount || order.total || 0).toLocaleString();
    if (!confirm(\`"\${customer}"ning \${amount} so'mlik qarzi to'landimi?\\nQarz holati "TO'LANGAN" deb belgilanadi.\`)) {
      return;
    }
    this.orderService.settleOrderDebt(order.id).subscribe({
      next: () => {
        this.notify.success('Qarz muvaffaqiyatli to‘langan deb belgilandi!');
        order.debtStatus = 'PAID';
        order.debtRemainingAmount = 0;
        if (this.selectedOrder && this.selectedOrder.id === order.id) {
          this.selectedOrder.debtStatus = 'PAID';
          this.selectedOrder.debtRemainingAmount = 0;
        }
        this.loadHistoryOrders();
      },
      error: (err) => {
        this.notify.error('Xatolik: ' + (err.error?.message || err.message));
      }
    });
  }`;

if (doReplace(targetGetters, replaceGetters)) {
  console.log('Getters and settleDebt updated');
} else {
  console.error('Failed to update getters');
}

fs.writeFileSync(path, content, 'utf8');
console.log('All updates successfully written to', path);
