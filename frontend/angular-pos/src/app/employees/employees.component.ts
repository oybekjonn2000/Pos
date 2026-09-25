import { AppIconComponent } from '../shared/components/icon/icon.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UserService, Employee, Role, CreateEmployeeRequest, UpdateEmployeeRequest } from '../core/services/user.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, AppIconComponent, TranslatePipe],
  template: `
    <div class="employees-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title"><app-icon name="users" [size]="24" class="title-icon"></app-icon> {{ 'employees.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'employees.subtitle' | translate }}</p>
        </div>

        <button class="pos-btn pos-btn--primary" (click)="openCreateModal()">
          <app-icon name="user-plus" [size]="16"></app-icon> <span>{{ 'employees.addEmployee' | translate }}</span>
        </button>
      </div>

      <!-- Segmented Slide Switch: Faol xodimlar / Nofaol xodimlar -->
      <div class="status-slider-strip">
        <div class="status-segmented-slider">
          <button
            type="button"
            class="slider-btn"
            [class.active]="activeTab === 'ACTIVE'"
            (click)="setActiveTab('ACTIVE')">
            <span class="status-dot active-dot"></span>
            <span class="slider-title">{{ 'employees.activeStaff' | translate }}</span>
            <span class="count-badge active-badge">{{ activeCount }}</span>
          </button>

          <button
            type="button"
            class="slider-btn"
            [class.active]="activeTab === 'INACTIVE'"
            (click)="setActiveTab('INACTIVE')">
            <span class="status-dot inactive-dot"></span>
            <span class="slider-title">{{ 'employees.inactiveStaff' | translate }}</span>
            <span class="count-badge inactive-badge">{{ inactiveCount }}</span>
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="filter-strip" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
        <div class="search-box" style="flex: 1; min-width: 220px;">
          <input
            type="text"
            [placeholder]="'common.search' | translate"
            [(ngModel)]="searchQuery"
            (ngModelChange)="pageIndex = 0"
            class="pos-input"
            style="width: 100%;"
          />
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <select [(ngModel)]="roleFilter" (ngModelChange)="pageIndex = 0" class="pos-input pos-select-sm">
            <option value="ALL">Barcha lavozimlar</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Menejer</option>
            <option value="WAITER">Ofitsiant</option>
            <option value="KITCHEN">Oshpaz</option>
            <option value="CASHIER">Kassir</option>
          </select>
        </div>
      </div>

      <!-- Employees Table Card -->
      <div class="pos-card table-card">
        <div *ngIf="loading && employees.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Xodimlar ro'yxati yuklanmoqda...</p>
        </div>

        <div *ngIf="!loading && filteredEmployees.length === 0" class="empty-state">
          <div class="empty-icon"><app-icon [name]="activeTab === 'ACTIVE' ? 'users' : 'check-circle'" [size]="48"></app-icon></div>
          <h3>{{ activeTab === 'ACTIVE' ? 'Faol xodimlar topilmadi' : 'Nofaol xodimlar mavjud emas' }}</h3>
          <p *ngIf="activeTab === 'ACTIVE' && employees.length > 0" style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
            Qidiruv yoki lavozim filtri bo'yicha faol xodim topilmadi.
          </p>
          <p *ngIf="activeTab === 'INACTIVE'" style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
            Ayni paytda barcha xodimlar faol holatda ishlamoqda.
          </p>
          <button *ngIf="activeTab === 'ACTIVE' && employees.length === 0" class="pos-btn pos-btn--primary" (click)="openCreateModal()" style="margin-top: 12px;">
            Yangi xodim qo'shish
          </button>
        </div>

        <div *ngIf="filteredEmployees.length > 0" class="table-responsive">
          <table class="pos-table">
            <thead>
              <tr>
                <th>Xodim (F.I.Sh)</th>
                <th>Kirish / Login</th>
                <th>Lavozim (Rol)</th>
                <th>Telefon</th>
                <th>Holati</th>
                <th style="text-align: right;">Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of pagedEmployees" [class.is-inactive-row]="!emp.active">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar" [class.inactive-avatar]="!emp.active">{{ getInitials(emp) }}</div>
                    <div>
                      <strong>{{ emp.firstName }} {{ emp.lastName || '' }}</strong>
                      <div class="email-sub" *ngIf="emp.email">{{ emp.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="mobile-label">Kirish:</span>
                  <div>
                    <code class="username-tag" *ngIf="emp.username">&#64;{{ emp.username }}</code>
                    <span class="pin-badge" *ngIf="!emp.username"><app-icon name="hash" [size]="12"></app-icon> PIN orqali</span>
                  </div>
                </td>
                <td>
                  <span class="mobile-label">Lavozim:</span>
                  <span class="role-badge" [ngClass]="emp.role?.toLowerCase()">
                    {{ getRoleLabel(emp.role) }}
                  </span>
                </td>
                <td>
                  <span class="mobile-label">Telefon:</span>
                  <span class="phone-val">{{ emp.phone || '—' }}</span>
                </td>
                <td>
                  <span class="mobile-label">Holat:</span>
                  <span class="status-pill" [class.active]="emp.active" [class.inactive]="!emp.active">
                    {{ emp.active ? '● FAOL' : '○ NOFAOL' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-buttons">
                    <button
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="Tahrirlash"
                      (click)="openEditModal(emp)">
                      <app-icon name="edit" [size]="14"></app-icon> Tahrirlash
                    </button>
                    <button
                      *ngIf="emp.username || emp.role === 'ADMIN'"
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="Parolni almashtirish"
                      (click)="openResetPasswordModal(emp)">
                      <app-icon name="key" [size]="14"></app-icon> Parol
                    </button>
                    <button
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="PIN-kodni o'zgartirish"
                      (click)="openQuickPinModal(emp)">
                      <app-icon name="hash" [size]="14"></app-icon> PIN
                    </button>
                    <button
                      *ngIf="emp.active"
                      class="pos-btn pos-btn--danger pos-btn--sm"
                      title="Xodimni nofaol qilish"
                      (click)="toggleActive(emp)">
                      <app-icon name="slash" [size]="14"></app-icon>
                    </button>
                    <button
                      *ngIf="!emp.active"
                      class="pos-btn pos-btn--success pos-btn--sm btn-reactivate"
                      title="Xodimni qayta faollashtirish"
                      (click)="toggleActive(emp)">
                      <app-icon name="check" [size]="14"></app-icon> Faollashtirish
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <mat-paginator
          *ngIf="filteredEmployees.length > 0"
          [length]="filteredEmployees.length"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="pageSizeOptions"
          [showFirstLastButtons]="true"
          (page)="onPageChange($event)">
        </mat-paginator>
      </div>

      <!-- ============================================================ -->
      <!-- MODAL 1: ADD EMPLOYEE                                          -->
      <!-- ============================================================ -->
      <div class="modal-overlay" *ngIf="showCreateModal">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><app-icon name="user-plus" [size]="20"></app-icon> Yangi Xodim Ro‘yxatga Olish</h2>
            <button class="close-btn" (click)="closeModals()"><app-icon name="x" [size]="18"></app-icon></button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group full-width" *ngIf="createErrorMessage">
              <div class="validation-banner">
                <app-icon name="alert-triangle" [size]="14"></app-icon> {{ createErrorMessage }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Ismi *</label>
              <input type="text" [(ngModel)]="createData.firstName" class="pos-input" placeholder="Ali" required />
            </div>

            <div class="form-group">
              <label class="form-label">Familiyasi *</label>
              <input type="text" [(ngModel)]="createData.lastName" class="pos-input" placeholder="Valiyev" required />
            </div>

            <div class="form-group">
              <label class="form-label">Lavozim (Rol) *</label>
              <select [(ngModel)]="createData.role" class="pos-input">
                <option value="WAITER">Ofitsiant</option>
                <option value="CASHIER">Kassir</option>
                <option value="KITCHEN">Oshpaz (Oshxona)</option>
                <option value="MANAGER">Menejer</option>
                <option value="ADMIN">Admin (Boshqaruvchi)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Telefon raqam *</label>
              <input type="text" [(ngModel)]="createData.phone" class="pos-input" placeholder="+998 90 123 45 67" required />
            </div>

            <div class="form-group" [class.full-width]="createData.role !== 'ADMIN'">
              <label class="form-label">PIN kod (1–4 raqam) *</label>
              <input
                type="password"
                inputmode="numeric"
                maxlength="4"
                [(ngModel)]="createData.pin"
                class="pos-input"
                placeholder="1234"
                required
              />
              <span class="field-hint">1 tadan 4 tagacha raqam. Bir nechta xodim bir xil PIN ishlatishi mumkin.</span>
            </div>

            <!-- Admin Only: Username & Password -->
            <ng-container *ngIf="createData.role === 'ADMIN'">
              <div class="form-group">
                <label class="form-label">Login (Foydalanuvchi nomi) *</label>
                <input type="text" [(ngModel)]="createData.username" class="pos-input" placeholder="admin_ali" required />
              </div>

              <div class="form-group">
                <label class="form-label">Parol *</label>
                <input type="password" [(ngModel)]="createData.password" class="pos-input" placeholder="••••••••" required />
              </div>
            </ng-container>
          </div>

          <div class="modal-footer">
            <button class="pos-btn pos-btn--secondary" (click)="closeModals()" [disabled]="saving">Bekor qilish</button>
            <button
              class="pos-btn pos-btn--primary"
              (click)="saveCreate()"
              [disabled]="saving || !createData.firstName || !createData.lastName || !createData.phone || !createData.pin || (createData.role === 'ADMIN' && (!createData.username || !createData.password))">
              <span>{{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- MODAL 2: EDIT EMPLOYEE                                         -->
      <!-- ============================================================ -->
      <div class="modal-overlay" *ngIf="showEditModal && selectedEmp">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><app-icon name="edit" [size]="20"></app-icon> Xodimni Tahrirlash: {{ selectedEmp.firstName }} {{ selectedEmp.lastName || '' }}</h2>
            <button class="close-btn" (click)="closeModals()"><app-icon name="x" [size]="18"></app-icon></button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group full-width" *ngIf="editErrorMessage">
              <div class="validation-banner">
                <app-icon name="alert-triangle" [size]="14"></app-icon> {{ editErrorMessage }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Ismi *</label>
              <input type="text" [(ngModel)]="editData.firstName" class="pos-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">Familiyasi</label>
              <input type="text" [(ngModel)]="editData.lastName" class="pos-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Lavozim (Rol) *</label>
              <select [(ngModel)]="editData.role" class="pos-input">
                <option value="WAITER">Ofitsiant</option>
                <option value="CASHIER">Kassir</option>
                <option value="KITCHEN">Oshpaz (Oshxona)</option>
                <option value="MANAGER">Menejer</option>
                <option value="ADMIN">Admin (Boshqaruvchi)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Telefon raqam *</label>
              <input type="text" [(ngModel)]="editData.phone" class="pos-input" required />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Yangi PIN kod (ixtiyoriy, 1–4 raqam)</label>
              <input
                type="password"
                inputmode="numeric"
                maxlength="4"
                [(ngModel)]="editData.pin"
                class="pos-input"
                placeholder="O'zgartirish uchun yangi PIN kiriting"
              />
              <span class="field-hint">Agar PIN-kodni o'zgartirmoqchi bo'lmasangiz, bo'sh qoldiring.</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="pos-btn pos-btn--secondary" (click)="closeModals()" [disabled]="saving">Bekor qilish</button>
            <button
              class="pos-btn pos-btn--primary"
              (click)="saveEdit()"
              [disabled]="saving || !editData.firstName">
              <span>{{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- MODAL 3: RESET PASSWORD (ADMIN ONLY)                           -->
      <!-- ============================================================ -->
      <div class="modal-overlay" *ngIf="showPasswordModal && selectedEmp">
        <div class="modal-card modal-card--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><app-icon name="key" [size]="14"></app-icon> Parolni O'zgartirish</h2>
            <button class="close-btn" (click)="closeModals()"><app-icon name="x" [size]="18"></app-icon></button>
          </div>

          <div class="modal-body">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Foydalanuvchi: <strong>&#64;{{ selectedEmp.username || selectedEmp.firstName }} ({{ selectedEmp.firstName }})</strong>
            </p>

            <div class="form-group">
              <label class="form-label">Yangi Parol *</label>
              <input
                type="password"
                [(ngModel)]="newPassword"
                class="pos-input"
                placeholder="Yangi parol (kamida 4 belgi)"
                required
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="pos-btn pos-btn--secondary" (click)="closeModals()" [disabled]="saving">Bekor qilish</button>
            <button
              class="pos-btn pos-btn--primary"
              (click)="savePassword()"
              [disabled]="saving || !newPassword || newPassword.length < 4">
              <span>{{ saving ? 'O‘zgartirilmoqda...' : 'Parolni yangilash' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- MODAL 4: QUICK PIN CHANGE                                      -->
      <!-- ============================================================ -->
      <div class="modal-overlay" *ngIf="showPinModal && selectedEmp">
        <div class="modal-card modal-card--sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title"><app-icon name="hash" [size]="14"></app-icon> PIN-kodni O'zgartirish</h2>
            <button class="close-btn" (click)="closeModals()"><app-icon name="x" [size]="18"></app-icon></button>
          </div>

          <div class="modal-body">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Xodim: <strong>{{ selectedEmp.firstName }} {{ selectedEmp.lastName || '' }}</strong> ({{ getRoleLabel(selectedEmp.role) }})
            </p>

            <div class="form-group" *ngIf="pinErrorMessage" style="margin-bottom: 12px;">
              <div class="validation-banner">
                <app-icon name="alert-triangle" [size]="14"></app-icon> {{ pinErrorMessage }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Yangi PIN kod (1–4 raqam) *</label>
              <input
                type="password"
                inputmode="numeric"
                maxlength="4"
                [(ngModel)]="newPinValue"
                class="pos-input"
                placeholder="Masalan: 2580"
                autofocus
                required
              />
              <span class="field-hint">1 tadan 4 tagacha raqam. Bir nechta xodim bir xil PIN ishlatishi mumkin.</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="pos-btn pos-btn--secondary" (click)="closeModals()" [disabled]="saving">Bekor qilish</button>
            <button
              class="pos-btn pos-btn--primary"
              (click)="saveQuickPin()"
              [disabled]="saving || !newPinValue || newPinValue.length < 1">
              <span>{{ saving ? 'Saqlanmoqda...' : 'PINni saqlash' }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .employees-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .pos-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;

      th {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        font-weight: 600;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider);
        color: var(--text-primary);
      }

      tr:hover {
        background: var(--bg-hover);
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }

    .email-sub {
      font-size: 11px;
      color: var(--text-muted);
    }

    .username-tag {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--primary-light);
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .pin-badge {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .role-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;

      &.admin { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.manager { background: rgba(139, 92, 246, 0.15); color: #c084fc; }
      &.waiter { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      &.kitchen { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &.cashier { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    }

    .status-pill {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;

      &.active { color: var(--success, #10b981); }
      &.inactive { color: var(--danger, #ef4444); }
    }

    /* Segmented Slide Switch */
    .status-slider-strip {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .status-segmented-slider {
      display: inline-flex;
      background: var(--bg-secondary, #1e293b);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      gap: 6px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
    }

    .slider-btn {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 8px 18px;
      border-radius: 9px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #94a3b8);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      &:hover:not(.active) {
        color: var(--text-primary, #f8fafc);
        background: rgba(255, 255, 255, 0.04);
      }

      &.active {
        background: var(--bg-card, #0f172a);
        color: var(--text-primary, #ffffff);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;

      &.active-dot {
        background: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.65);
      }

      &.inactive-dot {
        background: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.65);
      }
    }

    .slider-title {
      letter-spacing: -0.01em;
    }

    .count-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      line-height: 1.3;

      &.active-badge {
        background: rgba(16, 185, 129, 0.16);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.25);
      }

      &.inactive-badge {
        background: rgba(239, 68, 68, 0.16);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.25);
      }
    }

    .is-inactive-row {
      background: rgba(239, 68, 68, 0.02) !important;
      opacity: 0.88;

      &:hover {
        background: rgba(239, 68, 68, 0.05) !important;
      }
    }

    .inactive-avatar {
      background: #64748b !important;
      opacity: 0.85;
    }

    .btn-reactivate {
      background: #10b981 !important;
      border-color: #10b981 !important;
      color: #ffffff !important;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);

      &:hover {
        background: #059669 !important;
        box-shadow: 0 3px 8px rgba(16, 185, 129, 0.5);
      }
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }

    .pos-btn--sm {
      min-height: 32px;
      padding: 4px 10px;
      font-size: 12px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;

      &--sm { max-width: 400px; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
    }

    .form-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      background: var(--bg-tertiary);
      border-top: 1px solid var(--border);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .field-hint {
      font-size: 11px;
      color: var(--text-muted);
      margin: -2px 0 4px 0;
    }

    .kitchen-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
      margin-top: 4px;
    }

    .kitchen-check-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        background: var(--bg-hover);
        border-color: var(--primary-light);
      }

      &.selected {
        background: rgba(245, 158, 11, 0.12);
        border-color: #f59e0b;
      }

      input[type="checkbox"] {
        accent-color: #f59e0b;
        cursor: pointer;
        width: 16px;
        height: 16px;
      }
    }

    .kitchen-check-info {
      display: flex;
      flex-direction: column;
    }

    .kitchen-check-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .kitchen-check-code {
      font-size: 10px;
      color: var(--text-muted);
    }

    .validation-error {
      font-size: 12px;
      color: #ef4444;
      font-weight: 600;
      margin-top: 6px;
    }

    .validation-banner {
      font-size: 13px;
      color: #ef4444;
      font-weight: 600;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      line-height: 1.4;
    }

    .kitchen-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .kitchen-chip {
      font-size: 11px;
      font-weight: 600;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .loading-state, .empty-state {
      padding: 50px 20px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }

    .mobile-label {
      display: none;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* ============================================================
     * RESPONSIVE BREAKPOINTS (Mobile & Tablet)
     * ============================================================ */
    @media (max-width: 767px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .pos-btn {
          width: 100%;
          min-height: 44px;
          justify-content: center;
        }
      }

      .status-slider-strip {
        width: 100%;

        .status-segmented-slider {
          width: 100%;

          .slider-btn {
            flex: 1;
            justify-content: center;
            padding: 8px 10px;
            font-size: 13px;
          }
        }
      }

      .filter-strip {
        flex-direction: column;
        align-items: stretch !important;
        gap: 10px !important;

        .search-box {
          width: 100%;
        }

        .pos-select-sm {
          width: 100%;
          min-height: 42px;
        }
      }

      .mobile-label {
        display: inline-block;
      }

      /* Transform Employee Table into Clean Mobile Cards */
      .pos-table {
        display: block;
        width: 100%;

        thead {
          display: none;
        }

        tbody {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 4px;
        }

        tr {
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md, 12px);
          padding: 14px;
          gap: 8px;
          box-shadow: var(--shadow-sm);
        }

        td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          border-bottom: none;

          &:first-child {
            padding-bottom: 8px;
            border-bottom: 1px solid var(--divider);
          }

          &:last-child {
            padding-top: 10px;
            margin-top: 4px;
            border-top: 1px solid var(--divider);
            display: block;
            width: 100%;
          }
        }

        .action-buttons {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;

          .pos-btn {
            width: 100%;
            min-height: 40px;
            justify-content: center;
          }
        }
      }

      .form-grid {
        grid-template-columns: 1fr !important;
        gap: 12px;
        padding: 14px;
      }

      .modal-card {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 20px 20px 0 0 !important;
        max-height: 92vh !important;
      }

      .modal-footer {
        flex-direction: column-reverse;
        gap: 8px;

        .pos-btn {
          width: 100%;
          min-height: 44px;
          justify-content: center;
        }
      }
    }
  `]
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  loading = false;
  saving = false;

  // Search, Filters & Pagination
  searchQuery = '';
  roleFilter = 'ALL';
  activeTab: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  setActiveTab(tab: 'ACTIVE' | 'INACTIVE'): void {
    this.activeTab = tab;
    this.pageIndex = 0;
  }

  get activeCount(): number {
    return this.employees.filter(e => e.active).length;
  }

  get inactiveCount(): number {
    return this.employees.filter(e => !e.active).length;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get filteredEmployees(): Employee[] {
    return this.employees.filter(emp => {
      // 1. Filter by Active / Inactive slide tab
      if (this.activeTab === 'ACTIVE' && !emp.active) {
        return false;
      }
      if (this.activeTab === 'INACTIVE' && emp.active) {
        return false;
      }
      // 2. Filter by Role
      if (this.roleFilter !== 'ALL' && emp.role !== this.roleFilter) {
        return false;
      }
      // 3. Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const nameMatch = `${emp.firstName} ${emp.lastName || ''}`.toLowerCase().includes(q);
        const usernameMatch = emp.username?.toLowerCase().includes(q);
        const phoneMatch = emp.phone?.toLowerCase().includes(q);
        return nameMatch || usernameMatch || phoneMatch;
      }
      return true;
    });
  }

  get pagedEmployees(): Employee[] {
    const list = this.filteredEmployees;
    if (this.pageIndex * this.pageSize >= list.length && list.length > 0) {
      this.pageIndex = Math.max(0, Math.ceil(list.length / this.pageSize) - 1);
    }
    const start = this.pageIndex * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showPasswordModal = false;
  showPinModal = false;
  selectedEmp: Employee | null = null;

  createErrorMessage = '';
  editErrorMessage = '';
  pinErrorMessage = '';
  newPinValue = '';

  createData: CreateEmployeeRequest = {
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    pin: '',
    role: 'WAITER'
  };

  editData: UpdateEmployeeRequest = {
    firstName: '',
    lastName: '',
    phone: '',
    role: 'WAITER',
    pin: ''
  };

  newPassword = '';

  constructor(
    private userService: UserService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.employees = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getInitials(emp: Employee): string {
    const first = emp.firstName ? emp.firstName[0].toUpperCase() : '';
    const last = emp.lastName ? emp.lastName[0].toUpperCase() : '';
    return first + last || 'U';
  }

  getRoleLabel(role?: string): string {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Menejer';
      case 'WAITER': return 'Ofitsiant';
      case 'KITCHEN': return 'Oshpaz';
      case 'CASHIER': return 'Kassir';
      default: return role || 'Xodim';
    }
  }

  openCreateModal(): void {
    this.createData = {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '+998 ',
      pin: '',
      role: 'WAITER'
    };
    this.createErrorMessage = '';
    this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  openEditModal(emp: Employee): void {
    this.selectedEmp = emp;
    this.editData = {
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || '',
      role: emp.role || 'WAITER',
      active: emp.active,
      pin: ''
    };
    this.editErrorMessage = '';
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  openResetPasswordModal(emp: Employee): void {
    this.selectedEmp = emp;
    this.newPassword = '';
    this.showPasswordModal = true;
    this.cdr.markForCheck();
  }

  openQuickPinModal(emp: Employee): void {
    this.selectedEmp = emp;
    this.newPinValue = '';
    this.pinErrorMessage = '';
    this.showPinModal = true;
    this.cdr.markForCheck();
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showPasswordModal = false;
    this.showPinModal = false;
    this.selectedEmp = null;
    this.createErrorMessage = '';
    this.editErrorMessage = '';
    this.pinErrorMessage = '';
    this.newPinValue = '';
    this.cdr.markForCheck();
  }

  saveCreate(): void {
    this.createErrorMessage = '';

    // Validations
    if (!this.createData.firstName || !this.createData.firstName.trim()) {
      this.createErrorMessage = 'Ism kiritilishi shart.';
      return;
    }
    if (!this.createData.lastName || !this.createData.lastName.trim()) {
      this.createErrorMessage = 'Familiya kiritilishi shart.';
      return;
    }
    if (!this.createData.phone || !this.createData.phone.trim()) {
      this.createErrorMessage = 'Telefon raqami kiritilishi shart.';
      return;
    }
    if (!this.createData.pin || !/^[0-9]{1,4}$/.test(this.createData.pin)) {
      this.createErrorMessage = 'PIN kod 1 tadan 4 tagacha raqamlardan iborat bo‘lishi kerak.';
      return;
    }

    if (this.createData.role === 'ADMIN') {
      if (!this.createData.username || !this.createData.username.trim()) {
        this.createErrorMessage = 'Admin uchun login kiritilishi shart.';
        return;
      }
      if (!this.createData.password || this.createData.password.length < 4) {
        this.createErrorMessage = 'Admin paroli kamida 4 ta belgidan iborat bo‘lishi kerak.';
        return;
      }
    } else {
      // Ordinary employees NEVER have username or password
      this.createData.username = undefined;
      this.createData.password = undefined;
    }

    this.saving = true;
    this.cdr.markForCheck();
    this.userService.createUser(this.createData).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Yangi xodim muvaffaqiyatli qo‘shildi!');
        this.closeModals();
        this.loadEmployees();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.message || 'Xatolik yuz berdi';
        this.createErrorMessage = msg;
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  saveEdit(): void {
    if (!this.selectedEmp) return;
    this.editErrorMessage = '';

    if (!this.editData.firstName || !this.editData.firstName.trim()) {
      this.editErrorMessage = 'Ism kiritilishi shart.';
      return;
    }
    if (!this.editData.phone || !this.editData.phone.trim()) {
      this.editErrorMessage = 'Telefon raqami kiritilishi shart.';
      return;
    }

    if (this.editData.pin && !/^[0-9]{1,4}$/.test(this.editData.pin)) {
      this.editErrorMessage = 'PIN kod 1 tadan 4 tagacha raqamlardan iborat bo‘lishi kerak.';
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();
    this.userService.updateUser(this.selectedEmp.id, this.editData).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Xodim ma‘lumotlari yangilandi!');
        this.closeModals();
        this.loadEmployees();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.message || 'Xatolik yuz berdi';
        this.editErrorMessage = msg;
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  saveQuickPin(): void {
    if (!this.selectedEmp) return;
    this.pinErrorMessage = '';

    if (!this.newPinValue || !/^[0-9]{1,4}$/.test(this.newPinValue)) {
      this.pinErrorMessage = 'PIN kod 1 tadan 4 tagacha raqamlardan iborat bo‘lishi kerak.';
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const req: UpdateEmployeeRequest = {
      firstName: this.selectedEmp.firstName,
      lastName: this.selectedEmp.lastName,
      phone: this.selectedEmp.phone,
      role: this.selectedEmp.role,
      pin: this.newPinValue
    };

    this.userService.updateUser(this.selectedEmp.id, req).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(`"${this.selectedEmp?.firstName}" PIN kodi muvaffaqiyatli yangilandi!`);
        this.closeModals();
        this.loadEmployees();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.message || 'PIN kodni yangilashda xatolik yuz berdi';
        this.pinErrorMessage = msg;
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  savePassword(): void {
    if (!this.selectedEmp || !this.newPassword) return;
    this.saving = true;
    this.cdr.markForCheck();
    this.userService.resetPassword(this.selectedEmp.id, this.newPassword).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Parol muvaffaqiyatli almashtirildi!');
        this.closeModals();
      },
      error: (err) => {
        this.saving = false;
        this.cdr.markForCheck();
        this.notify.error('Xatolik: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleActive(emp: Employee): void {
    const updatedStatus = !emp.active;

    if (!updatedStatus) {
      const confirmDeactivate = confirm(`"${emp.firstName} ${emp.lastName || ''}". Ushbu xodimni nofaol qilmoqchimisiz?\nU "Nofaol xodimlar" bo‘limiga o‘tkaziladi.`);
      if (!confirmDeactivate) {
        return;
      }
    }

    const req: UpdateEmployeeRequest = {
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone,
      role: emp.role,
      active: updatedStatus
    };

    this.userService.updateUser(emp.id, req).subscribe({
      next: () => {
        emp.active = updatedStatus;
        this.notify.success(
          updatedStatus
            ? `"${emp.firstName}" muvaffaqiyatli faollashtirildi!`
            : `"${emp.firstName}" nofaol qilindi va nofaol xodimlar bo‘limiga o‘tkazildi!`
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cdr.markForCheck();
        this.notify.error('Statusni o‘zgartirishda xatolik: ' + (err.error?.message || err.message));
      }
    });
  }
}
