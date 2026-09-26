import { Component, OnInit, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UpdateProfileRequest, Employee } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="profile-modal-card" (click)="$event.stopPropagation()">
        <!-- Header with Avatar and Role -->
        <div class="modal-header">
          <div class="user-header-info">
            <div class="user-avatar-circle">
              {{ getUserInitials() }}
            </div>
            <div class="user-titles">
              <h2 class="user-fullname">{{ auth.user()?.fullName }}</h2>
              <div class="user-role-wrap">
                <span class="role-badge" [class.role-badge--super]="auth.isSuperAdmin()">
                  <app-icon [name]="auth.isSuperAdmin() ? 'shield' : 'user'" [size]="13"></app-icon>
                  {{ getRoleName() }}
                </span>
                @if (auth.restaurantName()) {
                  <span class="restaurant-name-sub">
                    <app-icon name="building" [size]="12"></app-icon> {{ auth.restaurantName() }}
                  </span>
                }
              </div>
            </div>
          </div>
          <button type="button" class="btn-close-modal" (click)="closed.emit()" title="Yopish">
            <app-icon name="x" [size]="18"></app-icon>
          </button>
        </div>

        <!-- Tab Switcher -->
        <div class="modal-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'info'" 
            (click)="activeTab = 'info'">
            <app-icon name="user" [size]="16"></app-icon> Shaxsiy Ma'lumotlar
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'security'" 
            (click)="activeTab = 'security'">
            <app-icon name="lock" [size]="16"></app-icon> {{ isSuperAdmin() ? 'Parolni o\'zgartirish' : 'Xavfsizlik & PIN' }}
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          @if (errorMessage()) {
            <div class="alert-box alert-error">
              <app-icon name="alert-circle" [size]="16"></app-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- TAB 1: Personal Info -->
          @if (activeTab === 'info') {
            <form (ngSubmit)="saveProfile()" class="form-grid">
              <div class="form-row form-row--two">
                <div class="form-group">
                  <label class="form-label" for="profFirstName">Ism <span class="required">*</span></label>
                  <div class="input-wrap">
                    <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                    <input 
                      id="profFirstName"
                      type="text" 
                      class="form-control" 
                      [(ngModel)]="firstName" 
                      name="firstName" 
                      placeholder="Ismingizni kiriting"
                      required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="profLastName">Familiya</label>
                  <div class="input-wrap">
                    <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                    <input 
                      id="profLastName"
                      type="text" 
                      class="form-control" 
                      [(ngModel)]="lastName" 
                      name="lastName" 
                      placeholder="Familiyangiz" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="profPhone">Telefon raqami <span class="required">*</span></label>
                <div class="input-wrap">
                  <span class="input-icon"><app-icon name="phone" [size]="16"></app-icon></span>
                  <input 
                    id="profPhone"
                    type="tel" 
                    class="form-control" 
                    [(ngModel)]="phone" 
                    name="phone" 
                    placeholder="+998 90 123 45 67" 
                    required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="profEmail">Elektron pochta (Email)</label>
                <div class="input-wrap">
                  <span class="input-icon"><app-icon name="mail" [size]="16"></app-icon></span>
                  <input 
                    id="profEmail"
                    type="email" 
                    class="form-control" 
                    [(ngModel)]="email" 
                    name="email" 
                    placeholder="namuna@domain.uz" />
                </div>
                <span class="field-hint">Tizimga kirish yoki xabarnomalarni qabul qilish uchun foydalaniladi</span>
              </div>
            </form>
          }

          <!-- TAB 2: Security & PIN -->
          @if (activeTab === 'security') {
            <div class="security-sections">
              <!-- PIN CODE BLOCK (Only for non-superadmin users) -->
              @if (!isSuperAdmin()) {
                <div class="security-card">
                  <div class="sec-card-header">
                    <div class="sec-icon"><app-icon name="key" [size]="18"></app-icon></div>
                    <div>
                      <h4 class="sec-title">Tezkor PIN Kod</h4>
                      <p class="sec-desc">POS tizimiga yoki kassaga tezkor kirish uchun 4 xonali PIN kod</p>
                    </div>
                  </div>

                  <div class="form-row form-row--two">
                    <div class="form-group">
                      <label class="form-label" for="newPin">Yangi PIN kod</label>
                      <div class="input-wrap">
                        <span class="input-icon"><app-icon name="hash" [size]="16"></app-icon></span>
                        <input 
                          id="newPin"
                          type="password" 
                          maxlength="4" 
                          class="form-control font-mono" 
                          [(ngModel)]="newPin" 
                          placeholder="Masalan: 1234" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="confirmPin">PIN kodni tasdiqlang</label>
                      <div class="input-wrap">
                        <span class="input-icon"><app-icon name="hash" [size]="16"></app-icon></span>
                        <input 
                          id="confirmPin"
                          type="password" 
                          maxlength="4" 
                          class="form-control font-mono" 
                          [(ngModel)]="confirmPin" 
                          placeholder="Qayta kiriting" />
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- PASSWORD BLOCK -->
              <div class="security-card">
                <div class="sec-card-header">
                  <div class="sec-icon"><app-icon name="lock" [size]="18"></app-icon></div>
                  <div>
                    <h4 class="sec-title">Tizim Parolini O'zgartirish</h4>
                    <p class="sec-desc">Akkaunt xavfsizligi uchun kuchli paroldan foydalaning (kamida 4 ta belgi)</p>
                  </div>
                </div>

                <div class="form-row form-row--two">
                  <div class="form-group">
                    <label class="form-label" for="newPass">Yangi parol</label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="lock" [size]="16"></app-icon></span>
                      <input 
                        id="newPass"
                        [type]="showNewPassword ? 'text' : 'password'" 
                        class="form-control" 
                        [(ngModel)]="newPassword" 
                        placeholder="Kamida 4 belgi" />
                      <button type="button" class="btn-toggle-eye" (click)="showNewPassword = !showNewPassword">
                        <app-icon [name]="showNewPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="confirmPass">Parolni tasdiqlang</label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="lock" [size]="16"></app-icon></span>
                      <input 
                        id="confirmPass"
                        [type]="showNewPassword ? 'text' : 'password'" 
                        class="form-control" 
                        [(ngModel)]="confirmPassword" 
                        placeholder="Qayta kiriting" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- CURRENT PASSWORD CONFIRMATION -->
              @if ((!isSuperAdmin() && newPin) || newPassword) {
                <div class="current-pass-confirm fade-in">
                  <div class="form-group">
                    <label class="form-label" for="currentPass">
                      Joriy parolingiz <span class="required">*</span>
                    </label>
                    <div class="input-wrap">
                      <span class="input-icon"><app-icon name="lock" [size]="16"></app-icon></span>
                      <input 
                        id="currentPass"
                        [type]="showCurrentPassword ? 'text' : 'password'" 
                        class="form-control" 
                        [(ngModel)]="currentPassword" 
                        placeholder="O'zgarishlarni tasdiqlash uchun joriy parolingizni kiriting" 
                        required />
                      <button type="button" class="btn-toggle-eye" (click)="showCurrentPassword = !showCurrentPassword">
                        <app-icon [name]="showCurrentPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                      </button>
                    </div>
                    <span class="field-hint text-warning">Xavfsizlik maqsadida yangi parol{{ isSuperAdmin() ? '' : ' yoki PIN' }} o'rnatish uchun joriy parol talab qilinadi</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()" [disabled]="saving()">
            Bekor qilish
          </button>
          <button type="button" class="btn btn-primary" (click)="saveProfile()" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner-sm"></span>
              <span>Saqlanmoqda...</span>
            } @else {
              <app-icon name="save" [size]="16"></app-icon>
              <span>O'zgarishlarni saqlash</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .profile-modal-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1.25rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: var(--text-primary, #0f172a);
      animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes zoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* HEADER */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }

    .user-header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      font-weight: 800;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      flex-shrink: 0;
    }

    .user-titles {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-fullname {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.01em;
      color: var(--text-primary, #0f172a);
    }

    .user-role-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(99, 102, 241, 0.12);
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      border: 1px solid rgba(99, 102, 241, 0.25);

      &--super {
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
        border-color: rgba(245, 158, 11, 0.3);
      }
    }

    .restaurant-name-sub {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.775rem;
      color: var(--text-muted, #64748b);
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
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-primary, #0f172a);
      }
    }

    /* TABS */
    .modal-tabs {
      display: flex;
      border-bottom: 1px solid var(--border, #e2e8f0);
      background: var(--bg-tertiary, #f8fafc);
      padding: 0 1.5rem;
      gap: 0.5rem;
    }

    .tab-btn {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
      margin-bottom: -1px;

      &:hover {
        color: var(--text-primary, #0f172a);
      }

      &.active {
        color: var(--primary, #4f46e5);
        border-bottom-color: var(--primary, #4f46e5);
      }
    }

    /* BODY */
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .alert-box {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;

      &.alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
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
      align-items: center;
      pointer-events: none;
    }

    .form-control {
      width: 100%;
      height: 42px;
      padding: 0 0.85rem 0 2.5rem;
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
        font-size: 1rem;
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
      align-items: center;
      padding: 0.25rem;

      &:hover {
        color: var(--text-primary, #0f172a);
      }
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.2rem;

      &.text-warning {
        color: #d97706;
      }
    }

    /* SECURITY TAB STYLES */
    .security-sections {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .security-card {
      background: var(--bg-tertiary, #f8fafc);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
    }

    .sec-card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }

    .sec-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sec-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0 0 0.15rem 0;
      color: var(--text-primary, #0f172a);
    }

    .sec-desc {
      font-size: 0.775rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }

    .current-pass-confirm {
      background: rgba(245, 158, 11, 0.08);
      border: 1.5px solid rgba(245, 158, 11, 0.3);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
    }

    /* FOOTER */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border, #e2e8f0);
      background: var(--bg-tertiary, #f8fafc);
    }

    .btn {
      height: 42px;
      padding: 0 1.25rem;
      border-radius: 0.65rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: none;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: var(--bg-hover, #e2e8f0);
      color: var(--text-primary, #334155);

      &:hover:not(:disabled) {
        background: var(--border, #cbd5e1);
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============================================================ */
    /* DARK THEME EXPLICIT OVERRIDES                                */
    /* ============================================================ */
    :host-context([data-theme="dark"]),
    :host-context(.theme-dark) {
      .profile-modal-card {
        background: #1a1d2e;
        border-color: #2d3354;
        color: #f1f5f9;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      }

      .modal-header,
      .modal-footer {
        border-color: #2d3354;
      }

      .modal-tabs,
      .modal-footer {
        background: #131622;
        border-bottom-color: #2d3354;
      }

      .user-fullname {
        color: #f8fafc;
      }

      .restaurant-name-sub {
        color: #94a3b8;
      }

      .role-badge {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
        border-color: rgba(99, 102, 241, 0.4);

        &--super {
          background: rgba(245, 158, 11, 0.25);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.4);
        }
      }

      .tab-btn {
        color: #94a3b8;

        &:hover {
          color: #f1f5f9;
        }

        &.active {
          color: #818cf8;
          border-bottom-color: #818cf8;
        }
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
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
        }
      }

      .field-hint {
        color: #94a3b8;

        &.text-warning {
          color: #fbbf24;
        }
      }

      .security-card {
        background: #131622;
        border-color: #2a2e47;
      }

      .sec-icon {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
      }

      .sec-title {
        color: #f1f5f9;
      }

      .sec-desc {
        color: #94a3b8;
      }

      .current-pass-confirm {
        background: rgba(245, 158, 11, 0.12);
        border-color: rgba(245, 158, 11, 0.35);
      }

      .alert-box.alert-error {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fca5a5;
      }

      .btn-secondary {
        background: #2d3354;
        color: #f1f5f9;

        &:hover:not(:disabled) {
          background: #3d4468;
        }
      }
    }
  `]
})
export class UserProfileModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  auth = inject(AuthService);
  userService = inject(UserService);
  notification = inject(NotificationService);

  activeTab: 'info' | 'security' = 'info';
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  isSuperAdmin = computed(() => this.auth.isSuperAdmin() || this.auth.user()?.role === 'SUPER_ADMIN');

  // Form fields
  firstName = '';
  lastName = '';
  phone = '';
  email = '';
  newPin = '';
  confirmPin = '';
  newPassword = '';
  confirmPassword = '';
  currentPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  getUserInitials(): string {
    const fullName = this.auth.user()?.fullName || this.firstName || 'User';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  getRoleName(): string {
    const role = this.auth.user()?.role;
    if (this.auth.isSuperAdmin()) return 'Super Admin';
    if (role === 'ADMIN' || role === 'RESTAURANT_ADMIN') return 'Administrator';
    return role || 'Foydalanuvchi';
  }

  loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    // Initial fallback from auth signal
    const currentUser = this.auth.user();
    if (currentUser) {
      this.firstName = currentUser.firstName || currentUser.fullName?.split(' ')[0] || '';
      this.lastName = currentUser.lastName || (currentUser.fullName?.split(' ').slice(1).join(' ') || '');
      this.phone = currentUser.phone || '';
      this.email = currentUser.email || '';
    }

    this.userService.getProfile().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          const u = res.data;
          this.firstName = u.firstName || '';
          this.lastName = u.lastName || '';
          this.phone = u.phone || '';
          this.email = u.email || '';
        }
      },
      error: err => {
        this.loading.set(false);
        console.warn('Failed to load profile details from server', err);
      }
    });
  }

  saveProfile(): void {
    this.errorMessage.set(null);

    // Validations
    if (!this.firstName || !this.firstName.trim()) {
      this.errorMessage.set('Iltimos, ismingizni kiriting.');
      this.activeTab = 'info';
      return;
    }

    if (!this.phone || !this.phone.trim()) {
      this.errorMessage.set('Iltimos, telefon raqamingizni kiriting.');
      this.activeTab = 'info';
      return;
    }

    // PIN validation (Faqat superadmin bo'lmagan foydalanuvchilar uchun)
    if (!this.isSuperAdmin() && this.newPin) {
      if (!/^\d{1,4}$/.test(this.newPin.trim())) {
        this.errorMessage.set('PIN kod 1 tadan 4 tagacha raqamdan iborat bo\'lishi kerak.');
        this.activeTab = 'security';
        return;
      }
      if (this.newPin.trim() !== this.confirmPin?.trim()) {
        this.errorMessage.set('Yangi PIN kod va uning tasdig\'i mos kelmadi.');
        this.activeTab = 'security';
        return;
      }
    }

    // Password validation
    if (this.newPassword) {
      if (this.newPassword.trim().length < 4) {
        this.errorMessage.set('Yangi parol kamida 4 belgidan iborat bo\'lishi kerak.');
        this.activeTab = 'security';
        return;
      }
      if (this.newPassword.trim() !== this.confirmPassword?.trim()) {
        this.errorMessage.set('Yangi parol va uning tasdig\'i mos kelmadi.');
        this.activeTab = 'security';
        return;
      }
    }

    const pinToSubmit = !this.isSuperAdmin() && this.newPin ? this.newPin.trim() : undefined;

    // Check if security changed but current password is empty
    if ((pinToSubmit || this.newPassword) && !this.currentPassword) {
      this.errorMessage.set((this.isSuperAdmin() ? 'Parolni' : 'PIN yoki parolni') + ' yangilash uchun joriy parolingizni kiriting.');
      this.activeTab = 'security';
      return;
    }

    const payload: UpdateProfileRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName ? this.lastName.trim() : '',
      phone: this.phone.trim(),
      email: this.email ? this.email.trim() : undefined,
      newPin: pinToSubmit,
      newPassword: this.newPassword ? this.newPassword.trim() : undefined,
      currentPassword: this.currentPassword ? this.currentPassword.trim() : undefined
    };

    this.saving.set(true);
    this.userService.updateProfile(payload).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success && res.data) {
          const u = res.data;
          this.auth.updateCurrentUser({
            fullName: u.fullName,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phone: u.phone
          });
          this.notification.success('Profil ma\'lumotlari muvaffaqiyatli saqlandi!');
          this.closed.emit();
        }
      },
      error: err => {
        this.saving.set(false);
        const msg = err.error?.message || 'Profilni yangilashda xatolik yuz berdi.';
        this.errorMessage.set(msg);
      }
    });
  }
}
