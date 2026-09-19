import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BillingService, PlatformSubscriptionOverview, TenantSubscriptionSummary, PlanResponse, PlanSaveRequest } from '../../core/services/billing.service';

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="platform-subs-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">SaaS Obunalar Monitoringi</h1>
          <p class="page-subtitle">Platformadagi barcha restoranlarning obunalari, tariflari va MRR ko'rsatkichlari</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-outline" (click)="openPlansModal()">
            ⚙️ Tariflarni Boshqarish
          </button>
          <button class="btn btn-primary" (click)="loadOverview()">
            🔄 Yangilash
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-purple">💳</div>
          <div class="kpi-data">
            <span class="kpi-label">Jami Obunalar</span>
            <span class="kpi-value">{{ overview()?.totalSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-green">✅</div>
          <div class="kpi-data">
            <span class="kpi-label">Faol Obunalar (Active)</span>
            <span class="kpi-value">{{ overview()?.activeSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">⏳</div>
          <div class="kpi-data">
            <span class="kpi-label">Sinov Davridagi (Trial)</span>
            <span class="kpi-value">{{ overview()?.trialSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-red">⚠️</div>
          <div class="kpi-data">
            <span class="kpi-label">Muddati Tugagan (Expired)</span>
            <span class="kpi-value">{{ overview()?.expiredSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card highlight-card">
          <div class="kpi-icon icon-emerald">📈</div>
          <div class="kpi-data">
            <span class="kpi-label">MRR (Oylik Doimiy Tushum)</span>
            <span class="kpi-value">{{ formatPrice(overview()?.monthlyRecurringRevenue || 0) }} <small>UZS</small></span>
          </div>
        </div>

        <div class="kpi-card highlight-card">
          <div class="kpi-icon icon-blue">💰</div>
          <div class="kpi-data">
            <span class="kpi-label">Jami Tushgan To'lovlar</span>
            <span class="kpi-value">{{ formatPrice(overview()?.totalRevenue || 0) }} <small>UZS</small></span>
          </div>
        </div>
      </div>

      <!-- Subscriptions Table -->
      <div class="card table-card">
        <div class="card-header">
          <span class="card-title">Restoranlar Obuna Ro'yxati</span>
          <div class="search-box">
            <input type="text" [(ngModel)]="searchQuery" placeholder="Restoran nomi yoki kodi bo'yicha qidirish..." class="form-control" />
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Ma'lumotlar yuklanmoqda...</p>
          </div>
        } @else if (filteredSubscriptions().length === 0) {
          <div class="empty-state">
            <p>Hech qanday obuna topilmadi.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Restoran</th>
                  <th>Restoran Holati</th>
                  <th>Tarif Rejasi</th>
                  <th>Narxi</th>
                  <th>Obuna Statusi</th>
                  <th>Boshlangan Sana</th>
                  <th>Tugash Sanasi</th>
                  <th>Qolgan Kun</th>
                  <th>POS Kirish</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filteredSubscriptions(); track s.id) {
                  <tr>
                    <td>
                      <div class="rest-cell">
                        <strong class="rest-name">{{ s.restaurantName }}</strong>
                        <span class="rest-code">{{ s.restaurantCode }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getRestStatusClass(s.restaurantStatus)">
                        {{ s.restaurantStatus }}
                      </span>
                    </td>
                    <td>
                      <span class="plan-tag">{{ s.planName }} ({{ s.planCode }})</span>
                    </td>
                    <td class="price-cell">
                      {{ formatPrice(s.price) }} UZS
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getSubStatusClass(s.status)">
                        {{ s.status }}
                      </span>
                    </td>
                    <td>{{ formatDate(s.startDate) }}</td>
                    <td>{{ formatDate(s.endDate) }}</td>
                    <td>
                      <span class="days-pill" [class.danger]="s.daysRemaining <= 0" [class.warning]="s.daysRemaining > 0 && s.daysRemaining <= 3">
                        {{ s.daysRemaining }} kun
                      </span>
                    </td>
                    <td>
                      <span class="access-dot" [class.active]="s.operating" [title]="s.operating ? 'POS Ochiq' : 'POS Cheklangan'"></span>
                      <span class="access-text">{{ s.operating ? 'Ruxsat' : 'Cheklangan' }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/platform/restaurants', s.tenantId]" class="btn btn-sm btn-outline">
                        Restoran
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Plans Management Modal -->
      @if (showPlansModal()) {
        <div class="modal-overlay" (click)="closePlansModal()">
          <div class="modal-card wide-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>SaaS Tarif Rejalari Boshqaruvi</h2>
              <button class="btn-close" (click)="closePlansModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="plans-list">
                @for (plan of plans(); track plan.id) {
                  <div class="plan-admin-card">
                    <div class="pac-header">
                      <div>
                        <h3>{{ plan.name }} <span class="badge badge-purple">{{ plan.code }}</span></h3>
                        <p class="pac-desc">{{ plan.description }}</p>
                      </div>
                      <div class="pac-price">
                        <strong>{{ formatPrice(plan.price) }}</strong> {{ plan.currency }} / {{ plan.billingPeriod }}
                      </div>
                    </div>

                    <div class="pac-limits-grid">
                      <div class="limit-col">🪑 Stollar: <strong>{{ plan.maxTables || 'Cheksiz' }}</strong></div>
                      <div class="limit-col">👥 Xodimlar: <strong>{{ plan.maxUsers || 'Cheksiz' }}</strong></div>
                      <div class="limit-col">🍔 Mahsulotlar: <strong>{{ plan.maxProducts || 'Cheksiz' }}</strong></div>
                      <div class="limit-col">👨‍🍳 Oshxonalar: <strong>{{ plan.maxKitchens || 'Cheksiz' }}</strong></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closePlansModal()">Yopish</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .platform-subs-page {
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

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;

      .kpi-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;

        &.icon-purple { background: rgba(99, 102, 241, 0.15); }
        &.icon-green { background: rgba(16, 185, 129, 0.15); }
        &.icon-amber { background: rgba(245, 158, 11, 0.15); }
        &.icon-red { background: rgba(239, 68, 68, 0.15); }
        &.icon-emerald { background: rgba(16, 185, 129, 0.2); }
        &.icon-blue { background: rgba(59, 130, 246, 0.15); }
      }

      .kpi-data {
        display: flex;
        flex-direction: column;

        .kpi-label {
          font-size: 11px;
          color: var(--text-secondary, #94a3b8);
          font-weight: 600;
          text-transform: uppercase;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary, #f8fafc);
          small { font-size: 11px; color: var(--text-muted, #64748b); font-weight: normal; }
        }
      }

      &.highlight-card {
        border-color: rgba(99, 102, 241, 0.3);
      }
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

        .card-title { font-size: 16px; font-weight: 700; }
        .search-box {
          .form-control {
            background: var(--bg-primary, #0f172a);
            border: 1px solid var(--border, #334155);
            border-radius: 8px;
            padding: 8px 12px;
            color: white;
            font-size: 13px;
            width: 280px;
          }
        }
      }
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

      .rest-cell {
        display: flex;
        flex-direction: column;
        .rest-name { font-weight: 600; color: var(--text-primary, #f8fafc); }
        .rest-code { font-size: 11px; color: #818cf8; font-family: monospace; }
      }

      .plan-tag {
        background: rgba(255,255,255,0.06);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .price-cell {
        font-weight: 600;
      }

      .days-pill {
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        color: var(--text-primary, #f8fafc);

        &.danger { color: #ef4444; }
        &.warning { color: #f59e0b; }
      }

      .access-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        margin-right: 6px;
        &.active { background: #10b981; }
      }
      .access-text {
        font-size: 12px;
      }
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;

      &.badge-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &.badge-trial { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &.badge-expired { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.badge-purple { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
      &.badge-gray { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      padding: 24px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;

      &.wide-modal { max-width: 780px; }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        h2 { font-size: 18px; font-weight: 700; margin: 0; }
        .btn-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
      }

      .modal-body {
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: 16px;
      }
    }

    .plan-admin-card {
      background: var(--bg-primary, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;

      .pac-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
        h3 { font-size: 15px; font-weight: 700; margin: 0 0 4px 0; }
        .pac-desc { font-size: 12px; color: var(--text-secondary, #94a3b8); margin: 0; }
        .pac-price { font-size: 14px; text-align: right; }
      }

      .pac-limits-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        background: rgba(255,255,255,0.02);
        padding: 10px;
        border-radius: 6px;
        font-size: 12px;
        color: var(--text-secondary, #94a3b8);
        strong { color: var(--text-primary, #f8fafc); }
      }
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
      &-outline { background: transparent; border-color: var(--border, #334155); color: var(--text-primary, #f8fafc); &:hover { background: rgba(255,255,255,0.05); } }
      &-sm { padding: 4px 10px; font-size: 11px; }
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
export class PlatformSubscriptionsComponent implements OnInit {
  private billingService = inject(BillingService);

  overview = signal<PlatformSubscriptionOverview | null>(null);
  plans = signal<PlanResponse[]>([]);
  loading = signal(true);
  searchQuery = '';
  showPlansModal = signal(false);

  ngOnInit(): void {
    this.loadOverview();
    this.loadPlans();
  }

  loadOverview(): void {
    this.loading.set(true);
    this.billingService.getPlatformOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPlans(): void {
    this.billingService.getPlatformPlans().subscribe({
      next: (data) => this.plans.set(data)
    });
  }

  filteredSubscriptions(): TenantSubscriptionSummary[] {
    const subs = this.overview()?.subscriptions || [];
    if (!this.searchQuery.trim()) return subs;
    const q = this.searchQuery.toLowerCase();
    return subs.filter(s => 
      s.restaurantName.toLowerCase().includes(q) || 
      s.restaurantCode.toLowerCase().includes(q) ||
      s.planCode.toLowerCase().includes(q)
    );
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  getRestStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-active' : 'badge-gray';
  }

  getSubStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-active';
      case 'TRIAL': return 'badge-trial';
      case 'EXPIRED': return 'badge-expired';
      default: return 'badge-gray';
    }
  }

  openPlansModal(): void {
    this.showPlansModal.set(true);
  }

  closePlansModal(): void {
    this.showPlansModal.set(false);
  }
}
