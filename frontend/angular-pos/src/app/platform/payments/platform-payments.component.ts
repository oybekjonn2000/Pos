import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService, PaymentHistoryItem } from '../../core/services/billing.service';

@Component({
  selector: 'app-platform-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="platform-payments-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">SaaS To'lovlar Tranzaksiyalari</h1>
          <p class="page-subtitle">Platforma bo'yicha barcha restoranlarning obuna to'lovlari</p>
        </div>

        <button class="btn btn-primary" (click)="loadPayments()">
          🔄 Yangilash
        </button>
      </div>

      <!-- Filter / Search Card -->
      <div class="card table-card">
        <div class="card-header">
          <div class="search-wrap">
            <input type="text" [(ngModel)]="searchQuery" placeholder="Restoran nomi, kodi yoki Tranzaksiya ID..." class="form-control search-input" />
            <select [(ngModel)]="statusFilter" class="form-control select-input">
              <option value="">Barcha statuslar</option>
              <option value="PAID">PAID (To'langan)</option>
              <option value="FAILED">FAILED (Xatolik)</option>
              <option value="PENDING">PENDING (Kutilmoqda)</option>
            </select>
          </div>

          <div class="summary-stat">
            Jami: <strong>{{ filteredPayments().length }}</strong> ta tranzaksiya
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>To'lovlar yuklanmoqda...</p>
          </div>
        } @else if (filteredPayments().length === 0) {
          <div class="empty-state">
            <p>Hech qanday to'lov topilmadi.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Sana / Vaqt</th>
                  <th>Restoran</th>
                  <th>Tarif</th>
                  <th>Summa</th>
                  <th>To'lov Tizimi</th>
                  <th>Tranzaksiya ID</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                @for (p of filteredPayments(); track p.id) {
                  <tr>
                    <td>{{ formatDate(p.createdAt) }}</td>
                    <td>
                      <div class="rest-col">
                        <strong>{{ p.restaurantName }}</strong>
                        <span class="code-hint">{{ p.restaurantCode }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="plan-tag">{{ p.planName || p.planCode }}</span>
                    </td>
                    <td class="amount-cell">{{ formatPrice(p.amount) }} {{ p.currency }}</td>
                    <td>
                      <span class="provider-badge">{{ p.provider }}</span>
                    </td>
                    <td class="code-cell">{{ p.providerTransactionId || p.id.substring(0, 8) }}</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(p.status)">
                        {{ p.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .platform-payments-page {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
      color: var(--text-primary, #f8fafc);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .page-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
      .page-subtitle { font-size: 14px; color: var(--text-secondary, #94a3b8); }
    }

    .card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 14px;
      padding: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;
      }
    }

    .search-wrap {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .search-input { width: 300px; }
      .select-input { width: 180px; }

      .form-control {
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 8px;
        padding: 8px 12px;
        color: white;
        font-size: 13px;
      }
    }

    .summary-stat {
      font-size: 13px;
      color: var(--text-secondary, #94a3b8);
      strong { color: var(--text-primary, #f8fafc); }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid var(--border, #334155);
      }

      th {
        color: var(--text-muted, #64748b);
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
      }

      .rest-col {
        display: flex;
        flex-direction: column;
        strong { color: var(--text-primary, #f8fafc); }
        .code-hint { font-size: 11px; color: #818cf8; font-family: monospace; }
      }

      .plan-tag {
        background: rgba(255,255,255,0.06);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .amount-cell {
        font-weight: 700;
        color: #10b981;
      }

      .provider-badge {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .code-cell {
        font-family: monospace;
        color: var(--text-muted, #64748b);
      }
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;

      &.badge-paid { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &.badge-failed { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.badge-pending { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;

      &-primary { background: #6366f1; color: white; &:hover { background: #4f46e5; } }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary, #94a3b8);
    }
    .spinner {
      width: 32px; height: 32px; border: 3px solid var(--border, #334155);
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PlatformPaymentsComponent implements OnInit {
  private billingService = inject(BillingService);

  payments = signal<PaymentHistoryItem[]>([]);
  loading = signal(true);
  searchQuery = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.billingService.getPlatformPayments().subscribe({
      next: (data) => {
        this.payments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredPayments(): PaymentHistoryItem[] {
    let items = this.payments();
    if (this.statusFilter) {
      items = items.filter(p => p.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(p => 
        (p.restaurantName && p.restaurantName.toLowerCase().includes(q)) ||
        (p.restaurantCode && p.restaurantCode.toLowerCase().includes(q)) ||
        (p.providerTransactionId && p.providerTransactionId.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return items;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'badge-paid';
      case 'FAILED': return 'badge-failed';
      default: return 'badge-pending';
    }
  }
}
