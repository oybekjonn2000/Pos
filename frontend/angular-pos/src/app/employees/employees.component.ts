import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UserService, Employee, Role, CreateEmployeeRequest, UpdateEmployeeRequest } from '../core/services/user.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  template: `
    <div class="employees-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">👥 Xodimlar & Lavozimlar</h1>
          <p class="page-subtitle">Ofitsiantlar, kassirlar, oshpazlar va tizim foydalanuvchilarini boshqarish</p>
        </div>

        <button class="pos-btn pos-btn--primary" (click)="openCreateModal()">
          <span>➕ Yangi Xodim Qo'shish</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="filter-strip" style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
        <div class="search-box" style="flex: 1; min-width: 220px;">
          <input
            type="text"
            placeholder="Qidiruv (Ism, login, telefon)..."
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

          <select [(ngModel)]="statusFilter" (ngModelChange)="pageIndex = 0" class="pos-input pos-select-sm">
            <option value="ALL">Barcha holatlar</option>
            <option value="ACTIVE">Faol</option>
            <option value="INACTIVE">Nofaol</option>
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
          <div class="empty-icon">👥</div>
          <h3>Xodimlar topilmadi</h3>
          <p *ngIf="employees.length > 0" style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Qidiruv yoki filtr bo'yicha hech qanday xodim topilmadi.</p>
          <button *ngIf="employees.length === 0" class="pos-btn pos-btn--primary" (click)="openCreateModal()" style="margin-top: 12px;">
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
              <tr *ngFor="let emp of pagedEmployees">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ getInitials(emp) }}</div>
                    <div>
                      <strong>{{ emp.firstName }} {{ emp.lastName || '' }}</strong>
                      <div class="email-sub" *ngIf="emp.email">{{ emp.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <code class="username-tag" *ngIf="emp.username">&#64;{{ emp.username }}</code>
                  <span class="pin-badge" *ngIf="!emp.username">🔢 PIN orqali</span>
                </td>
                <td>
                  <span class="role-badge" [ngClass]="emp.role?.toLowerCase()">
                    {{ getRoleLabel(emp.role) }}
                  </span>
                </td>
                <td>{{ emp.phone || '—' }}</td>
                <td>
                  <span class="status-pill" [class.active]="emp.active" [class.inactive]="!emp.active">
                    {{ emp.active ? '● Faol' : '○ Nofaol' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-buttons">
                    <button
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="Tahrirlash"
                      (click)="openEditModal(emp)">
                      ✏️ Tahrirlash
                    </button>
                    <button
                      *ngIf="emp.username || emp.role === 'ADMIN'"
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="Parolni almashtirish"
                      (click)="openResetPasswordModal(emp)">
                      🔑 Parol
                    </button>
                    <button
                      class="pos-btn pos-btn--secondary pos-btn--sm"
                      title="PIN-kodni o'zgartirish"
                      (click)="openQuickPinModal(emp)">
                      🔢 PIN
                    </button>
                    <button
                      *ngIf="emp.active"
                      class="pos-btn pos-btn--danger pos-btn--sm"
                      title="Nofaol qilish"
                      (click)="toggleActive(emp)">
                      🚫
                    </button>
                    <button
                      *ngIf="!emp.active"
                      class="pos-btn pos-btn--success pos-btn--sm"
                      title="Faollashtirish"
                      (click)="toggleActive(emp)">
                      ✅
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
            <h2 class="modal-title">➕ Yangi Xodim Ro‘yxatga Olish</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group full-width" *ngIf="createErrorMessage">
              <div class="validation-banner">
                ⚠️ {{ createErrorMessage }}
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
            <h2 class="modal-title">✏️ Xodimni Tahrirlash: {{ selectedEmp.firstName }} {{ selectedEmp.lastName || '' }}</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>

          <div class="modal-body form-grid">
            <div class="form-group full-width" *ngIf="editErrorMessage">
              <div class="validation-banner">
                ⚠️ {{ editErrorMessage }}
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
            <h2 class="modal-title">🔑 Parolni O'zgartirish</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
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
            <h2 class="modal-title">🔢 PIN-kodni O'zgartirish</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>

          <div class="modal-body">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Xodim: <strong>{{ selectedEmp.firstName }} {{ selectedEmp.lastName || '' }}</strong> ({{ getRoleLabel(selectedEmp.role) }})
            </p>

            <div class="form-group" *ngIf="pinErrorMessage" style="margin-bottom: 12px;">
              <div class="validation-banner">
                ⚠️ {{ pinErrorMessage }}
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
      font-weight: 600;

      &.active { color: var(--success); }
      &.inactive { color: var(--danger); }
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

    @keyframes spin {
      100% { transform: rotate(360deg); }
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
  statusFilter = 'ALL';
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get filteredEmployees(): Employee[] {
    return this.employees.filter(emp => {
      if (this.roleFilter !== 'ALL' && emp.role !== this.roleFilter) {
        return false;
      }
      if (this.statusFilter === 'ACTIVE' && !emp.active) {
        return false;
      }
      if (this.statusFilter === 'INACTIVE' && emp.active) {
        return false;
      }
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
      case 'ADMIN': return '👑 Admin';
      case 'MANAGER': return '👔 Menejer';
      case 'WAITER': return '🛎️ Ofitsiant';
      case 'KITCHEN': return '👨‍🍳 Oshpaz';
      case 'CASHIER': return '💳 Kassir';
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
        this.notify.success(`"${emp.firstName}" statusi ${updatedStatus ? 'faol' : 'nofaol'} qilindi`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cdr.markForCheck();
        this.notify.error('Statusni o‘zgartirishda xatolik: ' + (err.error?.message || err.message));
      }
    });
  }
}
