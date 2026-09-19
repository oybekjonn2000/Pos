import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformService, PlatformEmployeeItem, PlatformRestaurantSummary } from '../../core/services/platform.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-platform-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="platform-container">
      <!-- Header Banner -->
      <div class="platform-header">
        <div class="platform-header__info">
          <div class="platform-badge">
            <span class="badge-icon">👥</span> Xodimlar Monitoringi (Tarmoq Bo‘ylab)
          </div>
          <h1 class="platform-title">Markazlashgan Xodimlar Nazorati</h1>
          <p class="platform-subtitle">
            Barcha restoranlarning xodimlari, rollari, statusi va hisoblarini markazlashgan holda kuzatish va boshqarish.
          </p>
        </div>
        <div class="platform-header__actions">
          <button type="button" class="btn btn-secondary" (click)="loadEmployees()" [disabled]="isLoading()">
            <span class="btn-icon">🔄</span> Yangilash
          </button>
        </div>
      </div>

      <!-- Quick Stats Counter -->
      <div class="stats-row">
        <div class="stat-pill">
          <span class="stat-pill__label">Jami xodimlar:</span>
          <span class="stat-pill__val">{{ employees().length }}</span>
        </div>
        <div class="stat-pill stat-pill--success">
          <span class="stat-pill__label">Faol xodimlar:</span>
          <span class="stat-pill__val">{{ activeCount() }}</span>
        </div>
        <div class="stat-pill stat-pill--warning">
          <span class="stat-pill__label">To‘xtatilgan:</span>
          <span class="stat-pill__val">{{ suspendedCount() }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">Adminlar:</span>
          <span class="stat-pill__val">{{ adminCount() }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">Ofitsiantlar:</span>
          <span class="stat-pill__val">{{ waiterCount() }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">Oshxona / Oshpazlar:</span>
          <span class="stat-pill__val">{{ kitchenCount() }}</span>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-item filter-item--search">
            <label class="filter-label">Qidiruv (Ism yoki Login)</label>
            <input
              type="text"
              class="pos-input"
              placeholder="Qidirish..."
              [(ngModel)]="searchQuery"
            />
          </div>
          <div class="filter-item">
            <label class="filter-label">Filial / Restoran</label>
            <select class="pos-input" [(ngModel)]="selectedRestaurantId" (change)="loadEmployees()">
              <option value="">Barcha restoranlar</option>
              @for (r of restaurants(); track r.id) {
                <option [value]="r.id">{{ r.name }} ({{ r.code }})</option>
              }
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">Xodim Roli</label>
            <select class="pos-input" [(ngModel)]="selectedRole" (change)="loadEmployees()">
              <option value="">Barcha rollar</option>
              <option value="ADMIN">Administrator</option>
              <option value="WAITER">Ofitsiant</option>
              <option value="CASHIER">Kassir</option>
              <option value="KITCHEN">Oshxona</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">Holati</label>
            <select class="pos-input" [(ngModel)]="selectedStatus" (change)="loadEmployees()">
              <option value="">Barchasi</option>
              <option value="true">🟢 Faol</option>
              <option value="false">⏸️ To‘xtatilgan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Employees Table Card -->
      <div class="table-card">
        <div class="table-card__header">
          <div class="table-card__title-wrap">
            <h3 class="table-card__title">Ro‘yxatdagi Xodimlar</h3>
            <span class="table-card__count">{{ filteredEmployees().length }} nafar xodim</span>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Xodimlar ma’lumotlari yuklanmoqda...</p>
          </div>
        } @else if (filteredEmployees().length === 0) {
          <div class="empty-box">
            <div class="empty-icon">👥</div>
            <h4>Xodimlar topilmadi</h4>
            <p>Tanlangan mezonlar bo‘yicha hech qanday xodim ma’lumoti mavjud emas.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="platform-table">
              <thead>
                <tr>
                  <th>Xodim</th>
                  <th>Login (Username)</th>
                  <th>Restoran</th>
                  <th>Roli</th>
                  <th>Aloqa</th>
                  <th>Holati</th>
                  <th>Ro‘yxatdan o‘tgan</th>
                  <th style="text-align: right">Platforma Amali</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of filteredEmployees(); track emp.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ getInitials(emp.fullName || emp.username) }}</div>
                        <div class="user-meta">
                          <span class="user-name">{{ emp.fullName || emp.username }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="username-pill">{{ emp.username }}</span>
                    </td>
                    <td>
                      <div class="restaurant-badge-cell">
                        <span class="res-name">{{ emp.restaurantName || 'Boshqaruv' }}</span>
                        @if (emp.restaurantCode) {
                          <span class="code-badge">{{ emp.restaurantCode }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span
                        class="role-pill"
                        [class.role-admin]="isRole(emp.role, 'ADMIN')"
                        [class.role-waiter]="isRole(emp.role, 'WAITER')"
                        [class.role-kitchen]="isRole(emp.role, 'KITCHEN')"
                        [class.role-cashier]="isRole(emp.role, 'CASHIER')"
                      >
                        {{ getRoleLabel(emp.role) }}
                      </span>
                    </td>
                    <td>
                      <div class="contact-info">
                        <div>{{ emp.phone || '—' }}</div>
                        @if (emp.email) {
                          <div class="text-xs text-muted">{{ emp.email }}</div>
                        }
                      </div>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-active]="emp.active"
                        [class.status-suspended]="!emp.active"
                      >
                        {{ emp.active ? '🟢 Faol' : '⏸️ To‘xtatilgan' }}
                      </span>
                    </td>
                    <td class="text-muted text-xs">
                      {{ emp.createdAt ? (emp.createdAt | date:'dd.MM.yyyy HH:mm') : '—' }}
                    </td>
                    <td style="text-align: right">
                      @if (emp.restaurantId) {
                        @if (emp.active) {
                          <button
                            type="button"
                            class="action-btn action-btn--suspend"
                            (click)="toggleEmployeeStatus(emp, false)"
                            [disabled]="actionLoading() === emp.id"
                            title="Xodim hisobini vaqtinchalik bloklash"
                          >
                            ⏸️ Bloklash
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="action-btn action-btn--activate"
                            (click)="toggleEmployeeStatus(emp, true)"
                            [disabled]="actionLoading() === emp.id"
                            title="Xodim hisobini qayta faollashtirish"
                          >
                            ▶️ Faollashtirish
                          </button>
                        }
                      } @else {
                        <span class="text-muted text-xs">Platforma Admini</span>
                      }
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

    /* Stats Pill Row */
    .stats-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-pill {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: var(--shadow-sm);

      &__label {
        font-size: 12px;
        color: var(--text-muted);
      }

      &__val {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
      }

      &--success .stat-pill__val {
        color: #059669;
      }

      &--warning .stat-pill__val {
        color: #d97706;
      }
    }

    /* Filters Card */
    .filter-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      box-shadow: var(--shadow-sm);
    }

    .filter-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;

      &--search {
        flex: 1;
        min-width: 240px;
      }
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

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
    }

    .user-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .username-pill {
      font-family: var(--font-mono, monospace);
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 12px;
    }

    .restaurant-badge-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .res-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .code-badge {
      padding: 2px 6px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
    }

    .role-pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;

      &.role-admin {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
        border: 1px solid rgba(239, 68, 68, 0.25);
      }

      &.role-waiter {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        border: 1px solid rgba(59, 130, 246, 0.25);
      }

      &.role-kitchen {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.25);
      }

      &.role-cashier {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        border: 1px solid rgba(16, 185, 129, 0.25);
      }
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
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
        border: 1px solid rgba(239, 68, 68, 0.25);
      }
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &--suspend {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
        border: 1px solid rgba(239, 68, 68, 0.25);

        &:hover:not(:disabled) {
          background: #dc2626;
          color: #fff;
        }
      }

      &--activate {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        border: 1px solid rgba(16, 185, 129, 0.25);

        &:hover:not(:disabled) {
          background: #059669;
          color: #fff;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

      &.btn-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border: 1px solid var(--border);
        &:hover {
          background: var(--bg-hover);
        }
      }
    }

    .text-muted { color: var(--text-muted); }
    .text-xs { font-size: 11px; }

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
export class PlatformEmployeesComponent implements OnInit {
  private platformService = inject(PlatformService);
  private notify = inject(NotificationService);

  employees = signal<PlatformEmployeeItem[]>([]);
  restaurants = signal<PlatformRestaurantSummary[]>([]);
  isLoading = signal(false);
  actionLoading = signal<string | null>(null);

  searchQuery = '';
  selectedRestaurantId = '';
  selectedRole = '';
  selectedStatus = '';

  filteredEmployees = computed(() => {
    let list = this.employees();
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(e =>
        (e.fullName && e.fullName.toLowerCase().includes(query)) ||
        (e.username && e.username.toLowerCase().includes(query)) ||
        (e.restaurantName && e.restaurantName.toLowerCase().includes(query)) ||
        (e.phone && e.phone.includes(query))
      );
    }
    return list;
  });

  activeCount = computed(() => this.employees().filter(e => e.active).length);
  suspendedCount = computed(() => this.employees().filter(e => !e.active).length);
  adminCount = computed(() => this.employees().filter(e => this.isRole(e.role, 'ADMIN')).length);
  waiterCount = computed(() => this.employees().filter(e => this.isRole(e.role, 'WAITER')).length);
  kitchenCount = computed(() => this.employees().filter(e => this.isRole(e.role, 'KITCHEN')).length);

  ngOnInit(): void {
    this.loadRestaurants();
    this.loadEmployees();
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

  loadEmployees(): void {
    this.isLoading.set(true);
    let activeFilter: boolean | undefined = undefined;
    if (this.selectedStatus === 'true') activeFilter = true;
    if (this.selectedStatus === 'false') activeFilter = false;

    this.platformService.getAllEmployees(
      this.selectedRestaurantId || undefined,
      this.selectedRole || undefined,
      activeFilter
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.employees.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notify.error('Xodimlar ro‘yxatini yuklashda xatolik.');
      }
    });
  }

  toggleEmployeeStatus(emp: PlatformEmployeeItem, newActive: boolean): void {
    if (!emp.restaurantId) return;
    this.actionLoading.set(emp.id);

    this.platformService.updateEmployeeStatus(emp.restaurantId, emp.id, newActive).subscribe({
      next: (res) => {
        this.actionLoading.set(null);
        if (res.success) {
          this.notify.success(
            newActive
              ? `${emp.fullName || emp.username} qayta faollashtirildi.`
              : `${emp.fullName || emp.username} hisobi to‘xtatildi.`
          );
          // Update local status immediately
          this.employees.update(list =>
            list.map(e => (e.id === emp.id ? { ...e, active: newActive } : e))
          );
        }
      },
      error: () => {
        this.actionLoading.set(null);
        this.notify.error('Xodim statusini o‘zgartirishda xatolik yuz berdi.');
      }
    });
  }

  isRole(roleStr: string, target: string): boolean {
    if (!roleStr) return false;
    return roleStr.toUpperCase().includes(target);
  }

  getRoleLabel(roleStr: string): string {
    const r = (roleStr || '').toUpperCase();
    if (r.includes('ADMIN')) return '👑 Admin';
    if (r.includes('WAITER')) return '🍽️ Ofitsiant';
    if (r.includes('KITCHEN')) return '👨‍🍳 Oshxona';
    if (r.includes('CASHIER')) return '💵 Kassir';
    return roleStr || 'Xodim';
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
