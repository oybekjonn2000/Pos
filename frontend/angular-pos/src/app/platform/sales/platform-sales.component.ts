import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformService, RestaurantSalesBreakdown, PlatformRestaurantSummary } from '../../core/services/platform.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-platform-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="platform-container">
      <!-- Header Banner -->
      <div class="platform-header">
        <div class="platform-header__info">
          <div class="platform-badge">
            <span class="badge-icon"><app-icon name="dollar-sign" [size]="14"></app-icon></span> Savdo Monitoringi (Platforma Bo‘ylab)
          </div>
          <h1 class="platform-title">Markazlashgan Savdo Tahlili</h1>
          <p class="platform-subtitle">
            Barcha filial va tarmoq restoranlarining real-vaqt rejimida savdo aylanmasi, naqd va karta tushumlari monitoringi.
          </p>
        </div>
        <div class="platform-header__actions">
          <button type="button" class="btn btn-secondary" (click)="loadData()" [disabled]="isLoading()">
            <span class="btn-icon"><app-icon name="refresh" [size]="14"></app-icon></span> Yangilash
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">Boshlanish sanasi</label>
            <input type="date" class="pos-input" [(ngModel)]="startDate" (change)="loadSales()" />
          </div>
          <div class="filter-item">
            <label class="filter-label">Tugash sanasi</label>
            <input type="date" class="pos-input" [(ngModel)]="endDate" (change)="loadSales()" />
          </div>
          <div class="filter-item filter-item--grow">
            <label class="filter-label">Filial / Restoran bo‘yicha filtr</label>
            <select class="pos-input" [(ngModel)]="selectedRestaurantId" (change)="loadSales()">
              <option value="">Barcha restoranlar</option>
              @for (r of restaurants(); track r.id) {
                <option [value]="r.id">{{ r.name }} ({{ r.code }})</option>
              }
            </select>
          </div>
          <div class="filter-item filter-actions">
            <button type="button" class="btn btn-primary" (click)="loadSales()" [disabled]="isLoading()">
              <span>Qidirish</span>
            </button>
            <button type="button" class="btn btn-ghost" (click)="resetFilters()">
              <span>Tozalash</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Aggregated KPI Metric Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-card--primary">
          <div class="kpi-card__top">
            <span class="kpi-card__title">Jami Savdo Aylanmasi</span>
            <span class="kpi-card__badge">100% Fakt</span>
          </div>
          <div class="kpi-card__value">{{ formatCurrency(totalRevenue()) }}</div>
          <div class="kpi-card__footer">
            <span>Tanlangan davrdagi yalpi savdo</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__top">
            <span class="kpi-card__title">Jami Buyurtmalar</span>
            <span class="kpi-card__badge info">Tarmoq bo‘ylab</span>
          </div>
          <div class="kpi-card__value">{{ totalOrders() | number }}</div>
          <div class="kpi-card__footer">
            <span>Yopilgan & to‘langan cheklar</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__top">
            <span class="kpi-card__title">Naqd Tushum</span>
            <span class="kpi-card__badge success">Naqd pul</span>
          </div>
          <div class="kpi-card__value text-success">{{ formatCurrency(totalCash()) }}</div>
          <div class="kpi-card__footer">
            <span>{{ getCashPercentage() }}% aylanma ulushi</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__top">
            <span class="kpi-card__title">Karta / Terminal</span>
            <span class="kpi-card__badge warning">Elektron to‘lov</span>
          </div>
          <div class="kpi-card__value text-info">{{ formatCurrency(totalCard()) }}</div>
          <div class="kpi-card__footer">
            <span>{{ getCardPercentage() }}% aylanma ulushi</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__top">
            <span class="kpi-card__title">O‘rtacha Chek</span>
            <span class="kpi-card__badge">AOV</span>
          </div>
          <div class="kpi-card__value">{{ formatCurrency(averageCheck()) }}</div>
          <div class="kpi-card__footer">
            <span>Barcha tarmoq bo‘yicha o‘rtacha</span>
          </div>
        </div>
      </div>

      <!-- Sales Breakdown Table Card -->
      <div class="table-card">
        <div class="table-card__header">
          <div class="table-card__title-wrap">
            <h3 class="table-card__title">Restoranlar Bo‘yicha Savdo Tafsilotlari</h3>
            <span class="table-card__count">{{ filteredSales().length }} ta filial</span>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Savdo ma’lumotlari tahlil qilinmoqda...</p>
          </div>
        } @else if (filteredSales().length === 0) {
          <div class="empty-box">
            <div class="empty-icon"><app-icon name="bar-chart" [size]="48"></app-icon></div>
            <h4>Ma’lumot topilmadi</h4>
            <p>Tanlangan sana va filtrlar bo‘yicha hali hech qanday savdo qayd etilmagan.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="platform-table">
              <thead>
                <tr>
                  <th>Restoran</th>
                  <th>Kodi</th>
                  <th>Holati</th>
                  <th>Buyurtmalar</th>
                  <th>Naqd Tushum</th>
                  <th>Karta Tushum</th>
                  <th>Jami Savdo</th>
                  <th>O‘rtacha Chek</th>
                  <th>Aylanma Ulushi</th>
                  <th style="text-align: right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredSales(); track item.restaurantId) {
                  <tr>
                    <td>
                      <div class="restaurant-name-cell">
                        <span class="res-avatar"><app-icon name="building" [size]="16"></app-icon></span>
                        <div class="res-details">
                          <span class="res-title">{{ item.restaurantName }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="code-badge">{{ item.restaurantCode }}</span>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-active]="item.status === 'ACTIVE'"
                        [class.status-suspended]="item.status === 'SUSPENDED'"
                        [class.status-inactive]="item.status === 'INACTIVE'"
                      >
                        {{ item.status === 'ACTIVE' ? 'Faol' : (item.status === 'SUSPENDED' ? 'To‘xtatilgan' : 'Nofaol') }}
                      </span>
                    </td>
                    <td class="font-medium">{{ item.orderCount | number }}</td>
                    <td class="text-success font-medium">{{ formatCurrency(item.cashRevenue) }}</td>
                    <td class="text-info font-medium">{{ formatCurrency(item.cardRevenue) }}</td>
                    <td class="font-bold text-lg text-primary">{{ formatCurrency(item.totalRevenue) }}</td>
                    <td>{{ formatCurrency(item.averageCheck) }}</td>
                    <td>
                      <div class="share-cell">
                        <div class="share-bar-wrap">
                          <div
                            class="share-bar"
                            [style.width.%]="getSharePercentage(item.totalRevenue)"
                          ></div>
                        </div>
                        <span class="share-label">{{ getSharePercentage(item.totalRevenue) }}%</span>
                      </div>
                    </td>
                    <td style="text-align: right">
                      <button
                        type="button"
                        class="action-btn action-btn--detail"
                        (click)="goToRestaurantDetail(item.restaurantId)"
                        title="Restoran monitoringiga o‘tish"
                      >
                        <app-icon name="bar-chart" [size]="14"></app-icon> Batafsil
                      </button>
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
    .platform-container {
      padding: 24px;
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .platform-header {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
      gap: 16px;

      &__info {
        max-width: 750px;
      }

      &__actions {
        display: flex;
        gap: 12px;
      }
    }

    .platform-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 100px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.25);
      color: var(--primary);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .platform-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }

    .platform-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Filter Card */
    .filter-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      box-shadow: var(--shadow-sm);
    }

    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;

      &--grow {
        flex: 1;
        min-width: 220px;
      }
    }

    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .filter-actions {
      display: flex;
      flex-direction: row;
      gap: 8px;
    }

    .pos-input {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 9px 14px;
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
      }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--border-light);
      }

      &--primary {
        border-left: 4px solid var(--primary);
      }

      &__top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__title {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &__badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        font-weight: 600;

        &.info {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }

        &.success {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        &.warning {
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
        }
      }

      &__value {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.5px;
      }

      &__footer {
        font-size: 12px;
        color: var(--text-muted);
      }
    }

    /* Table Card */
    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);

      &__header {
        padding: 18px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border);
        background: var(--bg-card);
      }

      &__title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      &__title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      &__count {
        font-size: 11px;
        background: rgba(99, 102, 241, 0.1);
        color: var(--primary);
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 12px;
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .platform-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;

      th {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        font-weight: 600;
        padding: 12px 18px;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        padding: 14px 18px;
        border-bottom: 1px solid var(--border);
        color: var(--text-primary);
        vertical-align: middle;
      }

      tbody tr:hover {
        background: var(--bg-hover);
      }
    }

    .restaurant-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .res-avatar {
      font-size: 18px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 8px;
      color: var(--primary);
    }

    .res-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .code-badge {
      display: inline-block;
      padding: 2px 7px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 6px;
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      color: var(--primary);
      font-size: 11px;
    }

    .status-pill {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;

      &.status-active {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
        border: 1px solid rgba(16, 185, 129, 0.25);
      }

      &.status-suspended {
        background: rgba(245, 158, 11, 0.12);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.25);
      }

      &.status-inactive {
        background: rgba(100, 116, 139, 0.12);
        color: #64748b;
        border: 1px solid rgba(100, 116, 139, 0.25);
      }
    }

    .share-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }

    .share-bar-wrap {
      flex: 1;
      height: 6px;
      background: var(--border);
      border-radius: 9999px;
      overflow: hidden;
    }

    .share-bar {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #0ea5e9);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .share-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 35px;
      text-align: right;
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      border: 1px solid rgba(99, 102, 241, 0.25);

      &:hover {
        background: var(--primary);
        color: #ffffff;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &.btn-primary {
        background: var(--primary);
        color: #ffffff;
        &:hover {
          background: var(--primary-dark);
        }
      }

      &.btn-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border);
        &:hover {
          background: var(--bg-hover);
        }
      }

      &.btn-ghost {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid transparent;
        &:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .text-success { color: #059669 !important; }
    .text-info { color: #2563eb !important; }
    .text-primary { color: var(--primary) !important; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .text-lg { font-size: 15px; }

    .loading-box, .empty-box {
      padding: 60px 24px;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 44px;
      margin-bottom: 12px;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PlatformSalesComponent implements OnInit {
  private platformService = inject(PlatformService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  salesList = signal<RestaurantSalesBreakdown[]>([]);
  restaurants = signal<PlatformRestaurantSummary[]>([]);
  isLoading = signal(false);

  startDate = '';
  endDate = '';
  selectedRestaurantId = '';

  filteredSales = computed(() => {
    let list = this.salesList();
    if (this.selectedRestaurantId) {
      list = list.filter(s => s.restaurantId === this.selectedRestaurantId);
    }
    return list;
  });

  totalRevenue = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.totalRevenue || 0), 0));
  totalOrders = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.orderCount || 0), 0));
  totalCash = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.cashRevenue || 0), 0));
  totalCard = computed(() => this.filteredSales().reduce((sum, s) => sum + (s.cardRevenue || 0), 0));
  averageCheck = computed(() => {
    const orders = this.totalOrders();
    return orders > 0 ? Math.round(this.totalRevenue() / orders) : 0;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadRestaurants();
    this.loadSales();
  }

  loadRestaurants(): void {
    this.platformService.getRestaurants().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.restaurants.set(res.data);
        }
      },
      error: () => {}
    });
  }

  loadSales(): void {
    this.isLoading.set(true);
    this.platformService.getSalesMonitoring(
      this.startDate || undefined,
      this.endDate || undefined,
      this.selectedRestaurantId || undefined
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.salesList.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify.error('Savdo ma’lumotlarini yuklashda xatolik yuz berdi.');
      }
    });
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.selectedRestaurantId = '';
    this.loadSales();
  }

  getSharePercentage(amount: number): number {
    const total = this.totalRevenue();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  getCashPercentage(): number {
    const total = this.totalRevenue();
    if (total <= 0) return 0;
    return Math.round((this.totalCash() / total) * 100);
  }

  getCardPercentage(): number {
    const total = this.totalRevenue();
    if (total <= 0) return 0;
    return Math.round((this.totalCard() / total) * 100);
  }

  goToRestaurantDetail(restaurantId: string): void {
    this.router.navigate(['/platform/restaurants', restaurantId]);
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return '0 so‘m';
    return value.toLocaleString('uz-UZ') + ' so‘m';
  }
}
