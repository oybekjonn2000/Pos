import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../core/services/order.service';
import { TableService, RestaurantTable } from '../core/services/table.service';
import { AuthService } from '../core/services/auth.service';
import { AppIconComponent } from '../shared/components/icon/icon.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent, TranslatePipe],
  template: `
    <div class="dashboard-page fade-in">
      <!-- Welcome Header -->
      <div class="welcome-header">
        <div>
          <h1 class="welcome-title">{{ 'dashboard.welcome' | translate }}, {{ currentUserName }}!</h1>
          <p class="welcome-subtitle">{{ 'dashboard.subtitle' | translate }}</p>
        </div>

        <div class="header-right">
          <span class="role-badge">{{ currentUserRole }}</span>
          <button class="pos-btn pos-btn--secondary" (click)="loadDashboardData()" [disabled]="loading">
            <app-icon name="refresh" [size]="16" [class.spinning]="loading"></app-icon>
            <span>{{ 'common.refresh' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- KPI Cards Grid -->
      <div class="kpi-grid">
        <!-- KPI 1: Today's Revenue -->
        <div class="kpi-card kpi-card--revenue">
          <div class="kpi-header">
            <span class="kpi-title">{{ 'dashboard.todayRevenue' | translate }}</span>
            <div class="kpi-icon"><app-icon name="coins" [size]="28"></app-icon></div>
          </div>
          <div class="kpi-value">{{ totalRevenue | number:'1.0-0' }} <small>{{ 'common.currency' | translate }}</small></div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ 'dashboard.paidOrdersCount' | translate:{ count: paidOrdersCount } }}</span>
          </div>
        </div>

        <!-- KPI 2: Active Orders -->
        <div class="kpi-card kpi-card--orders">
          <div class="kpi-header">
            <span class="kpi-title">{{ 'dashboard.activeOrders' | translate }}</span>
            <div class="kpi-icon"><app-icon name="orders" [size]="28"></app-icon></div>
          </div>
          <div class="kpi-value">{{ activeOrdersCount }} <small>ta</small></div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ 'dashboard.cookingCount' | translate:{ count: kitchenOrdersCount } }}</span>
          </div>
        </div>

        <!-- KPI 3: Occupied Tables -->
        <div class="kpi-card kpi-card--tables">
          <div class="kpi-header">
            <span class="kpi-title">{{ 'dashboard.occupiedTables' | translate }}</span>
            <div class="kpi-icon"><app-icon name="tables" [size]="28"></app-icon></div>
          </div>
          <div class="kpi-value">{{ occupiedTablesCount }} / {{ tables.length }} <small>band</small></div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ 'dashboard.freeTablesCount' | translate:{ count: freeTablesCount } }}</span>
          </div>
        </div>

        <!-- KPI 4: Ready Orders -->
        <div class="kpi-card kpi-card--ready">
          <div class="kpi-header">
            <span class="kpi-title">{{ 'dashboard.readyOrders' | translate }}</span>
            <div class="kpi-icon"><app-icon name="check-circle" [size]="28"></app-icon></div>
          </div>
          <div class="kpi-value">{{ readyOrdersCount }} <small>ta</small></div>
          <div class="kpi-footer">
            <span class="kpi-subtext">{{ 'dashboard.readyToServe' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcuts -->
      <div class="quick-actions-bar">
        <a routerLink="/pos" class="action-card action-card--pos">
          <span class="act-icon"><app-icon name="plus" [size]="22"></app-icon></span>
          <div class="act-info">
            <strong>{{ 'dashboard.newOrder' | translate }}</strong>
            <span>{{ 'dashboard.openPos' | translate }}</span>
          </div>
        </a>

        <a routerLink="/tables" class="action-card action-card--tables">
          <span class="act-icon"><app-icon name="tables" [size]="22"></app-icon></span>
          <div class="act-info">
            <strong>{{ 'nav.tables' | translate }}</strong>
            <span>{{ 'dashboard.tablesStatus' | translate }}</span>
          </div>
        </a>

        <a routerLink="/kitchen" class="action-card action-card--kitchen">
          <span class="act-icon"><app-icon name="chef" [size]="22"></app-icon></span>
          <div class="act-info">
            <strong>{{ 'nav.kitchen' | translate }}</strong>
            <span>{{ 'dashboard.cookOrders' | translate }}</span>
          </div>
        </a>

        <a routerLink="/orders" class="action-card action-card--cashier">
          <span class="act-icon"><app-icon name="credit-card" [size]="22"></app-icon></span>
          <div class="act-info">
            <strong>{{ 'nav.pos' | translate }}</strong>
            <span>{{ 'dashboard.checksAndPayments' | translate }}</span>
          </div>
        </a>
      </div>

      <!-- Two Column Layout: Recent Orders & Tables Overview -->
      <div class="dashboard-columns">
        <!-- Left: Active Orders List -->
        <div class="pos-card section-card">
          <div class="pos-card__header">
            <h2 class="pos-card__title"><app-icon name="clock" [size]="18"></app-icon> {{ 'dashboard.recentOrders' | translate }}</h2>
            <a routerLink="/orders" class="view-all-link">{{ 'common.all' | translate }} →</a>
          </div>

          <div *ngIf="activeOrders.length === 0" class="empty-list">
            <p>{{ 'orders.noActiveOrders' | translate }}</p>
          </div>

          <div *ngIf="activeOrders.length > 0" class="recent-orders-list">
            <div *ngFor="let order of recentActiveOrders" class="order-item-row">
              <div class="row-left">
                <span class="tbl-tag">{{ order.tableName || order.tableNumber || 'Stol' }}</span>
                <div>
                  <strong>#{{ order.orderNumber }}</strong>
                  <div class="meta-sub">{{ order.items?.length || 0 }} xil taom • {{ order.waiterName || 'Ofitsiant' }}</div>
                </div>
              </div>
              <div class="row-right">
                <span class="sum-tag">{{ (order.total || order.subtotal || 0) | number:'1.0-0' }} {{ 'common.currency' | translate }}</span>
                <span class="badge-mini" [ngClass]="order.status?.toLowerCase()">{{ order.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Tables Floor Overview -->
        <div class="pos-card section-card">
          <div class="pos-card__header">
            <h2 class="pos-card__title"><app-icon name="tables" [size]="18"></app-icon> {{ 'dashboard.tablesMap' | translate }}</h2>
            <a routerLink="/tables" class="view-all-link">{{ 'common.view' | translate }} →</a>
          </div>

          <div class="tables-mini-grid">
            <div
              *ngFor="let t of tables"
              class="mini-table-box"
              [class.occupied]="t.status === 'OCCUPIED'"
              [class.free]="t.status !== 'OCCUPIED'">
              <span class="t-name">{{ t.name || ('Stol ' + t.tableNumber) }}</span>
              <span class="t-status">{{ (t.status === 'OCCUPIED' ? 'tables.statusOccupied' : 'tables.statusAvailable') | translate }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px);
      flex-wrap: wrap;
    }

    .welcome-title {
      font-size: clamp(18px, 2.5vw, 24px);
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .welcome-subtitle {
      font-size: clamp(12px, 1.2vw, 13.5px);
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-badge {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(99, 102, 241, 0.3);
      white-space: nowrap;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      @media (max-width: 1279px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: clamp(14px, 2vw, 20px);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all var(--transition);

      &:hover {
        border-color: var(--border-light);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &--revenue { border-left: 4px solid #10b981; }
      &--orders { border-left: 4px solid #6366f1; }
      &--tables { border-left: 4px solid #f59e0b; }
      &--ready { border-left: 4px solid #3b82f6; }
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-icon {
      font-size: 24px;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);

      small {
        font-size: 14px;
        color: var(--text-muted);
        font-weight: 500;
      }
    }

    .kpi-footer {
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--divider);
      padding-top: 8px;
    }

    /* Quick Actions */
    .quick-actions-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      @media (max-width: 767px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      @media (max-width: 359px) {
        grid-template-columns: 1fr;
      }
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: clamp(10px, 1.5vw, 16px);
      text-decoration: none;
      color: var(--text-primary);
      transition: all var(--transition);

      &:hover {
        background: var(--bg-hover);
        border-color: var(--primary);
        transform: translateY(-2px);
      }

      .act-icon {
        font-size: 24px;
        background: var(--bg-card);
        padding: 8px;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
      }

      .act-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        strong {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        span {
          font-size: 11.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    /* Dashboard Columns */
    .dashboard-columns {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    .section-card {
      padding: clamp(14px, 2vw, 20px);
    }

    .view-all-link {
      font-size: 13px;
      color: var(--primary-light);
      text-decoration: none;
      font-weight: 600;
      &:hover { text-decoration: underline; }
    }

    .recent-orders-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .order-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      gap: 10px;

      @media (max-width: 599px) {
        flex-direction: column;
        align-items: stretch;
      }

      .row-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .tbl-tag {
        background: var(--primary);
        color: white;
        font-weight: 700;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .meta-sub {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-right {
        display: flex;
        align-items: center;
        gap: 10px;

        @media (max-width: 599px) {
          justify-content: space-between;
          border-top: 1px solid var(--divider);
          padding-top: 6px;
        }
      }

      .sum-tag {
        font-weight: 700;
        color: #34d399;
        font-size: 13.5px;
      }

      .badge-mini {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        background: var(--bg-card);
        color: var(--text-secondary);
      }
    }

    @media (max-width: 767px) {
      .welcome-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .header-right {
          justify-content: space-between;
          width: 100%;

          .pos-btn {
            min-height: 40px;
            padding: 8px 14px;
          }
        }
      }
    }

    /* Mini Tables Grid */
    .tables-mini-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .mini-table-box {
      background: var(--bg-secondary);
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 8px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .t-name {
        font-weight: 700;
        font-size: 13px;
        color: var(--text-primary);
      }

      .t-status {
        font-size: 11px;
        font-weight: 600;
      }

      &.free {
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(16, 185, 129, 0.05);
        .t-status { color: var(--success); }
      }

      &.occupied {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.1);
        .t-status { color: #f87171; }
      }
    }

    .empty-list {
      padding: 30px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  orders: Order[] = [];
  tables: RestaurantTable[] = [];
  loading = false;

  constructor(
    private orderService: OrderService,
    private tableService: TableService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  get currentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || user?.username || 'Foydalanuvchi';
  }

  get currentUserRole(): string {
    const user = this.authService.getCurrentUser();
    return user?.role || 'Xodim';
  }

  loadDashboardData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.orderService.getActiveOrders().subscribe({
      next: (ordersRes) => {
        this.orders = ordersRes.data || [];
        this.cdr.markForCheck();

        this.tableService.getTables().subscribe({
          next: (tablesRes) => {
            this.tables = tablesRes.data || [];
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to load tables', err);
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get totalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'PAID')
      .reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0);
  }

  get paidOrdersCount(): number {
    return this.orders.filter(o => o.status === 'PAID').length;
  }

  get activeOrders(): Order[] {
    return this.orders.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED');
  }

  get recentActiveOrders(): Order[] {
    return this.activeOrders.slice(0, 5);
  }

  get activeOrdersCount(): number {
    return this.activeOrders.length;
  }

  get kitchenOrdersCount(): number {
    return this.orders.filter(o => o.status === 'SENT_TO_KITCHEN' || o.status === 'PREPARING').length;
  }

  get readyOrdersCount(): number {
    return this.orders.filter(o => o.status === 'READY').length;
  }

  get occupiedTablesCount(): number {
    return this.tables.filter(t => t.status === 'OCCUPIED').length;
  }

  get freeTablesCount(): number {
    return this.tables.filter(t => t.status !== 'OCCUPIED').length;
  }
}
