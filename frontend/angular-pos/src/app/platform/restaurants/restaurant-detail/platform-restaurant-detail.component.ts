import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PlatformService,
  PlatformRestaurantDetail,
  PlatformEmployeeItem,
  PlatformOrderItemMonitoring
} from '../../../core/services/platform.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-platform-restaurant-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, RouterLink],
  template: `
    <div class="detail-container">
      <!-- Back Navigation Bar -->
      <div class="top-nav">
        <a routerLink="/platform/restaurants" class="back-link">
          ← Restoranlar ro‘yxatiga qaytish
        </a>
      </div>

      @if (loading() && !detail()) {
        <div class="state-loading">
          <div class="spinner"></div>
          <span>Restoran ma’lumotlari yuklanmoqda...</span>
        </div>
      } @else if (detail()) {
        <!-- Restaurant Passport Banner -->
        <div class="res-banner">
          <div class="res-banner__left">
            <div class="res-icon">🏢</div>
            <div class="res-header-info">
              <div class="res-badge-row">
                <span class="code-badge">{{ detail()?.code }}</span>
                <span
                  class="status-pill"
                  [class.status-active]="detail()?.status === 'ACTIVE'"
                  [class.status-suspended]="detail()?.status === 'SUSPENDED'"
                  [class.status-inactive]="detail()?.status === 'INACTIVE'"
                >
                  {{ detail()?.status === 'ACTIVE' ? '🟢 FAOL' : (detail()?.status === 'SUSPENDED' ? '⏸️ TO‘XTATILGAN' : '⚪ NOFAOL') }}
                </span>
                <span class="created-badge">Ochilgan: {{ detail()?.createdAt | date:'mediumDate' }}</span>
              </div>
              <h1 class="res-title">{{ detail()?.name }}</h1>
              <div class="res-contact-row">
                <span>📞 {{ detail()?.phone || 'Telefon kiritilmagan' }}</span>
                <span>📍 {{ detail()?.address || 'Manzil kiritilmagan' }}</span>
                <span>📋 INN / STIR: <strong>{{ detail()?.inn || '—' }}</strong></span>
              </div>
            </div>
          </div>

          <div class="res-banner__actions">
            @if (detail()?.status === 'ACTIVE') {
              <button type="button" class="btn btn-warning" (click)="toggleStatus('SUSPENDED')">
                ⏸️ Faoliyatni To‘xtatish
              </button>
            } @else {
              <button type="button" class="btn btn-success" (click)="toggleStatus('ACTIVE')">
                ▶️ Faollashtirish
              </button>
            }
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="kpi-grid">
          <!-- 1. Savdolar -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Savdo Ko‘rsatkichlari</span>
              <span class="kpi-icon">💰</span>
            </div>
            <div class="kpi-main-val text-success">
              {{ (detail()?.todaySales ?? 0) | number:'1.0-0' }} <span class="currency">so‘m (Bugun)</span>
            </div>
            <div class="kpi-sub-rows">
              <div class="sub-row">
                <span class="sub-label">Bu hafta:</span>
                <span class="sub-val">{{ (detail()?.weekSales ?? 0) | number:'1.0-0' }} so‘m</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">Bu oy:</span>
                <span class="sub-val">{{ (detail()?.monthSales ?? 0) | number:'1.0-0' }} so‘m</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">Jami tushum:</span>
                <span class="sub-val font-bold text-primary">{{ (detail()?.totalSales ?? 0) | number:'1.0-0' }} so‘m</span>
              </div>
            </div>
          </div>

          <!-- 2. Xodimlar -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Xodimlar Taqsimoti</span>
              <span class="kpi-icon">👥</span>
            </div>
            <div class="kpi-main-val">
              {{ detail()?.totalEmployees ?? 0 }} <span class="currency">nafar xodim</span>
            </div>
            <div class="kpi-sub-rows">
              <div class="sub-row">
                <span class="sub-label">👑 Adminlar:</span>
                <span class="sub-val">{{ getRoleCount('ADMIN') + getRoleCount('RESTAURANT_ADMIN') }}</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">🍽️ Ofitsiantlar:</span>
                <span class="sub-val">{{ getRoleCount('WAITER') }}</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">👨‍🍳 Oshpazlar:</span>
                <span class="sub-val">{{ getRoleCount('KITCHEN') }}</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">💳 Kassirlar:</span>
                <span class="sub-val">{{ getRoleCount('CASHIER') }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Buyurtmalar -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Buyurtmalar Statistikasi</span>
              <span class="kpi-icon">📋</span>
            </div>
            <div class="kpi-main-val">
              {{ detail()?.todayOrders ?? 0 }} <span class="currency">bugungi buyurtma</span>
            </div>
            <div class="kpi-sub-rows">
              <div class="sub-row">
                <span class="sub-label">Jami buyurtmalar:</span>
                <span class="sub-val">{{ detail()?.totalOrders ?? 0 }} ta</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">🟢 To‘langan:</span>
                <span class="sub-val text-success font-semibold">{{ detail()?.paidOrders ?? 0 }} ta</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">❌ Bekor qilingan:</span>
                <span class="sub-val text-danger">{{ detail()?.canceledOrders ?? 0 }} ta</span>
              </div>
              <div class="sub-row">
                <span class="sub-label">O‘rtacha chek:</span>
                <span class="sub-val font-semibold">{{ (detail()?.averageCheck ?? 0) | number:'1.0-0' }} so‘m</span>
              </div>
            </div>
          </div>

          <!-- 4. So'nggi Faollik -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Faollik Nazorati</span>
              <span class="kpi-icon">⏱️</span>
            </div>
            <div class="activity-timeline">
              <div class="act-item">
                <span class="act-dot green"></span>
                <div class="act-content">
                  <div class="act-title">Oxirgi Buyurtma</div>
                  <div class="act-time">{{ detail()?.lastOrderTime ? (detail()?.lastOrderTime | date:'dd.MM.yyyy HH:mm:ss') : 'Buyurtmalar yo‘q' }}</div>
                </div>
              </div>
              <div class="act-item">
                <span class="act-dot blue"></span>
                <div class="act-content">
                  <div class="act-title">Oxirgi To‘lov</div>
                  <div class="act-time">{{ detail()?.lastPaymentTime ? (detail()?.lastPaymentTime | date:'dd.MM.yyyy HH:mm:ss') : 'To‘lovlar yo‘q' }}</div>
                </div>
              </div>
              <div class="act-item">
                <span class="act-dot purple"></span>
                <div class="act-content">
                  <div class="act-title">Oxirgi Harakat</div>
                  <div class="act-time">{{ detail()?.lastActivityTime ? (detail()?.lastActivityTime | date:'dd.MM.yyyy HH:mm:ss') : '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs: Xodimlar ro'yxati vs Read-only Buyurtmalar monitoringi -->
        <div class="content-section card">
          <div class="section-tabs">
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'EMPLOYEES'"
              (click)="activeTab.set('EMPLOYEES')"
            >
              👥 Xodimlar Nazorati ({{ employees().length }})
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'ORDERS'"
              (click)="activeTab.set('ORDERS')"
            >
              📋 Buyurtmalar Monitoringi (Read-Only)
            </button>
          </div>

          <!-- TAB 1: Xodimlar -->
          @if (activeTab() === 'EMPLOYEES') {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>F.I.SH / Ism</th>
                    <th>Login (Username)</th>
                    <th>Lavozim (Rol)</th>
                    <th>Telefon</th>
                    <th>Holat</th>
                    <th>Qo‘shilgan sana</th>
                    <th style="text-align: right">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (emp of employees(); track emp.id) {
                    <tr>
                      <td class="font-semibold">{{ emp.fullName }}</td>
                      <td><code>{{ emp.username }}</code></td>
                      <td>
                        <span class="role-pill">{{ emp.role }}</span>
                      </td>
                      <td>{{ emp.phone || '—' }}</td>
                      <td>
                        <span class="status-pill" [class.status-active]="emp.active" [class.status-inactive]="!emp.active">
                          {{ emp.active ? '🟢 Faol' : '🔴 To‘xtatilgan' }}
                        </span>
                      </td>
                      <td class="text-muted text-xs">{{ emp.createdAt | date:'short' }}</td>
                      <td style="text-align: right">
                        @if (emp.active) {
                          <button type="button" class="btn-action-sm btn-warn" (click)="toggleEmployee(emp, false)">
                            To‘xtatish
                          </button>
                        } @else {
                          <button type="button" class="btn-action-sm btn-succ" (click)="toggleEmployee(emp, true)">
                            Faollashtirish
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- TAB 2: Read-Only Orders Monitoring -->
          @if (activeTab() === 'ORDERS') {
            <div class="read-only-banner">
              <span class="banner-icon">🛡️</span>
              <span>
                <strong>Read-Only Monitoring:</strong> Super Admin ushbu ekranda faqat buyurtmalarni kuzatadi. Buyurtma ochish, o‘zgartirish yoki to‘lov qilish huquqi faqat restoran xodimlariga tegishli.
              </span>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Buyurtma №</th>
                    <th>Stol</th>
                    <th>Ofitsiant</th>
                    <th>Mahsulotlar</th>
                    <th>Summa</th>
                    <th>Buyurtma Holati</th>
                    <th>To‘lov Holati</th>
                    <th>Ochilgan Vaqt</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ord of orders(); track ord.id) {
                    <tr>
                      <td>
                        <span class="order-code">{{ ord.orderNumber }}</span>
                      </td>
                      <td class="font-semibold">{{ ord.tableName }}</td>
                      <td>{{ ord.waiterName }}</td>
                      <td>{{ ord.itemCount }} ta mahsulot</td>
                      <td>
                        <strong class="text-success">{{ ord.totalAmount | number:'1.0-0' }} so‘m</strong>
                      </td>
                      <td>
                        <span class="status-pill status-active">{{ ord.status }}</span>
                      </td>
                      <td>
                        <span
                          class="status-pill"
                          [class.status-active]="ord.paymentStatus === 'PAID'"
                          [class.status-suspended]="ord.paymentStatus === 'PARTIALLY_PAID'"
                          [class.status-inactive]="ord.paymentStatus === 'UNPAID'"
                        >
                          {{ ord.paymentStatus === 'PAID' ? 'To‘langan (' + ord.paymentMethod + ')' : 'To‘lanmagan' }}
                        </span>
                      </td>
                      <td class="text-xs text-muted">{{ ord.openedAt | date:'HH:mm:ss' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="text-center text-muted" style="padding: 32px">
                        Hozircha hech qanday buyurtma mavjud emas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 24px;
      max-width: 1350px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .top-nav {
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--primary);
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .res-banner {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;

      &__left {
        display: flex;
        align-items: center;
        gap: 20px;

        .res-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          flex-shrink: 0;
        }

        .res-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;

          .code-badge {
            padding: 3px 8px;
            border-radius: 6px;
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 700;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--primary);
          }

          .created-badge {
            font-size: 12px;
            color: var(--text-muted);
          }
        }

        .res-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }

        .res-contact-row {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);

      .kpi-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .kpi-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-icon {
          font-size: 18px;
        }
      }

      .kpi-main-val {
        font-size: 22px;
        font-weight: 800;
        color: var(--text-primary);

        .currency {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }
      }

      .kpi-sub-rows {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-top: 1px solid var(--border);
        padding-top: 10px;

        .sub-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;

          .sub-label {
            color: var(--text-muted);
          }

          .sub-val {
            color: var(--text-primary);
          }
        }
      }
    }

    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .act-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .act-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;

          &.green { background: #10b981; }
          &.blue { background: #0ea5e9; }
          &.purple { background: #a855f7; }
        }

        .act-content {
          .act-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-muted);
          }

          .act-time {
            font-size: 13px;
            color: var(--text-primary);
            font-weight: 500;
          }
        }
      }
    }

    .content-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;

      .section-tabs {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        background: var(--bg-tertiary);

        .tab-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &.active {
            background: var(--bg-card);
            color: var(--primary);
            border-color: var(--border);
            box-shadow: var(--shadow-sm);
          }
        }
      }
    }

    .read-only-banner {
      background: rgba(99, 102, 241, 0.08);
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--text-secondary);

      .banner-icon {
        font-size: 18px;
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
        background: var(--bg-tertiary);
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

    .order-code {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--primary);
    }

    .role-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
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

    .btn-action-sm {
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-warn {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.2);

        &:hover {
          background: #f59e0b;
          color: white;
        }
      }

      &.btn-succ {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.2);

        &:hover {
          background: #10b981;
          color: white;
        }
      }
    }

    .state-loading {
      padding: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
    }
  `]
})
export class PlatformRestaurantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private platformService = inject(PlatformService);
  private notify = inject(NotificationService);

  restaurantId = signal<string>('');
  detail = signal<PlatformRestaurantDetail | null>(null);
  employees = signal<PlatformEmployeeItem[]>([]);
  orders = signal<PlatformOrderItemMonitoring[]>([]);
  loading = signal(false);
  activeTab = signal<'EMPLOYEES' | 'ORDERS'>('EMPLOYEES');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantId.set(id);
      this.loadAll(id);
    }
  }

  loadAll(id: string): void {
    this.loading.set(true);
    this.platformService.getRestaurantDetail(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.detail.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Restoran tafsilotlarini yuklashda xatolik');
      }
    });

    this.platformService.getRestaurantEmployees(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees.set(res.data);
        }
      }
    });

    this.platformService.getRestaurantOrders(id, 0, 30).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders.set(res.data);
        }
      }
    });
  }

  getRoleCount(role: string): number {
    const roles = this.detail()?.employeesByRole;
    return roles ? (roles[role] || 0) : 0;
  }

  toggleStatus(targetStatus: 'ACTIVE' | 'SUSPENDED'): void {
    const res = this.detail();
    if (!res) return;

    if (!confirm(`Haqiqatan ham "${res.name}" statusi ${targetStatus} ga o‘zgartirilsinmi?`)) {
      return;
    }

    this.platformService.updateRestaurantStatus(res.id, targetStatus).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notify.success(`Status o‘zgartirildi: ${targetStatus}`);
          this.loadAll(res.id);
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Statusni o‘zgartirishda xatolik');
      }
    });
  }

  toggleEmployee(emp: PlatformEmployeeItem, active: boolean): void {
    this.platformService.updateEmployeeStatus(this.restaurantId(), emp.id, active).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.notify.success(`Xodim holati yangilandi (${active ? 'Faol' : 'To‘xtatilgan'})`);
          this.loadAll(this.restaurantId());
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Xodim holatini o‘zgartirishda xatolik');
      }
    });
  }
}
