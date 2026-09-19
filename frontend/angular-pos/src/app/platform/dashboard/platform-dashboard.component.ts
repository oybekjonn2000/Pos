import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PlatformService, PlatformStatistics, PlatformRestaurantSummary } from '../../core/services/platform.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  template: `
    <div class="platform-dashboard">
      <!-- Header Banner -->
      <div class="dash-header">
        <div class="dash-header__info">
          <div class="platform-chip">
            <span class="chip-icon">🌐</span> PLATFORM SUPER ADMIN
          </div>
          <h1 class="dash-title">Platforma Nazorat Markazi</h1>
          <p class="dash-desc">
            O‘zbekiston bo‘yicha restoran filiallari, savdolar hajmi va xodimlar faoliyatining konsolidatsiyalashgan monitoringi.
          </p>
        </div>

        <div class="dash-header__actions">
          <div class="period-switcher">
            <button
              type="button"
              class="period-btn"
              [class.active]="selectedPeriod() === 'TODAY'"
              (click)="changePeriod('TODAY')"
            >
              Bugun
            </button>
            <button
              type="button"
              class="period-btn"
              [class.active]="selectedPeriod() === 'YESTERDAY'"
              (click)="changePeriod('YESTERDAY')"
            >
              Kecha
            </button>
            <button
              type="button"
              class="period-btn"
              [class.active]="selectedPeriod() === 'THIS_WEEK'"
              (click)="changePeriod('THIS_WEEK')"
            >
              Bu hafta
            </button>
            <button
              type="button"
              class="period-btn"
              [class.active]="selectedPeriod() === 'THIS_MONTH'"
              (click)="changePeriod('THIS_MONTH')"
            >
              Bu oy
            </button>
            <button
              type="button"
              class="period-btn"
              [class.active]="selectedPeriod() === 'ALL'"
              (click)="changePeriod('ALL')"
            >
              Hammasi
            </button>
          </div>

          <a routerLink="/platform/restaurants" class="btn btn-primary">
            ➕ Yangi Restoran Qo‘shish
          </a>
        </div>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="metrics-grid">
        <!-- 1. Jami Restoranlar -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">Jami Restoranlar</span>
            <span class="metric-icon" style="background: rgba(99, 102, 241, 0.12); color: #6366f1;">🏢</span>
          </div>
          <div class="metric-val">{{ stats()?.totalRestaurants ?? 0 }}</div>
          <div class="metric-footer">
            <span class="sub-stat text-success">🟢 {{ stats()?.activeRestaurants ?? 0 }} faol</span>
            <span class="sub-stat text-warning">⏸️ {{ stats()?.suspendedRestaurants ?? 0 }} to‘xtatilgan</span>
          </div>
        </div>

        <!-- 2. Bugungi/Davriy Savdo -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">{{ getPeriodLabel() }} Savdo</span>
            <span class="metric-icon" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">💰</span>
          </div>
          <div class="metric-val text-success">
            {{ (stats()?.periodSales ?? 0) | number:'1.0-0' }} <span class="currency">so‘m</span>
          </div>
          <div class="metric-footer">
            <span class="sub-stat text-muted">Bugungi naqd/karta: {{ (stats()?.todaySales ?? 0) | number:'1.0-0' }} so‘m</span>
          </div>
        </div>

        <!-- 3. Buyurtmalar Soni -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">{{ getPeriodLabel() }} Buyurtmalar</span>
            <span class="metric-icon" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">📋</span>
          </div>
          <div class="metric-val">{{ stats()?.periodOrders ?? 0 }}</div>
          <div class="metric-footer">
            <span class="sub-stat text-muted">Bugun: {{ stats()?.todayOrders ?? 0 }} ta buyurtma</span>
          </div>
        </div>

        <!-- 4. Jami Xodimlar Tarmog'i -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">Jami Tizim Xodimlari</span>
            <span class="metric-icon" style="background: rgba(14, 165, 233, 0.12); color: #0ea5e9;">👥</span>
          </div>
          <div class="metric-val">{{ stats()?.totalEmployees ?? 0 }}</div>
          <div class="metric-footer">
            <a routerLink="/platform/employees" class="sub-stat text-primary hover-underline">
              Barcha xodimlarni ko‘rish ⟶
            </a>
          </div>
        </div>

        <!-- 5. O'rtacha Chek -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">O‘rtacha Chek</span>
            <span class="metric-icon" style="background: rgba(168, 85, 247, 0.12); color: #a855f7;">🧾</span>
          </div>
          <div class="metric-val">
            {{ (stats()?.averageCheck ?? 0) | number:'1.0-0' }} <span class="currency">so‘m</span>
          </div>
          <div class="metric-footer">
            <span class="sub-stat text-muted">Muntazam hisoblangan chek</span>
          </div>
        </div>

        <!-- 6. To'lovlar Hajmi -->
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-label">Bugungi To‘lovlar</span>
            <span class="metric-icon" style="background: rgba(236, 72, 153, 0.12); color: #ec4899;">💳</span>
          </div>
          <div class="metric-val">{{ stats()?.todayPayments ?? 0 }}</div>
          <div class="metric-footer">
            <a routerLink="/platform/sales" class="sub-stat text-primary hover-underline">
              Savdo monitoringi ⟶
            </a>
          </div>
        </div>
      </div>

      <!-- Quick Nav Hub -->
      <div class="quick-nav-grid">
        <a routerLink="/platform/restaurants" class="nav-tile">
          <div class="nav-tile__icon">🏢</div>
          <div class="nav-tile__content">
            <div class="nav-tile__title">Restoranlar Tarmog‘i</div>
            <div class="nav-tile__desc">Barcha filiallar ro‘yxati, aktivlashtirish va yangi filial ochish</div>
          </div>
          <span class="nav-tile__arrow">⟶</span>
        </a>
        <a routerLink="/platform/sales" class="nav-tile">
          <div class="nav-tile__icon">💰</div>
          <div class="nav-tile__content">
            <div class="nav-tile__title">Savdo Monitoringi</div>
            <div class="nav-tile__desc">Filiallar bo‘yicha tushumlar, naqd va karta to‘lovlari tahlili</div>
          </div>
          <span class="nav-tile__arrow">⟶</span>
        </a>
        <a routerLink="/platform/employees" class="nav-tile">
          <div class="nav-tile__icon">👥</div>
          <div class="nav-tile__content">
            <div class="nav-tile__title">Xodimlar Nazorati</div>
            <div class="nav-tile__desc">Barcha ofitsiant, oshpaz, kassir va adminlar reyestri</div>
          </div>
          <span class="nav-tile__arrow">⟶</span>
        </a>
        <a routerLink="/platform/reports" class="nav-tile">
          <div class="nav-tile__icon">📈</div>
          <div class="nav-tile__content">
            <div class="nav-tile__title">Platforma Hisobotlari</div>
            <div class="nav-tile__desc">Konsolidatsiyalashgan platforma moliyaviy hisobotlari</div>
          </div>
          <span class="nav-tile__arrow">⟶</span>
        </a>
      </div>

      <!-- Live Restaurants Table Section -->
      <div class="card table-card">
        <div class="table-card__header">
          <div>
            <h2 class="section-title">🏢 Restoran Filiallari va Real Ko‘rsatkichlar</h2>
            <p class="section-desc">Har bir restoranning joriy holati, savdosi va xodimlari</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" (click)="loadData()">
            🔄 Yangilash
          </button>
        </div>

        @if (loading()) {
          <div class="state-loading">
            <div class="spinner"></div>
            <span>Ma’lumotlar yuklanmoqda...</span>
          </div>
        } @else if (restaurants().length === 0) {
          <div class="state-empty">
            <div class="empty-icon">🏢</div>
            <div class="empty-title">Restoranlar topilmadi</div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Restoran</th>
                  <th>Kodi</th>
                  <th>Boshqaruvchi (Admin)</th>
                  <th>Xodimlar</th>
                  <th>Bugungi Savdo</th>
                  <th>Jami Savdo</th>
                  <th>Status</th>
                  <th style="text-align: right">Boshqaruv</th>
                </tr>
              </thead>
              <tbody>
                @for (r of restaurants(); track r.id) {
                  <tr (click)="goToDetail(r.id)" class="clickable-row">
                    <td>
                      <div class="res-cell">
                        <div class="res-avatar">🏢</div>
                        <div>
                          <div class="res-name">{{ r.name }}</div>
                          <div class="text-xs text-muted">{{ r.phone || r.address || '—' }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="code-badge">{{ r.code }}</span>
                    </td>
                    <td>
                      <div class="admin-cell">
                        <div class="admin-name">{{ r.adminName }}</div>
                        <div class="text-xs text-muted">{{ r.adminUsername ? '@' + r.adminUsername : '' }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="badge-employees">👤 {{ r.employeeCount }} ta</span>
                    </td>
                    <td>
                      <span class="text-success font-semibold">
                        {{ r.todaySales | number:'1.0-0' }} so‘m
                      </span>
                    </td>
                    <td>
                      <span class="text-primary font-semibold">
                        {{ r.totalSales | number:'1.0-0' }} so‘m
                      </span>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-active]="r.status === 'ACTIVE'"
                        [class.status-suspended]="r.status === 'SUSPENDED'"
                        [class.status-inactive]="r.status === 'INACTIVE'"
                      >
                        {{ r.status === 'ACTIVE' ? '🟢 FAOL' : (r.status === 'SUSPENDED' ? '⏸️ TO‘XTATILGAN' : '⚪ NOFAOL') }}
                      </span>
                    </td>
                    <td style="text-align: right" (click)="$event.stopPropagation()">
                      <a [routerLink]="['/platform/restaurants', r.id]" class="btn-detail">
                        Tafsilotlar ⟶
                      </a>
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
    .platform-dashboard {
      padding: 24px;
      max-width: 1350px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;

      .platform-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(99, 102, 241, 0.12);
        color: #6366f1;
        padding: 4px 10px;
        border-radius: 100px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .dash-title {
        font-size: 26px;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 6px 0;
      }

      .dash-desc {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0;
        max-width: 650px;
      }

      &__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .period-switcher {
      display: inline-flex;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;

      .period-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: var(--bg-card);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        &:hover:not(.active) {
          color: var(--text-primary);
        }
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow-sm);

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .metric-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
      }

      .metric-val {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);

        .currency {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
        }
      }

      .metric-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        margin-top: 4px;

        .sub-stat {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .quick-nav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .nav-tile {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
      transition: all 0.2s ease;

      &__icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      &__content {
        flex: 1;

        .nav-tile__title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .nav-tile__desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.3;
        }
      }

      &__arrow {
        font-size: 16px;
        color: var(--text-muted);
        transition: transform 0.2s;
      }

      &:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);

        .nav-tile__arrow {
          transform: translateX(4px);
          color: var(--primary);
        }
      }
    }

    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;

      &__header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-tertiary);

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 2px 0;
        }

        .section-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }
      }
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--bg-hover) !important;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th {
        padding: 12px 16px;
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 13px;
        color: var(--text-primary);
      }

      tr:last-child td {
        border-bottom: none;
      }
    }

    .res-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .res-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }

      .res-name {
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .code-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 11px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--primary);
    }

    .badge-employees {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 700;

      &.status-active {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      &.status-suspended {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      &.status-inactive {
        background: rgba(156, 163, 175, 0.15);
        color: #9ca3af;
      }
    }

    .btn-detail {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--primary);
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
    }

    .hover-underline:hover {
      text-decoration: underline;
    }
  `]
})
export class PlatformDashboardComponent implements OnInit {
  private platformService = inject(PlatformService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  stats = signal<PlatformStatistics | null>(null);
  restaurants = signal<PlatformRestaurantSummary[]>([]);
  loading = signal(false);
  selectedPeriod = signal<string>('TODAY');

  ngOnInit(): void {
    this.loadData();
  }

  changePeriod(period: string): void {
    this.selectedPeriod.set(period);
    this.loadStats();
  }

  loadData(): void {
    this.loadStats();
    this.loadRestaurants();
  }

  loadStats(): void {
    this.platformService.getStatistics(this.selectedPeriod()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Statistikalarni yuklashda xatolik yuz berdi');
      }
    });
  }

  loadRestaurants(): void {
    this.loading.set(true);
    this.platformService.getRestaurants().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.restaurants.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Restoranlarni yuklashda xatolik');
      }
    });
  }

  goToDetail(id: string): void {
    this.router.navigate(['/platform/restaurants', id]);
  }

  getPeriodLabel(): string {
    const p = this.selectedPeriod();
    switch (p) {
      case 'YESTERDAY': return 'Kechagi';
      case 'THIS_WEEK': return 'Haftalik';
      case 'THIS_MONTH': return 'Oylik';
      case 'ALL': return 'Umumiy';
      default: return 'Bugungi';
    }
  }
}
