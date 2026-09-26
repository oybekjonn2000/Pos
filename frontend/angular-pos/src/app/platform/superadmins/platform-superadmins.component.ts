import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformService, CreateSuperAdminRequest } from '../../core/services/platform.service';
import { Employee } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-platform-superadmins',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="platform-superadmins-page fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <app-icon name="shield" [size]="24"></app-icon>
          </div>
          <div>
            <h1 class="page-title">Superadminlar Nazorati</h1>
            <p class="page-subtitle">Markaziy platforma boshqaruviga ega superadminlar ro'yxati va ularning vakolatlari</p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="loadSuperAdmins()" [disabled]="loading()">
            <app-icon name="refresh" [size]="16"></app-icon>
            <span>Yangilash</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>+ Yangi Superadmin</span>
          </button>
        </div>
      </div>

      <!-- Quick KPI Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-icon--purple">
            <app-icon name="shield" [size]="22"></app-icon>
          </div>
          <div class="metric-content">
            <span class="metric-label">Jami Superadminlar</span>
            <span class="metric-value">{{ superAdmins().length }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-icon--green">
            <app-icon name="check-circle" [size]="22"></app-icon>
          </div>
          <div class="metric-content">
            <span class="metric-label">Faol Superadminlar</span>
            <span class="metric-value">{{ activeCount() }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-icon--amber">
            <app-icon name="pause" [size]="22"></app-icon>
          </div>
          <div class="metric-content">
            <span class="metric-label">Nofaol / Bloklangan</span>
            <span class="metric-value">{{ inactiveCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Card with Search & Table -->
      <div class="card content-card">
        <!-- Filter Toolbar -->
        <div class="toolbar-row">
          <div class="search-input-wrap">
            <span class="search-icon"><app-icon name="search" [size]="16"></app-icon></span>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Ism, email yoki telefon bo'yicha qidirish..." 
              [(ngModel)]="searchQuery" />
            @if (searchQuery) {
              <button type="button" class="btn-clear-search" (click)="searchQuery = ''">
                <app-icon name="x" [size]="14"></app-icon>
              </button>
            }
          </div>

          <div class="status-filter-pills">
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedStatusFilter === 'ALL'"
              (click)="selectedStatusFilter = 'ALL'">
              Barchasi ({{ superAdmins().length }})
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedStatusFilter === 'ACTIVE'"
              (click)="selectedStatusFilter = 'ACTIVE'">
              Faol ({{ activeCount() }})
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedStatusFilter === 'INACTIVE'"
              (click)="selectedStatusFilter = 'INACTIVE'">
              Nofaol ({{ inactiveCount() }})
            </button>
          </div>
        </div>

        <!-- Table Container -->
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Superadminlar ro'yxati yuklanmoqda...</p>
          </div>
        } @else if (filteredSuperAdmins().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><app-icon name="shield" [size]="48"></app-icon></div>
            <h3>Superadminlar topilmadi</h3>
            <p>Qidiruv shartlariga mos keladigan superadmin topilmadi yoki hali qo'shilmagan.</p>
            @if (searchQuery || selectedStatusFilter !== 'ALL') {
              <button type="button" class="btn btn-secondary mt-2" (click)="searchQuery = ''; selectedStatusFilter = 'ALL'">
                Filtrlarni tozalash
              </button>
            }
          </div>
        } @else {
          <div class="table-responsive">
            <table class="styled-table">
              <thead>
                <tr>
                  <th>Foydalanuvchi</th>
                  <th>Aloqa ma'lumotlari</th>
                  <th>Login (Username)</th>
                  <th>Holati</th>
                  <th>Oxirgi kirish</th>
                  <th>Yaratilgan sana</th>
                  <th class="text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                @for (admin of filteredSuperAdmins(); track admin.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar-sm">
                          {{ getInitials(admin.fullName) }}
                        </div>
                        <div class="user-names">
                          <span class="user-fullname">{{ admin.fullName }}</span>
                          <span class="user-sub-badge">
                            <app-icon name="shield" [size]="11"></app-icon> Super Admin
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="contact-col">
                        <span class="contact-email">
                          <app-icon name="mail" [size]="13"></app-icon> {{ admin.email || '—' }}
                        </span>
                        <span class="contact-phone">
                          <app-icon name="phone" [size]="13"></app-icon> {{ admin.phone || '—' }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <code class="username-tag">{{ admin.username || '—' }}</code>
                    </td>
                    <td>
                      @if (admin.active) {
                        <span class="status-badge status-badge--active">
                          <span class="badge-dot"></span> Faol
                        </span>
                      } @else {
                        <span class="status-badge status-badge--inactive">
                          <span class="badge-dot"></span> Nofaol
                        </span>
                      }
                    </td>
                    <td>
                      <span class="date-text">{{ admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Hali kirmagan' }}</span>
                    </td>
                    <td>
                      <span class="date-text">{{ formatDate(admin.createdAt) }}</span>
                    </td>
                    <td class="text-right">
                      @if (admin.id === auth.user()?.id) {
                        <span class="badge-self" title="Joriy sizning hisobingiz">Siz</span>
                      } @else {
                        <button 
                          type="button" 
                          class="btn-toggle-status"
                          [class.btn-toggle-status--activate]="!admin.active"
                          [class.btn-toggle-status--deactivate]="admin.active"
                          [disabled]="actionLoadingId() === admin.id"
                          (click)="toggleStatus(admin)">
                          @if (actionLoadingId() === admin.id) {
                            <span class="spinner-sm"></span>
                          } @else if (admin.active) {
                            <app-icon name="pause" [size]="14"></app-icon> Nofaol qilish
                          } @else {
                            <app-icon name="play" [size]="14"></app-icon> Faollashtirish
                          }
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- CREATE SUPERADMIN MODAL -->
      @if (showCreateModal) {
        <div class="modal-backdrop" (click)="closeCreateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="modal-icon-badge"><app-icon name="user-plus" [size]="20"></app-icon></div>
                <div>
                  <h3 class="modal-title">Yangi Superadmin Qo'shish</h3>
                  <p class="modal-subtitle">Platformani to'liq boshqarish huquqiga ega yangi superadmin yaratiladi</p>
                </div>
              </div>
              <button type="button" class="btn-close-modal" (click)="closeCreateModal()">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <div class="modal-body">
              @if (createError()) {
                <div class="alert-box alert-error">
                  <app-icon name="alert-circle" [size]="16"></app-icon>
                  <span>{{ createError() }}</span>
                </div>
              }

              <form (ngSubmit)="submitCreateSuperAdmin()" class="form-grid">
                <div class="form-row form-row--two">
                  <div class="form-group">
                    <label class="form-label" for="superFirstName">Ism <span class="required">*</span></label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                      <input 
                        id="superFirstName"
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.firstName" 
                        name="superFirstName" 
                        placeholder="Masalan: Sardor" 
                        required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="superLastName">Familiya</label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                      <input 
                        id="superLastName"
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.lastName" 
                        name="superLastName" 
                        placeholder="Masalan: Karimov" />
                    </div>
                  </div>
                </div>

                <div class="form-row form-row--two">
                  <div class="form-group">
                    <label class="form-label" for="superEmail">Elektron pochta (Email) <span class="required">*</span></label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="mail" [size]="16"></app-icon></span>
                      <input 
                        id="superEmail"
                        type="email" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.email" 
                        name="superEmail" 
                        placeholder="sardor@platform.uz" 
                        required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="superPhone">Telefon raqami <span class="required">*</span></label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="phone" [size]="16"></app-icon></span>
                      <input 
                        id="superPhone"
                        type="tel" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.phone" 
                        name="superPhone" 
                        placeholder="+998 90 123 45 67" 
                        required />
                    </div>
                  </div>
                </div>

                <div class="form-row form-row--two">
                  <div class="form-group">
                    <label class="form-label" for="superUsername">Login (Username) <span class="optional">(ixtiyoriy)</span></label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                      <input 
                        id="superUsername"
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.username" 
                        name="superUsername" 
                        placeholder="Kiritilmasa emaildan olinadi" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="superPassword">Boshlang'ich Parol <span class="required">*</span></label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="lock" [size]="16"></app-icon></span>
                      <input 
                        id="superPassword"
                        [type]="showPassword ? 'text' : 'password'" 
                        class="form-control" 
                        [(ngModel)]="newAdmin.password" 
                        name="superPassword" 
                        placeholder="Kamida 6 ta belgi" 
                        required />
                      <button type="button" class="btn-toggle-eye" (click)="showPassword = !showPassword">
                        <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                      </button>
                    </div>
                  </div>
                </div>
                <span class="field-hint">Superadmin ushbu parol orqali tizimga kiradi va keyin o'zgartirishi mumkin</span>
              </form>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()" [disabled]="creating()">
                Bekor qilish
              </button>
              <button type="button" class="btn btn-primary" (click)="submitCreateSuperAdmin()" [disabled]="creating()">
                @if (creating()) {
                  <span class="spinner-sm"></span>
                  <span>Yaratilmoqda...</span>
                } @else {
                  <app-icon name="check" [size]="16"></app-icon>
                  <span>Superadminni yaratish</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--text-primary, #0f172a);
    }

    .platform-superadmins-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem 1rem;
    }

    .fade-in {
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* HEADER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(124, 58, 237, 0.2) 100%);
      color: var(--primary, #4f46e5);
      border: 1px solid rgba(99, 102, 241, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 0.2rem 0;
      letter-spacing: -0.02em;
      color: var(--text-primary, #0f172a);
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* METRICS GRID */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
      }
    }

    .metric-icon {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &--purple {
        background: rgba(99, 102, 241, 0.12);
        color: #4f46e5;
      }

      &--green {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
      }

      &--amber {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
      }
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .metric-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1;
    }

    /* CARD & TOOLBAR */
    .content-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1.25rem;
      padding: 1.25rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .toolbar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 280px;
      flex: 1;
      max-width: 420px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
      display: flex;
    }

    .search-input {
      width: 100%;
      height: 40px;
      padding: 0 2rem 0 2.4rem;
      border: 1.5px solid var(--border, #cbd5e1);
      border-radius: 0.65rem;
      background: var(--bg-tertiary, #f8fafc);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: var(--primary, #6366f1);
        background: var(--bg-card, #ffffff);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }
    }

    .btn-clear-search {
      position: absolute;
      right: 0.65rem;
      background: none;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .status-filter-pills {
      display: flex;
      gap: 0.4rem;
      background: var(--bg-tertiary, #f1f5f9);
      padding: 0.3rem;
      border-radius: 0.65rem;
    }

    .filter-pill {
      background: none;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: var(--text-primary, #0f172a);
      }

      &.active {
        background: var(--bg-card, #ffffff);
        color: var(--primary, #4f46e5);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      }
    }

    /* TABLE */
    .table-responsive {
      overflow-x: auto;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        background: var(--bg-tertiary, #f8fafc);
        color: var(--text-secondary, #475569);
        font-weight: 700;
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 2px solid var(--border, #e2e8f0);
        white-space: nowrap;
      }

      td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border, #f1f5f9);
        vertical-align: middle;
        color: var(--text-primary, #0f172a);
      }

      tr:hover td {
        background: rgba(99, 102, 241, 0.03);
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar-sm {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-names {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .user-fullname {
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }

    .user-sub-badge {
      font-size: 0.7rem;
      color: #6366f1;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .contact-col {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.8rem;
    }

    .contact-email,
    .contact-phone {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-secondary, #475569);
    }

    .username-tag {
      background: var(--bg-tertiary, #f1f5f9);
      border: 1px solid var(--border, #e2e8f0);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--primary, #4338ca);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;

      &--active {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #6ee7b7;

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }
      }

      &--inactive {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
        }
      }
    }

    .date-text {
      color: var(--text-muted, #64748b);
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .badge-self {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary, #4f46e5);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .btn-toggle-status {
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.785rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 1.5px solid transparent;
      transition: all 0.2s;

      &--deactivate {
        background: transparent;
        border-color: #fca5a5;
        color: #dc2626;

        &:hover:not(:disabled) {
          background: #ef4444;
          color: white;
        }
      }

      &--activate {
        background: transparent;
        border-color: #86efac;
        color: #16a34a;

        &:hover:not(:disabled) {
          background: #16a34a;
          color: white;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .text-right {
      text-align: right;
    }

    /* BUTTONS */
    .btn {
      height: 40px;
      padding: 0 1.15rem;
      border-radius: 0.65rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: none;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: var(--bg-card, #ffffff);
      border: 1.5px solid var(--border, #cbd5e1);
      color: var(--text-primary, #334155);

      &:hover:not(:disabled) {
        background: var(--bg-hover, #f1f5f9);
        border-color: var(--border-light, #94a3b8);
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
      }
    }

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted, #64748b);
    }

    .empty-icon {
      margin-bottom: 0.75rem;
      opacity: 0.5;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border, #e2e8f0);
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem auto;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 30, 0.7);
      backdrop-filter: blur(6px);
      z-index: 10050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1.25rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--text-primary, #0f172a);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
      color: var(--text-primary, #0f172a);
    }

    .modal-subtitle {
      font-size: 0.775rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }

    .btn-close-modal {
      background: none;
      border: none;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;

      &:hover {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-primary, #0f172a);
      }
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;

      &--two > * {
        flex: 1;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-secondary, #334155);

      .required {
        color: #ef4444;
      }

      .optional {
        color: var(--text-muted, #94a3b8);
        font-weight: 400;
        font-size: 0.75rem;
      }
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.85rem;
      color: var(--text-muted, #94a3b8);
      display: flex;
      pointer-events: none;
    }

    .form-control {
      width: 100%;
      height: 42px;
      padding: 0 0.85rem 0 2.4rem;
      border: 1.5px solid var(--border, #cbd5e1);
      border-radius: 0.65rem;
      background: var(--bg-card, #ffffff);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: var(--primary, #6366f1);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }

      &.font-mono {
        font-family: monospace;
        letter-spacing: 0.15em;
      }
    }

    .btn-toggle-eye {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      display: flex;
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.2rem;
    }

    .alert-box {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      &.alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border, #e2e8f0);
      background: var(--bg-tertiary, #f8fafc);
    }

    /* ============================================================ */
    /* DARK THEME EXPLICIT OVERRIDES                                */
    /* ============================================================ */
    :host-context([data-theme="dark"]),
    :host-context(.theme-dark) {
      .page-title {
        color: #f1f5f9;
      }

      .page-subtitle {
        color: #94a3b8;
      }

      .metric-card,
      .content-card,
      .modal-card {
        background: #1a1d2e;
        border-color: #2d3354;
        color: #f1f5f9;
      }

      .metric-value {
        color: #f8fafc;
      }

      .metric-label {
        color: #94a3b8;
      }

      .search-input {
        background: #131622;
        border-color: #2a2e47;
        color: #f1f5f9;

        &:focus {
          background: #181c2c;
          border-color: #818cf8;
        }
      }

      .status-filter-pills {
        background: #131622;
      }

      .filter-pill {
        color: #94a3b8;

        &.active {
          background: #252a3d;
          color: #818cf8;
        }
      }

      .styled-table th {
        background: #131622;
        color: #cbd5e1;
        border-bottom-color: #2a2e47;
      }

      .styled-table td {
        border-bottom-color: rgba(255, 255, 255, 0.06);
        color: #f1f5f9;
      }

      .styled-table tr:hover td {
        background: rgba(255, 255, 255, 0.03);
      }

      .user-fullname {
        color: #f8fafc;
      }

      .contact-email,
      .contact-phone {
        color: #94a3b8;
      }

      .username-tag {
        background: #131622;
        border-color: #2a2e47;
        color: #c7d2fe;
      }

      .btn-secondary {
        background: #252a3d;
        border-color: #3d4468;
        color: #f1f5f9;

        &:hover:not(:disabled) {
          background: #2d3354;
          border-color: #6366f1;
        }
      }

      .modal-header,
      .modal-footer {
        border-color: #2d3354;
      }

      .modal-footer {
        background: #131622;
      }

      .modal-title {
        color: #f1f5f9;
      }

      .form-label {
        color: #cbd5e1;
      }

      .form-control {
        background: #131622;
        border-color: #2a2e47;
        color: #f1f5f9;

        &:focus {
          border-color: #818cf8;
        }
      }

      .alert-box.alert-error {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fca5a5;
      }

      .status-badge--active {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        border-color: rgba(16, 185, 129, 0.35);
      }

      .status-badge--inactive {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.35);
      }

      .badge-self {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
      }
    }
  `]
})
export class PlatformSuperadminsComponent implements OnInit {
  platformService = inject(PlatformService);
  auth = inject(AuthService);
  notification = inject(NotificationService);

  superAdmins = signal<Employee[]>([]);
  loading = signal(false);
  actionLoadingId = signal<string | null>(null);

  searchQuery = '';
  selectedStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  // Modal State
  showCreateModal = false;
  creating = signal(false);
  createError = signal<string | null>(null);
  showPassword = false;

  newAdmin: CreateSuperAdminRequest = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: ''
  };

  activeCount = computed(() => this.superAdmins().filter(a => a.active).length);
  inactiveCount = computed(() => this.superAdmins().filter(a => !a.active).length);

  filteredSuperAdmins = computed(() => {
    let list = this.superAdmins();

    if (this.selectedStatusFilter === 'ACTIVE') {
      list = list.filter(a => a.active);
    } else if (this.selectedStatusFilter === 'INACTIVE') {
      list = list.filter(a => !a.active);
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(a => 
        (a.fullName && a.fullName.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q)) ||
        (a.username && a.username.toLowerCase().includes(q))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadSuperAdmins();
  }

  loadSuperAdmins(): void {
    this.loading.set(true);
    this.platformService.getSuperAdmins().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.superAdmins.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        this.notification.error('Superadminlar ro\'yxatini yuklashda xatolik yuz berdi');
      }
    });
  }

  openCreateModal(): void {
    this.newAdmin = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: ''
    };
    this.createError.set(null);
    this.showPassword = false;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateSuperAdmin(): void {
    this.createError.set(null);

    if (!this.newAdmin.firstName?.trim()) {
      this.createError.set('Iltimos, ismni kiriting.');
      return;
    }

    if (!this.newAdmin.email?.trim() || !this.newAdmin.email.includes('@')) {
      this.createError.set('Iltimos, to\'g\'ri email manzilini kiriting.');
      return;
    }

    if (!this.newAdmin.phone?.trim()) {
      this.createError.set('Iltimos, telefon raqamini kiriting.');
      return;
    }

    if (!this.newAdmin.password || this.newAdmin.password.length < 6) {
      this.createError.set('Parol kamida 6 belgidan iborat bo\'lishi kerak.');
      return;
    }

    this.creating.set(true);
    this.platformService.createSuperAdmin(this.newAdmin).subscribe({
      next: res => {
        this.creating.set(false);
        if (res.success && res.data) {
          this.notification.success('Yangi Superadmin muvaffaqiyatli yaratildi!');
          this.closeCreateModal();
          this.loadSuperAdmins();
        }
      },
      error: err => {
        this.creating.set(false);
        const msg = err.error?.message || 'Superadmin yaratishda xatolik yuz berdi.';
        this.createError.set(msg);
      }
    });
  }

  toggleStatus(admin: Employee): void {
    const nextState = !admin.active;
    const confirmMsg = nextState 
      ? `Haqiqatan ham ${admin.fullName} superadmin hisobini faollashtirmoqchimisiz?`
      : `Haqiqatan ham ${admin.fullName} superadmin hisobini nofaol qilmoqchimisiz?`;

    if (!confirm(confirmMsg)) return;

    this.actionLoadingId.set(admin.id);
    this.platformService.updateSuperAdminStatus(admin.id, nextState).subscribe({
      next: res => {
        this.actionLoadingId.set(null);
        if (res.success && res.data) {
          this.superAdmins.update(list => list.map(a => a.id === admin.id ? res.data : a));
          this.notification.success(nextState ? 'Superadmin faollashtirildi' : 'Superadmin nofaol qilindi');
        }
      },
      error: err => {
        this.actionLoadingId.set(null);
        const msg = err.error?.message || 'Holatni o\'zgartirishda xatolik yuz berdi.';
        this.notification.error(msg);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'SA';
    const p = name.trim().split(' ');
    if (p.length >= 2) {
      return (p[0][0] + p[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
