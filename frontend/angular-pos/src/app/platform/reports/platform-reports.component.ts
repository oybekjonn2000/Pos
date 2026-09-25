import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformService, PlatformReportResponse, RestaurantSalesBreakdown } from '../../core/services/platform.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-platform-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="platform-container">
      <!-- Header Banner -->
      <div class="platform-header">
        <div class="platform-header__info">
          <div class="platform-badge">
            <span class="badge-icon"><app-icon name="trending-up" [size]="14"></app-icon></span> Platforma Konsolidatsiyalangan Hisobotlari
          </div>
          <h1 class="platform-title">Tarmoq va Savdo Hisobotlari</h1>
          <p class="platform-subtitle">
            Barcha filiallar bo‘yicha to‘lov hajmi, buyurtmalar oqimi va restoranlar o‘rtasidagi savdo tahlili.
          </p>
        </div>
        <div class="platform-header__actions">
          <button type="button" class="btn btn-secondary" (click)="printReport()">
            <span class="btn-icon"><app-icon name="printer" [size]="14"></app-icon></span> Chop etish
          </button>
          <button type="button" class="btn btn-primary" (click)="loadReport()" [disabled]="isLoading()">
            <span class="btn-icon"><app-icon name="refresh" [size]="14"></app-icon></span> Hisobotni Shakllantirish
          </button>
        </div>
      </div>

      <!-- Filters & Presets Card -->
      <div class="filter-card">
        <div class="presets-row">
          <span class="presets-label">Tezkor davr:</span>
          <button type="button" class="preset-btn" [class.active]="activePreset === 'today'" (click)="setPreset('today')">Bugun</button>
          <button type="button" class="preset-btn" [class.active]="activePreset === 'yesterday'" (click)="setPreset('yesterday')">Kecha</button>
          <button type="button" class="preset-btn" [class.active]="activePreset === 'week'" (click)="setPreset('week')">Bu hafta</button>
          <button type="button" class="preset-btn" [class.active]="activePreset === 'month'" (click)="setPreset('month')">Bu oy</button>
          <button type="button" class="preset-btn" [class.active]="activePreset === 'all'" (click)="setPreset('all')">Barcha davr</button>
        </div>

        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-label">Boshlanish sanasi</label>
            <input type="date" class="pos-input" [(ngModel)]="fromDate" (change)="activePreset = 'custom'; loadReport()" />
          </div>
          <div class="filter-item">
            <label class="filter-label">Tugash sanasi</label>
            <input type="date" class="pos-input" [(ngModel)]="toDate" (change)="activePreset = 'custom'; loadReport()" />
          </div>
          <div class="filter-item">
            <label class="filter-label">Restoran statusi</label>
            <select class="pos-input" [(ngModel)]="statusFilter" (change)="loadReport()">
              <option value="">Barchasi (Active + Suspended)</option>
              <option value="ACTIVE">Faqat faol (Active)</option>
              <option value="SUSPENDED">To‘xtatilgan (Suspended)</option>
            </select>
          </div>
          <div class="filter-item filter-actions">
            <button type="button" class="btn btn-primary" (click)="loadReport()" [disabled]="isLoading()">
              <span>Yangilash</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Consolidated Summary KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-card--highlight">
          <div class="kpi-card__header">
            <span class="kpi-card__title">Yalpi Savdo Hajmi</span>
            <span class="kpi-icon"><app-icon name="dollar-sign" [size]="20"></app-icon></span>
          </div>
          <div class="kpi-card__value">{{ formatCurrency(reportData()?.totalVolume ?? 0) }}</div>
          <div class="kpi-card__footer">
            <span>Tanlangan davrda barcha filiallardan tushgan pul</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__title">Jami Buyurtmalar</span>
            <span class="kpi-icon"><app-icon name="clipboard" [size]="20"></app-icon></span>
          </div>
          <div class="kpi-card__value">{{ (reportData()?.totalOrders ?? 0) | number }}</div>
          <div class="kpi-card__footer">
            <span>Muvaqqat va to‘liq yakunlangan cheklar</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__title">Faol Filiallar</span>
            <span class="kpi-icon"><app-icon name="building" [size]="20"></app-icon></span>
          </div>
          <div class="kpi-card__value text-success">{{ (reportData()?.activeRestaurantsCount ?? 0) | number }}</div>
          <div class="kpi-card__footer">
            <span>Hozirda mijozlarga xizmat ko‘rsatmoqda</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__title">O‘rtacha Filial Tushumi</span>
            <span class="kpi-icon"><app-icon name="bar-chart" [size]="20"></app-icon></span>
          </div>
          <div class="kpi-card__value">{{ formatCurrency(avgRevenuePerBranch()) }}</div>
          <div class="kpi-card__footer">
            <span>Har bir filial hisobiga o‘rtacha aylanma</span>
          </div>
        </div>
      </div>

      <!-- Detailed Breakdown Table -->
      <div class="table-card">
        <div class="table-card__header">
          <div class="table-card__title-wrap">
            <h3 class="table-card__title">Restoranlar Taqsimoti va Natijalari</h3>
            <span class="table-card__count">{{ breakdownList().length }} ta filial</span>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Platforma hisoboti hisoblanmoqda...</p>
          </div>
        } @else if (breakdownList().length === 0) {
          <div class="empty-box">
            <div class="empty-icon"><app-icon name="trending-up" [size]="48"></app-icon></div>
            <h4>Hisobot bo‘yicha ma’lumot yo‘q</h4>
            <p>Ushbu muddat davomida buyurtmalar va to‘lovlar amalga oshirilmagan.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="platform-table">
              <thead>
                <tr>
                  <th>Restoran</th>
                  <th>Kodi</th>
                  <th>Status</th>
                  <th>Buyurtmalar</th>
                  <th>Naqd Savdo</th>
                  <th>Karta Savdo</th>
                  <th>Jami Tushum</th>
                  <th>O‘rtacha Chek</th>
                  <th>Ulush</th>
                  <th style="text-align: right">Amal</th>
                </tr>
              </thead>
              <tbody>
                @for (item of breakdownList(); track item.restaurantId) {
                  <tr>
                    <td>
                      <div class="restaurant-name-cell">
                        <span class="res-avatar"><app-icon name="building" [size]="16"></app-icon></span>
                        <span class="res-title">{{ item.restaurantName }}</span>
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
                      >
                        {{ item.status === 'ACTIVE' ? 'Faol' : 'To‘xtatilgan' }}
                      </span>
                    </td>
                    <td class="font-medium">{{ item.orderCount | number }}</td>
                    <td class="text-success font-medium">{{ formatCurrency(item.cashRevenue) }}</td>
                    <td class="text-info font-medium">{{ formatCurrency(item.cardRevenue) }}</td>
                    <td class="font-bold text-primary">{{ formatCurrency(item.totalRevenue) }}</td>
                    <td>{{ formatCurrency(item.averageCheck) }}</td>
                    <td>
                      <div class="share-cell">
                        <div class="share-bar-wrap">
                          <div
                            class="share-bar"
                            [style.width.%]="calcShare(item.totalRevenue)"
                          ></div>
                        </div>
                        <span class="share-label">{{ calcShare(item.totalRevenue) }}%</span>
                      </div>
                    </td>
                    <td style="text-align: right">
                      <button
                        type="button"
                        class="action-btn"
                        (click)="goToDetail(item.restaurantId)"
                      >
                        Batafsil
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

    /* Filter & Preset Card */
    .filter-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .presets-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .presets-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      margin-right: 4px;
    }

    .preset-btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 14px;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary);
        border-color: var(--primary);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }
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
      min-width: 170px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
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
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
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

      &--highlight {
        border-left: 4px solid var(--primary);
      }

      &__header {
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

      .kpi-icon {
        font-size: 18px;
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
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      border: 1px solid rgba(99, 102, 241, 0.25);
      transition: all 0.2s;

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
export class PlatformReportsComponent implements OnInit {
  private platformService = inject(PlatformService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  reportData = signal<PlatformReportResponse | null>(null);
  isLoading = signal(false);

  fromDate = '';
  toDate = '';
  statusFilter = '';
  activePreset: 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom' = 'month';

  breakdownList = computed(() => this.reportData()?.breakdown || []);

  avgRevenuePerBranch = computed(() => {
    const data = this.reportData();
    if (!data || !data.activeRestaurantsCount || data.activeRestaurantsCount === 0) return 0;
    return Math.round(data.totalVolume / data.activeRestaurantsCount);
  });

  ngOnInit(): void {
    this.setPreset('month');
  }

  setPreset(preset: 'today' | 'yesterday' | 'week' | 'month' | 'all'): void {
    this.activePreset = preset;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      this.fromDate = toDateStr(now);
      this.toDate = toDateStr(now);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      this.fromDate = toDateStr(y);
      this.toDate = toDateStr(y);
    } else if (preset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      this.fromDate = toDateStr(w);
      this.toDate = toDateStr(now);
    } else if (preset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fromDate = toDateStr(m);
      this.toDate = toDateStr(now);
    } else if (preset === 'all') {
      this.fromDate = '';
      this.toDate = '';
    }

    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.platformService.getReports(
      this.fromDate || undefined,
      this.toDate || undefined,
      this.statusFilter || undefined
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.reportData.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.error('Platforma hisobotini yuklashda xatolik yuz berdi.');
      }
    });
  }

  calcShare(volume: number): number {
    const total = this.reportData()?.totalVolume || 0;
    if (total <= 0) return 0;
    return Math.round((volume / total) * 100);
  }

  goToDetail(restaurantId: string): void {
    this.router.navigate(['/platform/restaurants', restaurantId]);
  }

  printReport(): void {
    window.print();
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return '0 so‘m';
    return value.toLocaleString('uz-UZ') + ' so‘m';
  }
}
