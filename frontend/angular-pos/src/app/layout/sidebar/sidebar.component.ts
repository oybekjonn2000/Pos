import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { FeatureService } from '../../core/services/feature.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface NavItem {
  icon: string;
  label: string;
  key?: string;
  route: string;
  permission?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  disallowRoles?: string[];
  badge?: number;
  proOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppIconComponent, TranslatePipe],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen">
      <!-- Logo -->
      <div class="sidebar__logo">
        <div class="sidebar__logo-wrap" (click)="toggleCollapse()">
          <div class="sidebar__logo-icon">
            <app-icon [name]="auth.isSuperAdmin() ? 'globe' : 'restaurant'" [size]="24"></app-icon>
          </div>
          @if (!collapsed() || mobileOpen) {
            <div class="sidebar__logo-text">
              <span class="sidebar__brand">{{ auth.isSuperAdmin() ? 'Platform Admin' : 'RestaurantPOS' }}</span>
              <span class="sidebar__version">{{ auth.isSuperAdmin() ? 'Markaziy Nazorat' : 'v1.0.0' }}</span>
            </div>
          }
        </div>
        @if (mobileOpen) {
          <button type="button" class="sidebar__mobile-close" (click)="closeMobile.emit()" aria-label="Yopish">
            <app-icon name="close" [size]="16"></app-icon>
          </button>
        }
      </div>

      <!-- Navigation Items -->
      <div class="sidebar__nav">
        @for (item of visibleNavItems(); track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="active"
             class="sidebar__item"
             (click)="onItemClick()"
             [title]="collapsed() && !mobileOpen ? (item.key ? (item.key | translate) : item.label) : ''">
            <span class="sidebar__icon"><app-icon [name]="item.icon" [size]="20"></app-icon></span>
            @if (!collapsed() || mobileOpen) {
              <span class="sidebar__label">{{ item.key ? (item.key | translate) : item.label }}</span>
              @if (item.proOnly) {
                <span class="sidebar__pro-badge" [class.unlocked]="featureService.isPro()">PRO</span>
              }
              @if (item.badge) {
                <span class="sidebar__badge">{{ item.badge }}</span>
              }
            }
          </a>
        }
      </div>

      <!-- Bottom User & Server Section -->
      <div class="sidebar__footer">
        @if (lan.isDesktop()) {
          <div class="sidebar__server-badge" (click)="openLanSettings.emit()" [title]="'Markaziy POS Server: ' + lan.currentServerUrl()">
            <span class="server-dot" [class.online]="lan.connectionState() === 'ONLINE'" [class.reconnecting]="lan.connectionState() === 'RECONNECTING'" [class.offline]="lan.connectionState() === 'OFFLINE'"></span>
            @if (!collapsed() || mobileOpen) {
              <div class="server-badge-text">
                <span class="server-status-title">{{ lan.connectionState() === 'ONLINE' ? 'POS Server Online' : 'Server Offline' }}</span>
                <span class="server-status-ip">{{ lan.currentServerUrl().replace('http://', '') }}</span>
              </div>
              <span class="server-badge-cog"><app-icon name="settings" [size]="14"></app-icon></span>
            }
          </div>
        }

        <div class="sidebar__user" [title]="collapsed() && !mobileOpen ? auth.user()?.fullName ?? '' : ''">
          <div class="sidebar__avatar">
            {{ getUserInitials() }}
          </div>
          @if (!collapsed() || mobileOpen) {
            <div class="sidebar__user-info">
              <div class="sidebar__user-name">{{ auth.user()?.fullName }}</div>
              <div class="sidebar__user-role">{{ auth.user()?.role || auth.user()?.username }}</div>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border);
      transition: width var(--transition-slow);
      z-index: 1000;
      overflow: hidden;

      &.collapsed {
        width: var(--sidebar-collapsed-width);
      }

      &__logo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        height: var(--topbar-height);
        border-bottom: 1px solid var(--divider);
        user-select: none;
        flex-shrink: 0;
      }

      &__logo-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        flex: 1;
        overflow: hidden;
      }

      &__mobile-close {
        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 13px;
        margin-left: 8px;
        flex-shrink: 0;

        &:active {
          background: var(--bg-hover);
        }
      }

      &__logo-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      &__brand {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        white-space: nowrap;
      }

      &__version {
        font-size: 11px;
        color: var(--text-muted);
        display: block;
      }

      &__nav {
        flex: 1;
        overflow-y: auto;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all var(--transition);
        white-space: nowrap;
        position: relative;

        &:hover {
          background: var(--sidebar-active);
          color: var(--text-primary);
        }

        &.active {
          background: rgba(var(--primary-rgb), 0.14);
          color: var(--primary);
          font-weight: 600;
        }
      }

      &__icon { font-size: 18px; flex-shrink: 0; }

      &__badge {
        margin-left: auto;
        background: var(--danger);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 100px;
        min-width: 20px;
        text-align: center;
      }

      &__pro-badge {
        margin-left: auto;
        font-size: 10px;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 4px;
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.4);
        letter-spacing: 0.5px;

        &.unlocked {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.3);
        }
      }

      &__footer {
        padding: 12px 8px;
        border-top: 1px solid var(--divider);
        flex-shrink: 0;
      }

      &__user {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background var(--transition);

        &:hover { background: var(--sidebar-active); }
      }

      &__avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      &__server-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        .server-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;

          &.online { background: #10b981; box-shadow: 0 0 6px #10b981; }
          &.reconnecting { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
          &.offline { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        }

        .server-badge-text {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;

          .server-status-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
          }

          .server-status-ip {
            font-size: 10px;
            color: var(--text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .server-badge-cog {
          font-size: 12px;
          opacity: 0.6;
        }
      }

      &__user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
      }

      &__user-role {
        font-size: 11px;
        color: var(--text-muted);
      }
    }

    /* Tablet compact icon mode (768px - 1023px) */
    @media (min-width: 768px) and (max-width: 1023px) {
      .sidebar {
        width: 68px !important;
        transform: translateX(0) !important;

        .sidebar__logo-text,
        .sidebar__label,
        .sidebar__user-info,
        .server-badge-text,
        .server-badge-cog {
          display: none !important;
        }

        .sidebar__item {
          justify-content: center;
          padding: 12px 0;
        }

        .sidebar__logo {
          justify-content: center;
          padding: 0;
        }

        .sidebar__logo-wrap {
          justify-content: center;
        }

        .sidebar__server-badge,
        .sidebar__user {
          justify-content: center;
          padding: 8px 0;
        }
      }
    }

    /* Mobile drawer mode (< 768px) */
    @media (max-width: 767px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        height: 100vh;
        width: 285px !important;
        transform: translateX(-100%);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10002;
        box-shadow: none;

        &.mobile-open {
          transform: translateX(0);
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
        }

        .sidebar__mobile-close {
          display: flex;
        }

        .sidebar__item {
          min-height: 44px;
        }
      }
    }
  `]
})
export class SidebarComponent {
  @Input() mobileOpen = false;
  @Output() closeMobile = new EventEmitter<void>();
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() openLanSettings = new EventEmitter<void>();

  collapsed = signal(false);
  lan = inject(LanStatusService);
  featureService = inject(FeatureService);

  onItemClick(): void {
    this.closeMobile.emit();
  }

  readonly platformNavItems: NavItem[] = [
    { icon: 'dashboard', label: 'Platforma Dashboard', route: '/platform/dashboard' },
    { icon: 'building', label: 'Restoranlar', route: '/platform/restaurants' },
    { icon: 'credit-card', label: 'Obunalar', route: '/platform/subscriptions' },
    { icon: 'cash', label: 'To‘lovlar', route: '/platform/payments' },
    { icon: 'coins', label: 'Savdo monitoringi', route: '/platform/sales' },
    { icon: 'users', label: 'Xodimlar monitoringi', route: '/platform/employees' },
    { icon: 'laptop', label: 'Qurilmalar', route: '/platform/devices' },
    { icon: 'trending-up', label: 'Platforma hisobotlari', route: '/platform/reports' }
  ];

  readonly restaurantNavItems: NavItem[] = [
    { icon: 'dashboard', label: 'Boshqaruv paneli', key: 'nav.dashboard', route: '/dashboard', permission: 'VIEW_DASHBOARD' },
    { icon: 'tables', label: 'Joylar va Stollar', key: 'nav.tables', route: '/tables' },
    { icon: 'orders', label: 'Buyurtmalar', key: 'nav.orders', route: '/orders' },
    { icon: 'chef', label: 'Oshxona (KDS)', key: 'nav.kitchen', route: '/kitchen', permission: 'KITCHEN_VIEW', proOnly: true },
    { icon: 'smartphone', label: 'Mobil Ofitsiant', key: 'nav.pos', route: '/devices', permission: 'MANAGE_DEVICES', proOnly: true },
    { icon: 'products', label: 'Mahsulotlar', key: 'nav.products', route: '/products', permission: 'MANAGE_PRODUCTS' },
    { icon: 'folder', label: 'Kategoriyalar', key: 'nav.categories', route: '/categories', permission: 'MANAGE_CATEGORIES' },
    { icon: 'cooking-pot', label: 'Oshxonalar', key: 'nav.kitchenManagement', route: '/kitchens', permission: 'MANAGE_SETTINGS', disallowRoles: ['KITCHEN', 'WAITER'] },
    // { icon: 'products', label: 'Ombor', route: '/inventory', permission: 'VIEW_STOCK' }, // Hozircha disable qilindi
    { icon: 'users', label: 'Mijozlar', route: '/customers', adminOnly: true },
    { icon: 'user', label: 'Xodimlar', key: 'nav.employees', route: '/employees', permission: 'MANAGE_USERS' },
    { icon: 'trending-up', label: 'Hisobotlar', key: 'nav.reports', route: '/reports', permission: 'VIEW_REPORTS' },
    { icon: 'credit-card', label: 'Tarif & Billing', key: 'nav.billing', route: '/restaurant/billing', adminOnly: true },
    { icon: 'settings', label: 'Sozlamalar', key: 'nav.settings', route: '/settings', permission: 'MANAGE_SETTINGS' }
  ];

  constructor(public auth: AuthService) {}

  visibleNavItems(): NavItem[] {
    if (this.auth.isSuperAdmin()) {
      return this.platformNavItems;
    }

    const role = (this.auth.user()?.role || '').toUpperCase();

    return this.restaurantNavItems.filter(item => {
      if (item.adminOnly && !this.auth.isAdmin()) {
        return false;
      }
      if (item.disallowRoles && item.disallowRoles.includes(role)) {
        return false;
      }
      // Kitchen user must ONLY see /kitchen
      if (role === 'KITCHEN' && item.route !== '/kitchen') {
        return false;
      }
      // Waiter user must ONLY see /tables and /orders
      if (role === 'WAITER' && item.route !== '/tables' && item.route !== '/orders') {
        return false;
      }
      if (this.auth.isAdmin()) {
        return true;
      }
      return !item.permission || this.auth.hasPermission(item.permission);
    });
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  getUserInitials(): string {
    const name = this.auth.user()?.fullName ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
