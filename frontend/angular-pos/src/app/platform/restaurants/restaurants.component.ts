import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService, RestaurantItem, CreateAdminPayload } from '../../core/services/restaurant.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-super-admin-restaurants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  template: `
    <div class="platform-container">
      <!-- Header Banner -->
      <div class="platform-header">
        <div class="platform-header__info">
          <div class="platform-badge">
            <span class="badge-icon"><app-icon name="globe" [size]="14"></app-icon></span> Platforma Boshqaruv Markazi
          </div>
          <h1 class="platform-title">Restoranlar Tarmog‘i (Multi-Tenant)</h1>
          <p class="platform-subtitle">
            O‘zbekiston bo‘ylab barcha filial va mustaqil restoranlar hisobini markazlashgan holda boshqaring.
          </p>
        </div>
        <div class="platform-header__actions">
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            <span class="btn-icon"><app-icon name="plus" [size]="14"></app-icon></span> Yangi Restoran Qo‘shish
          </button>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__icon"><app-icon name="building" [size]="20"></app-icon></div>
          <div class="stat-card__body">
            <div class="stat-card__label">Jami Restoranlar</div>
            <div class="stat-card__val">{{ restaurants().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon"><app-icon name="check-circle" [size]="20"></app-icon></div>
          <div class="stat-card__body">
            <div class="stat-card__label">Faol Filiallar (Active)</div>
            <div class="stat-card__val">{{ activeCount() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;"><app-icon name="pause" [size]="20"></app-icon></div>
          <div class="stat-card__body">
            <div class="stat-card__label">To‘xtatilgan (Suspended)</div>
            <div class="stat-card__val">{{ suspendedCount() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon"><app-icon name="shield" [size]="20"></app-icon></div>
          <div class="stat-card__body">
            <div class="stat-card__label">Tenant Izolyatsiyasi</div>
            <div class="stat-card__val text-sm font-semibold text-emerald-500">100% Himoyalangan</div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="filter-bar">
        <div class="search-input-box">
          <span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>
          <input
            type="text"
            class="search-input"
            placeholder="Restoran nomi yoki kodi bo‘yicha qidirish..."
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
          />
        </div>
        <div class="filter-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="statusFilter() === 'ALL'"
            (click)="statusFilter.set('ALL')"
          >
            Barchasi ({{ restaurants().length }})
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="statusFilter() === 'ACTIVE'"
            (click)="statusFilter.set('ACTIVE')"
          >
            Faol
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="statusFilter() === 'SUSPENDED'"
            (click)="statusFilter.set('SUSPENDED')"
          >
            <app-icon name="pause" [size]="14"></app-icon> To‘xtatilgan
          </button>
        </div>
      </div>

      <!-- Restaurant List Table -->
      <div class="card table-card">
        @if (loading()) {
          <div class="state-loading">
            <div class="spinner"></div>
            <span>Restoranlar ro‘yxati yuklanmoqda...</span>
          </div>
        } @else if (filteredRestaurants().length === 0) {
          <div class="state-empty">
            <div class="empty-icon"><app-icon name="building" [size]="48"></app-icon></div>
            <div class="empty-title">Restoranlar topilmadi</div>
            <div class="empty-desc">Hozircha hech qanday restoran mavjud emas yoki qidiruv natija bermadi.</div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Restoran Nomi</th>
                  <th>Kodi</th>
                  <th>Telefon / Manzil</th>
                  <th>INN / STIR</th>
                  <th>Status</th>
                  <th style="text-align: right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                @for (res of filteredRestaurants(); track res.id) {
                  <tr>
                    <td>
                      <div class="res-info-cell">
                        <div class="res-avatar"><app-icon name="building" [size]="20"></app-icon></div>
                        <div>
                          <div class="res-name">{{ res.name }}</div>
                          <div class="res-id text-muted">ID: {{ res.id.slice(0, 8) }}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="code-badge">{{ res.code }}</span>
                    </td>
                    <td>
                      <div class="res-contact">
                        <div>{{ res.phone || '—' }}</div>
                        <div class="text-muted text-xs">{{ res.address || 'Manzil kiritilmagan' }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="inn-badge">{{ res.inn || '—' }}</span>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-active]="res.status === 'ACTIVE'"
                        [class.status-suspended]="res.status === 'SUSPENDED'"
                        [class.status-inactive]="res.status === 'INACTIVE'"
                      >
                        {{ res.status === 'ACTIVE' ? 'FAOL' : (res.status === 'SUSPENDED' ? 'TO‘XTATILGAN' : 'NOFAOL') }}
                      </span>
                    </td>
                    <td style="text-align: right">
                      <div class="actions-group">
                        <button
                          type="button"
                          class="action-btn action-btn--detail"
                          (click)="goToDetail(res.id)"
                          title="Restoran monitoringi va tafsilotlari"
                        >
                          <app-icon name="bar-chart" [size]="14"></app-icon> Tafsilotlar
                        </button>
                        <button
                          type="button"
                          class="action-btn action-btn--admin"
                          (click)="openAddAdminModal(res)"
                          title="Restoran Admini yaratish"
                        >
                          <app-icon name="user-plus" [size]="14"></app-icon> Admin
                        </button>
                        @if (res.status === 'ACTIVE') {
                          <button
                            type="button"
                            class="action-btn action-btn--suspend"
                            (click)="toggleStatus(res, 'SUSPENDED')"
                            title="Restoran faoliyatini vaqtinchalik to‘xtatish"
                          >
                            <app-icon name="pause" [size]="14"></app-icon> To‘xtatish
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="action-btn action-btn--activate"
                            (click)="toggleStatus(res, 'ACTIVE')"
                            title="Restoranni qayta faollashtirish"
                          >
                            <app-icon name="play" [size]="14"></app-icon> Faollashtirish
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal: Yangi Restoran Qo'shish -->
      @if (showCreateModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title"><app-icon name="building" [size]="20"></app-icon> Yangi Restoran Ro‘yxatdan O‘tkazish</h3>
              <button type="button" class="btn-close" (click)="closeCreateModal()"><app-icon name="x" [size]="18"></app-icon></button>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Restoran Nomi *</label>
                    <input
                      type="text"
                      class="pos-input"
                      formControlName="name"
                      placeholder="Masalan: Rayhon Milliy Taomlar"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Restoran Kodi (Unique) *</label>
                    <input
                      type="text"
                      class="pos-input"
                      formControlName="code"
                      placeholder="Masalan: RAY001"
                      style="text-transform: uppercase"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Telefon raqami</label>
                    <input
                      type="text"
                      class="pos-input"
                      formControlName="phone"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">INN / STIR</label>
                    <input
                      type="text"
                      class="pos-input"
                      formControlName="inn"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Manzili</label>
                  <input
                    type="text"
                    class="pos-input"
                    formControlName="address"
                    placeholder="Toshkent sh., Yunusobod tumani..."
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Bekor qilish</button>
                <button type="submit" class="btn btn-primary" [disabled]="createForm.invalid || submitting()">
                  @if (submitting()) {
                    <span class="spinner-sm"></span> Saqlanmoqda...
                  } @else {
                    Restoranni Saqlash
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Restoranga Admin Tayinlash -->
      @if (showAdminModal() && selectedRestaurant()) {
        <div class="modal-backdrop">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title"><app-icon name="user" [size]="20"></app-icon> Restoran Admini Yaratish: {{ selectedRestaurant()?.name }}</h3>
              <button type="button" class="btn-close" (click)="closeAdminModal()"><app-icon name="x" [size]="18"></app-icon></button>
            </div>
            <form [formGroup]="adminForm" (ngSubmit)="submitAdmin()">
              <div class="modal-body">
                <div class="info-alert">
                  Ushbu foydalanuvchi <strong>{{ selectedRestaurant()?.name }}</strong> ({{ selectedRestaurant()?.code }}) boshqaruvchisi (RESTAURANT_ADMIN) bo‘ladi va faqat o‘z restorani ma’lumotlarini ko‘ra oladi.
                </div>

                <div class="form-group">
                  <label class="form-label">To‘liq Ismi (F.I.SH) *</label>
                  <input
                    type="text"
                    class="pos-input"
                    formControlName="fullName"
                    placeholder="Masalan: Sardor Aliyev"
                  />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Login (Username) *</label>
                    <input
                      type="text"
                      class="pos-input"
                      formControlName="username"
                      placeholder="Masalan: admin_rayhon"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Parol *</label>
                    <input
                      type="password"
                      class="pos-input"
                      formControlName="password"
                      placeholder="Kamida 6 belgi"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Telefon raqami</label>
                  <input
                    type="text"
                    class="pos-input"
                    formControlName="phone"
                    placeholder="+998 90 987 65 43"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeAdminModal()">Bekor qilish</button>
                <button type="submit" class="btn btn-primary" [disabled]="adminForm.invalid || submitting()">
                  @if (submitting()) {
                    <span class="spinner-sm"></span> Yaratilmoqda...
                  } @else {
                    Adminni Yaratish
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .platform-container {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .platform-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;

      .platform-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(99, 102, 241, 0.12);
        color: #6366f1;
        padding: 4px 10px;
        border-radius: 100px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .platform-title {
        font-size: 26px;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 6px 0;
      }

      .platform-subtitle {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);

      &__icon {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }

      &__label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &__val {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        margin-top: 2px;
      }
    }

    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .search-input-box {
        position: relative;
        flex: 1;
        min-width: 280px;

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;

          &:focus {
            border-color: var(--primary);
          }
        }
      }

      .filter-tabs {
        display: flex;
        gap: 6px;

        .tab-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }
        }
      }
    }

    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th {
        padding: 14px 18px;
        text-align: left;
        font-size: 12px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 14px 18px;
        border-bottom: 1px solid var(--border);
        font-size: 14px;
        color: var(--text-primary);
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: var(--bg-hover);
      }
    }

    .res-info-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .res-avatar {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      .res-name {
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .code-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--primary);
    }

    .inn-badge {
      font-family: var(--font-mono);
      color: var(--text-secondary);
      font-size: 13px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 100px;
      font-size: 11px;
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

    .actions-group {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: var(--bg-secondary);
      color: var(--text-primary);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }

      &--detail {
        background: rgba(99, 102, 241, 0.12);
        color: #818cf8;
        border-color: rgba(99, 102, 241, 0.3);

        &:hover {
          background: #6366f1;
          color: white;
        }
      }

      &--admin {
        background: rgba(99, 102, 241, 0.1);
        color: #6366f1;
        border-color: rgba(99, 102, 241, 0.2);

        &:hover {
          background: #6366f1;
          color: white;
        }
      }

      &--suspend {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.2);

        &:hover {
          background: #f59e0b;
          color: white;
        }
      }

      &--activate {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.2);

        &:hover {
          background: #10b981;
          color: white;
        }
      }
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 20px;
    }

    .modal-dialog {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 540px;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .modal-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 18px;
        color: var(--text-muted);
        cursor: pointer;
      }
    }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--bg-tertiary);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-alert {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .state-loading, .state-empty {
      padding: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
    }

    .state-empty .empty-icon {
      font-size: 40px;
    }

    .state-empty .empty-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }
  `]
})
export class PlatformRestaurantsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private restaurantService = inject(RestaurantService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  restaurants = signal<RestaurantItem[]>([]);
  loading = signal(false);
  submitting = signal(false);
  searchTerm = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  showCreateModal = signal(false);
  showAdminModal = signal(false);
  selectedRestaurant = signal<RestaurantItem | null>(null);

  createForm: FormGroup;
  adminForm: FormGroup;

  activeCount = computed(() => this.restaurants().filter(r => r.status === 'ACTIVE').length);
  suspendedCount = computed(() => this.restaurants().filter(r => r.status === 'SUSPENDED').length);

  filteredRestaurants = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.restaurants().filter(r => {
      const matchesSearch = !term ||
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        (r.phone && r.phone.toLowerCase().includes(term));

      const matchesStatus = status === 'ALL' || r.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{3,20}$/)]],
      phone: [''],
      address: [''],
      inn: ['']
    });

    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loading.set(true);
    this.restaurantService.getRestaurants().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.restaurants.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error(err.error?.message || 'Restoranlar ro‘yxatini yuklashda xatolik yuz berdi');
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateModal(): void {
    this.createForm.reset();
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;

    this.submitting.set(true);
    const val = this.createForm.value;
    this.restaurantService.createRestaurant({
      name: val.name,
      code: (val.code || '').toUpperCase().trim(),
      phone: val.phone,
      address: val.address,
      inn: val.inn,
      status: 'ACTIVE'
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success && res.data) {
          this.notify.success(`"${res.data.name}" restorani muvaffaqiyatli ro‘yxatdan o‘tkazildi!`);
          this.closeCreateModal();
          this.loadRestaurants();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Restoran yaratishda xatolik yuz berdi');
      }
    });
  }

  openAddAdminModal(res: RestaurantItem): void {
    this.selectedRestaurant.set(res);
    this.adminForm.reset();
    this.showAdminModal.set(true);
  }

  closeAdminModal(): void {
    this.showAdminModal.set(false);
    this.selectedRestaurant.set(null);
  }

  submitAdmin(): void {
    const res = this.selectedRestaurant();
    if (!res || this.adminForm.invalid) return;

    this.submitting.set(true);
    const val = this.adminForm.value;
    const parts = (val.fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || 'Admin';
    const lastName = parts.slice(1).join(' ') || '';

    const payload: CreateAdminPayload = {
      firstName,
      lastName,
      username: val.username.trim(),
      password: val.password,
      phone: val.phone
    };

    this.restaurantService.createAdmin(res.id, payload).subscribe({
      next: (resp) => {
        this.submitting.set(false);
        if (resp.success) {
          this.notify.success(`"${res.name}" uchun admin (${val.username}) yaratildi!`);
          this.closeAdminModal();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Admin yaratishda xatolik yuz berdi');
      }
    });
  }

  toggleStatus(res: RestaurantItem, targetStatus: 'ACTIVE' | 'SUSPENDED'): void {
    const actionName = targetStatus === 'ACTIVE' ? 'faollashtirilsinmi' : 'to‘xtatilsinmi';
    if (!confirm(`Haqiqatan ham "${res.name}" restorani statusi ${actionName}?`)) {
      return;
    }

    this.restaurantService.updateStatus(res.id, targetStatus).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notify.success(`"${res.name}" statusi yangilandi: ${targetStatus}`);
          this.loadRestaurants();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Statusni yangilashda xatolik yuz berdi');
      }
    });
  }

  goToDetail(id: string): void {
    this.router.navigate(['/platform/restaurants', id]);
  }
}
