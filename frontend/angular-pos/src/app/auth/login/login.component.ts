import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { LanServerConfigModalComponent } from '../../shared/components/lan-server-config-modal/lan-server-config-modal.component';
import { ThemeService } from '../../core/services/theme.service';
import { DeviceBindingService, DeviceEmployee } from '../../core/services/device-binding.service';

interface QuickAccount {
  role: string;
  title: string;
  name: string;
  username: string;
  password: string;
  icon: string;
  badgeClass: string;
  description: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LanServerConfigModalComponent],
  template: `
    <div class="login-page">
      <!-- Top Navigation Bar (Back to Home & Theme Switcher - Web SaaS Only) -->
      @if (!lan.isDesktop()) {
        <div class="login-top-nav">
          <a routerLink="/" class="back-home-btn" title="Bosh sahifaga qaytish">
            <span class="back-arrow">←</span>
            <span class="back-text">Bosh sahifa</span>
          </a>

          <div class="theme-switcher"
               [title]="theme.isDark() ? 'Kunduzgi rejimga o‘tish (Light)' : 'Tungi rejimga o‘tish (Dark)'"
               (click)="theme.toggleTheme()">
            <button type="button" class="theme-btn" [class.active]="!theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('light')" title="Light Theme">
              <span>☀</span> Light
            </button>
            <button type="button" class="theme-btn" [class.active]="theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('dark')" title="Dark Theme">
              <span>🌙</span> Dark
            </button>
          </div>
        </div>
      }

      <!-- Background decorations -->
      <div class="login-page__bg">
        <div class="login-page__blob login-page__blob--1"></div>
        <div class="login-page__blob login-page__blob--2"></div>
      </div>

      <!-- ======================================================== -->
      <!-- A) DESKTOP BOUND: EMPLOYEE SELECTION SCREEN (JOWI POS)   -->
      <!-- ======================================================== -->
      @if (lan.isDesktop() && deviceService.isBound()) {
        <div class="desktop-staff-container fade-in">
          <!-- Terminal & Restaurant Brand Header -->
          <div class="terminal-brand-header">
            <div class="terminal-brand-left">
              <div class="terminal-brand-logo">🍽️</div>
              <div class="terminal-brand-info">
                <div class="terminal-rest-name">{{ deviceService.boundRestaurant()?.name }}</div>
                <div class="terminal-rest-code">KOD: {{ deviceService.boundRestaurant()?.code }}</div>
              </div>
            </div>

            <div class="terminal-brand-right">
              <div class="lan-pill" (click)="showServerModal.set(true)" title="Server holati">
                <span class="status-indicator-dot" [class.online]="lan.connectionState() === 'ONLINE'" [class.offline]="lan.connectionState() !== 'ONLINE'"></span>
                <span class="lan-text">{{ lan.connectionState() === 'ONLINE' ? 'LAN Online' : 'Server Offline' }}</span>
                <span class="lan-cog">⚙️</span>
              </div>

              <div class="theme-switcher-mini" (click)="theme.toggleTheme()" title="Mavzuni almashtirish">
                <span>{{ theme.isDark() ? '🌙' : '☀️' }}</span>
              </div>

              <button type="button" class="btn-terminal-unbind" (click)="onUnbindTerminal()" title="Restorandan ajratish va boshqa hisobga ulash">
                <span>🔌</span> Ajratish
              </button>
            </div>
          </div>

          <!-- Section Title & Subtitle -->
          <div class="staff-heading-wrap">
            <h1 class="staff-title">👨‍🍳 {{ lan.isClientMode() ? 'Ofitsiant yoki Oshpazni tanlang' : 'Xodimni tanlang' }}</h1>
            <p class="staff-subtitle">{{ lan.isClientMode() ? 'Terminalda ishlash uchun o‘z hisobingizni tanlang va PIN-kodni kiriting' : 'POS terminalida ishlashni boshlash uchun o‘z hisobingizni bosing' }}</p>
          </div>

          <!-- Search and Filter Bar -->
          <div class="staff-toolbar">
            <div class="staff-search-box">
              <span class="staff-search-icon">🔍</span>
              <input
                type="text"
                class="pos-input staff-search-input"
                placeholder="Xodim ismi yoki logini bo‘yicha qidirish..."
                [ngModel]="employeeSearchQuery()"
                (ngModelChange)="employeeSearchQuery.set($event)"
              />
              @if (employeeSearchQuery()) {
                <button class="clear-search-btn" (click)="employeeSearchQuery.set('')">✕</button>
              }
            </div>

            <div class="staff-role-filters">
              <button class="role-filter-tab" [class.active]="employeeRoleFilter() === 'ALL'" (click)="employeeRoleFilter.set('ALL')">
                {{ lan.isClientMode() ? 'Barchasi (Ofitsiant & Oshpaz)' : 'Barchasi' }} ({{ clientAllowedEmployees().length }})
              </button>
              <button class="role-filter-tab" [class.active]="employeeRoleFilter() === 'WAITER'" (click)="employeeRoleFilter.set('WAITER')">
                🤵 Ofitsiantlar
              </button>
              @if (!lan.isClientMode()) {
                <button class="role-filter-tab" [class.active]="employeeRoleFilter() === 'CASHIER'" (click)="employeeRoleFilter.set('CASHIER')">
                  💵 Kassirlar
                </button>
              }
              <button class="role-filter-tab" [class.active]="employeeRoleFilter() === 'KITCHEN'" (click)="employeeRoleFilter.set('KITCHEN')">
                👨‍🍳 Oshpazlar
              </button>
              @if (!lan.isClientMode()) {
                <button class="role-filter-tab" [class.active]="employeeRoleFilter() === 'ADMIN'" (click)="employeeRoleFilter.set('ADMIN')">
                  👑 Adminlar
                </button>
              }
            </div>
          </div>

          <!-- Staff Cards Grid -->
          <div class="staff-cards-grid">
            @for (emp of filteredEmployees(); track emp.id) {
              <div class="staff-card" (click)="onSelectEmployee(emp)" [class.staff-card--selected]="deviceService.selectedEmployee()?.id === emp.id">
                <div class="staff-avatar-wrap">
                  <div class="staff-avatar {{ getRoleAvatarClass(emp.role) }}">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <span class="staff-role-badge {{ getRoleBadgeClass(emp.role) }}">
                    {{ getRoleTitle(emp.role) }}
                  </span>
                </div>

                <div class="staff-details">
                  <strong class="staff-card-name">{{ emp.fullName }}</strong>
                  @if (emp.username) {
                    <span class="staff-card-username">&#64;{{ emp.username }}</span>
                  } @else {
                    <span class="staff-card-pin-only">🔢 PIN orqali</span>
                  }
                </div>

                <div class="staff-card-action">
                  <span class="tap-hint">Tanlash ➔</span>
                </div>
              </div>
            }

            @if (filteredEmployees().length === 0) {
              <div class="staff-empty-state">
                <div class="empty-icon">👥</div>
                <h3>Xodimlar topilmadi</h3>
                <p>Qidiruv mezonlariga mos xodim topilmadi.</p>
              </div>
            }
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- EMPLOYEE PASSWORD / PIN MODAL                            -->
        <!-- ======================================================== -->
        @if (showEmployeePasswordModal() && deviceService.selectedEmployee(); as selectedEmp) {
          <div class="pos-modal-backdrop">
            <div class="employee-pin-modal" (click)="$event.stopPropagation()">
              <button class="pin-modal-close" (click)="closeEmployeePasswordModal()">✕</button>

              <div class="pin-modal-header">
                <div class="modal-emp-avatar {{ getRoleAvatarClass(selectedEmp.role) }}">
                  {{ getInitials(selectedEmp.fullName) }}
                </div>
                <h2 class="modal-emp-name">{{ selectedEmp.fullName }}</h2>
                <span class="modal-emp-role {{ getRoleBadgeClass(selectedEmp.role) }}">{{ getRoleTitle(selectedEmp.role) }}</span>
                <p class="modal-emp-hint">
                  {{ !lan.isClientMode() && isEmpAdmin(selectedEmp) && adminAuthMode() === 'PASSWORD' ? 'Admin login va parolini kiriting' : 'PIN-kodni kiriting' }}
                </p>
              </div>

              <!-- Admin Auth Mode Switcher (Only for Admin on Server/Web mode) -->
              @if (!lan.isClientMode() && isEmpAdmin(selectedEmp)) {
                <div class="admin-auth-tabs">
                  <button
                    type="button"
                    class="admin-auth-tab"
                    [class.active]="adminAuthMode() === 'PIN'"
                    (click)="adminAuthMode.set('PIN')">
                    🔢 PIN orqali
                  </button>
                  <button
                    type="button"
                    class="admin-auth-tab"
                    [class.active]="adminAuthMode() === 'PASSWORD'"
                    (click)="adminAuthMode.set('PASSWORD')">
                    🔑 Login va Parol
                  </button>
                </div>
              }

              <!-- Error Alert -->
              @if (employeeLoginError()) {
                <div class="pin-error-alert">
                  <span class="pin-error-icon">⚠️</span>
                  <span>{{ employeeLoginError() }}</span>
                </div>
              }

              <!-- PIN MODE: masked input & touch numpad -->
              @if (lan.isClientMode() || !isEmpAdmin(selectedEmp) || adminAuthMode() === 'PIN') {
                <div class="pin-input-wrap">
                  <input
                    type="password"
                    class="pin-display-input"
                    [ngModel]="employeePasswordInput()"
                    (ngModelChange)="employeePasswordInput.set($event)"
                    (keydown.enter)="onEmployeeLoginSubmit()"
                    placeholder="••••"
                    maxlength="4"
                    inputmode="numeric"
                    autofocus
                  />
                </div>

                <!-- Touch Screen Numeric Keypad -->
                <div class="touch-numpad">
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('1')">1</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('2')">2</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('3')">3</button>

                  <button type="button" class="numpad-btn" (click)="onNumpadPress('4')">4</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('5')">5</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('6')">6</button>

                  <button type="button" class="numpad-btn" (click)="onNumpadPress('7')">7</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('8')">8</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('9')">9</button>

                  <button type="button" class="numpad-btn numpad-btn--clear" (click)="onNumpadPress('C')">C</button>
                  <button type="button" class="numpad-btn" (click)="onNumpadPress('0')">0</button>
                  <button type="button" class="numpad-btn numpad-btn--back" (click)="onNumpadPress('DEL')">⌫</button>
                </div>
              } @else {
                <!-- ADMIN PASSWORD MODE: Username & Password -->
                <div class="admin-password-form" style="width: 100%;">
                  <div class="form-group" style="margin-bottom: 12px; text-align: left;">
                    <label class="form-label" style="font-size: 12px; margin-bottom: 4px; display: block;">Login</label>
                    <input
                      type="text"
                      class="pos-input pos-input--lg w-full"
                      [ngModel]="adminUsernameInput()"
                      (ngModelChange)="adminUsernameInput.set($event)"
                      placeholder="admin"
                      readonly
                    />
                  </div>
                  <div class="form-group" style="margin-bottom: 8px; text-align: left;">
                    <label class="form-label" style="font-size: 12px; margin-bottom: 4px; display: block;">Admin Paroli</label>
                    <input
                      type="password"
                      class="pos-input pos-input--lg w-full"
                      [ngModel]="adminPasswordInput()"
                      (ngModelChange)="adminPasswordInput.set($event)"
                      (keydown.enter)="onEmployeeLoginSubmit()"
                      placeholder="••••••••"
                      autofocus
                    />
                  </div>
                </div>
              }

              <!-- Action Buttons -->
              <div class="pin-modal-actions">
                <button type="button" class="pos-btn pos-btn--secondary" (click)="closeEmployeePasswordModal()" [disabled]="employeeLoginLoading()">
                  Bekor qilish
                </button>
                <button
                  type="button"
                  class="pos-btn pos-btn--primary pos-btn--lg flex-1"
                  (click)="onEmployeeLoginSubmit()"
                  [disabled]="employeeLoginLoading() || (adminAuthMode() === 'PIN' || !isEmpAdmin(selectedEmp) ? !employeePasswordInput() : !adminPasswordInput())">
                  <span>{{ employeeLoginLoading() ? 'Kirilmoqda...' : 'Kirish ➔' }}</span>
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- ======================================================== -->
      <!-- B) DESKTOP UNBOUND: INITIAL ACTIVATION SCREEN             -->
      <!-- ======================================================== -->
      @else if (lan.isDesktop() && !deviceService.isBound()) {
        <div class="login-container fade-in">
          <div class="login-header">
            <div class="login-logo">🍽️</div>
            <h1 class="login-title">Restoran hisobiga kirish</h1>
            <p class="login-subtitle">Ushbu POS terminalini restoranga biriktirish uchun asosiy administrator login va parolini kiriting</p>
          </div>

          <div class="login-card">
            <!-- Server Status Bar -->
            <div class="server-status-bar" (click)="showServerModal.set(true)">
              <div class="server-status-left">
                <span class="status-indicator-dot" [class.online]="lan.connectionState() === 'ONLINE'" [class.offline]="lan.connectionState() !== 'ONLINE'"></span>
                <span class="server-text">Server: <strong>{{ lan.currentServerUrl() }}</strong></span>
              </div>
              <button type="button" class="btn-server-cog">⚙️ IP Sozlash</button>
            </div>

            @if (desktopActivateError()) {
              <div class="login-error">
                <div class="login-error-text">❌ {{ desktopActivateError() }}</div>
              </div>
            }

            <form (ngSubmit)="onDesktopActivate()" class="login-form">
              <div class="form-group">
                <label class="form-label">Restoran Admin Logini *</label>
                <input
                  type="text"
                  class="pos-input pos-input--lg"
                  [ngModel]="desktopActivateUsername()"
                  (ngModelChange)="desktopActivateUsername.set($event)"
                  name="activateUsername"
                  placeholder="Masalan: admin_rayhon"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Admin Paroli *</label>
                <input
                  type="password"
                  class="pos-input pos-input--lg"
                  [ngModel]="desktopActivatePassword()"
                  (ngModelChange)="desktopActivatePassword.set($event)"
                  name="activatePassword"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                class="pos-btn pos-btn--primary pos-btn--lg w-full"
                [disabled]="desktopActivateLoading() || !desktopActivateUsername() || !desktopActivatePassword()"
              >
                <span>{{ desktopActivateLoading() ? 'Biriktirilmoqda...' : '⚡ Restoranga Biriktirish va Kirish' }}</span>
              </button>
            </form>
          </div>

          <div class="login-footer">
            <div class="offline-badge">
              🔒 JOWI POS Architecture • Device Terminal Binding
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- C) WEB / SAAS STANDARD LOGIN SCREEN                      -->
      <!-- ======================================================== -->
      @else {
        <div class="login-container fade-in">
          <!-- Header -->
          <div class="login-header">
            <div class="login-logo" routerLink="/" style="cursor: pointer;" title="Bosh sahifaga o'tish">🍽️</div>
            <h1 class="login-title" routerLink="/" style="cursor: pointer;" title="Bosh sahifaga o'tish">RestaurantPOS</h1>
            <p class="login-subtitle">Professional Restaurant Management SaaS</p>
          </div>

          <!-- Login Card -->
          <div class="login-card">
            <h2 class="login-card__title">Welcome back</h2>
            <p class="login-card__desc">Sign in to continue to your POS</p>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <label class="form-label">Restoran Kodi (ixtiyoriy)</label>
                  <span style="font-size: 11px; color: var(--text-muted);">Masalan: DEMO001</span>
                </div>
                <input
                  type="text"
                  class="pos-input pos-input--lg"
                  formControlName="restaurantCode"
                  placeholder="Bo‘sh qoldirish mumkin (avtomatik aniqlanadi)"
                  autocomplete="off"
                  style="text-transform: uppercase;"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Login, email yoki telefon</label>
                <input
                  type="text"
                  class="pos-input pos-input--lg"
                  formControlName="username"
                  placeholder="Login, email yoki telefon raqamingiz"
                  autocomplete="username"
                />
                @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
                  <span class="form-error">Login kiritilishi shart</span>
                }
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <label class="form-label">Parol</label>
                  <button type="button" class="btn-forgot-password" (click)="onForgotPassword()">
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div class="password-input-wrap">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    class="pos-input pos-input--lg"
                    formControlName="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="showPassword.set(!showPassword())"
                    [title]="showPassword() ? 'Parolni yashirish' : 'Parolni ko‘rsatish'"
                  >
                    {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <span class="form-error">Parol kiritilishi shart</span>
                }
              </div>

              @if (isBlocked()) {
                <div class="login-error login-error--blocked">
                  <div class="blocked-icon">🔒</div>
                  <div class="blocked-content">
                    <div class="blocked-title">Restoran bloklangan</div>
                    <div class="blocked-desc">Ushbu restoran faoliyati vaqtincha to'xtatilgan. Tizim administratoriga murojaat qiling.</div>
                  </div>
                </div>
              } @else if (errorMessage()) {
                <div class="login-error">
                  <div class="login-error-text">❌ {{ errorMessage() }}</div>
                </div>
              }

              <button
                type="submit"
                class="pos-btn pos-btn--primary pos-btn--lg w-full"
                [disabled]="loading() || loginForm.invalid"
              >
                @if (loading() && !activeQuickUser()) {
                  <span class="spinner"></span>
                  Kirilmoqda...
                } @else {
                  Kirish
                }
              </button>
            </form>

            <div class="register-prompt-box">
              <span class="register-prompt-text">Hisobingiz yo‘qmi?</span>
              <a routerLink="/register" class="register-prompt-link">Ro‘yxatdan o‘tish</a>
            </div>

            <!-- Quick Role Login Section -->
            <div class="quick-login-divider">
              <span>Tezkor kirish (Lavozimlar)</span>
            </div>

            <div class="quick-login-grid">
              @for (acc of quickAccounts; track acc.username) {
                <button
                  type="button"
                  class="quick-account-btn {{ acc.badgeClass }}"
                  [class.quick-account-btn--loading]="activeQuickUser() === acc.username && loading()"
                  [disabled]="loading()"
                  (click)="quickLogin(acc)"
                  [title]="acc.name + ' (' + acc.title + ') sifatida 1-bosishda kirish'"
                >
                  <span class="quick-icon">{{ acc.icon }}</span>
                  <div class="quick-text">
                    <div class="quick-role-row">
                      <span class="quick-role">{{ acc.title }}</span>
                    </div>
                    <span class="quick-user">{{ acc.name }}</span>
                  </div>
                  @if (activeQuickUser() === acc.username && loading()) {
                    <span class="quick-spinner"></span>
                  } @else {
                    <span class="quick-badge-arrow">⚡</span>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- LAN Server Config Modal (Desktop Installer Only) -->
      @if (lan.isDesktop() && showServerModal()) {
        <app-lan-server-config-modal (closed)="onServerModalClosed()"></app-lan-server-config-modal>
      }
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: var(--bg-primary);
      overflow-y: auto;
      padding: 40px 16px;
    }

    .login-top-nav {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .back-home-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      padding: 8px 16px;
      border-radius: 100px;
      color: var(--text-primary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: var(--primary);
        transform: translateX(-2px);
      }
    }

    .theme-switcher {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 4px;
      gap: 2px;
      cursor: pointer;
    }

    .theme-btn {
      border: none;
      background: transparent;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;

      &.active {
        background: var(--primary);
        color: white;
      }
    }

    .login-page__bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }

    .login-page__blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }

    .login-page__blob--1 {
      width: 500px;
      height: 500px;
      background: var(--primary);
      top: -150px;
      right: -150px;
    }

    .login-page__blob--2 {
      width: 400px;
      height: 400px;
      background: var(--accent);
      bottom: -100px;
      left: -100px;
    }

    .login-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .login-logo {
      font-size: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: var(--primary-light);
      margin-bottom: 12px;
      border: 1px solid var(--border);
    }

    .login-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .login-subtitle {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 6px;
      line-height: 1.4;
    }

    .login-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
    }

    .server-status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      margin-bottom: 18px;
      cursor: pointer;
    }

    .server-status-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-primary);
    }

    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.online { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }
      &.offline { background: #ef4444; }
    }

    .btn-server-cog {
      background: none;
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 6px;
      color: var(--text-muted);
      font-size: 11px;
      cursor: pointer;
      &:hover { color: var(--text-primary); background: var(--bg-hover); }
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .pos-input--lg {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
    }

    .password-input-wrap {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }

    .login-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 16px;
    }

    .register-prompt-box {
      margin-top: 18px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }

    .register-prompt-link {
      color: var(--primary);
      font-weight: 700;
      margin-left: 6px;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .quick-login-divider {
      margin: 20px 0 12px 0;
      text-align: center;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 100%;
        height: 1px;
        background: var(--border);
      }
      span {
        position: relative;
        background: var(--bg-card);
        padding: 0 10px;
        font-size: 11px;
        color: var(--text-muted);
      }
    }

    .quick-login-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .quick-account-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-hover);
        transform: translateY(-1px);
      }

      .quick-icon { font-size: 16px; }
      .quick-text { flex: 1; overflow: hidden; }
      .quick-role { font-size: 11px; font-weight: 700; color: var(--text-primary); display: block; }
      .quick-user { font-size: 10px; color: var(--text-muted); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .quick-badge-arrow { font-size: 11px; color: var(--text-muted); }
    }

    .login-footer {
      margin-top: 16px;
      text-align: center;
    }

    .offline-badge {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-card);
      border: 1px solid var(--border);
      display: inline-block;
      padding: 4px 12px;
      border-radius: 100px;
    }

    /* ======================================================== */
    /* DESKTOP JOWI POS EMPLOYEE SELECTION STYLES               */
    /* ======================================================== */
    .desktop-staff-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .terminal-brand-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 14px 22px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .terminal-brand-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .terminal-brand-logo {
      font-size: 28px;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .terminal-rest-name {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .terminal-rest-code {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.5px;
    }

    .terminal-brand-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lan-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-hover);
        border-color: var(--border-light);
      }
    }

    .theme-switcher-mini {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      cursor: pointer;
      font-size: 16px;
      &:hover { background: var(--bg-hover); }
    }

    .btn-terminal-unbind {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #ef4444;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(239, 68, 68, 0.22);
        border-color: #ef4444;
        transform: translateY(-1px);
      }
    }

    .staff-heading-wrap {
      text-align: center;
      margin: 8px 0;
    }

    .staff-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .staff-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .staff-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 12px 18px;
      border-radius: 14px;
    }

    .staff-search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 380px;
    }

    .staff-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-muted);
    }

    .staff-search-input {
      width: 100%;
      padding-left: 36px;
      padding-right: 30px;
    }

    .staff-role-filters {
      display: flex;
      gap: 6px;
      background: var(--bg-tertiary);
      padding: 3px;
      border-radius: 10px;
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .role-filter-tab {
      padding: 6px 14px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { color: var(--text-primary); }
      &.active {
        background: var(--bg-card);
        color: var(--primary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    .staff-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 16px;
    }

    .staff-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

      &:hover {
        transform: translateY(-4px);
        border-color: var(--primary);
        box-shadow: 0 12px 28px -6px rgba(99, 102, 241, 0.25);
      }

      &--selected {
        border-color: var(--primary);
        background: rgba(99, 102, 241, 0.08);
      }
    }

    .staff-avatar-wrap {
      position: relative;
    }

    .staff-avatar {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);

      &--admin { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &--waiter { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &--cashier { background: linear-gradient(135deg, #10b981, #059669); }
      &--kitchen { background: linear-gradient(135deg, #ec4899, #be185d); }
      &--default { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    }

    .staff-role-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      text-transform: uppercase;

      &--admin { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
      &--waiter { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
      &--cashier { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
      &--kitchen { background: rgba(236, 72, 153, 0.15); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.3); }
      &--default { background: rgba(99, 102, 241, 0.15); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
    }

    .staff-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .staff-card-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .staff-card-username {
      font-size: 12px;
      color: var(--text-muted);
    }

    .staff-card-pin-only {
      font-size: 11px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
    }

    .admin-auth-tabs {
      display: flex;
      gap: 6px;
      width: 100%;
      background: var(--bg-tertiary);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .admin-auth-tab {
      flex: 1;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: transparent;
      color: var(--text-muted);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: var(--bg-card);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
    }

    .staff-card-action {
      margin-top: 4px;
      .tap-hint {
        font-size: 12px;
        font-weight: 600;
        color: var(--primary);
      }
    }

    .staff-empty-state {
      grid-column: 1 / -1;
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
    }

    /* ======================================================== */
    /* PIN / PASSWORD TOUCH MODAL STYLES                        */
    /* ======================================================== */
    .pos-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }

    .employee-pin-modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      width: 100%;
      max-width: 380px;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: modalPop 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes modalPop {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .pin-modal-close {
      position: absolute;
      top: 18px;
      right: 18px;
      background: none;
      border: none;
      font-size: 16px;
      color: var(--text-muted);
      cursor: pointer;
      &:hover { color: var(--text-primary); }
    }

    .pin-modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
    }

    .modal-emp-avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      color: white;
      margin-bottom: 4px;
    }

    .modal-emp-name {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-emp-role {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      text-transform: uppercase;
    }

    .modal-emp-hint {
      font-size: 13px;
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .pin-input-wrap {
      width: 100%;
    }

    .pin-display-input {
      width: 100%;
      height: 52px;
      text-align: center;
      font-size: 24px;
      letter-spacing: 6px;
      background: var(--bg-tertiary);
      border: 2px solid var(--border);
      border-radius: 12px;
      color: var(--text-primary);
      transition: all 0.2s;

      &:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
      }
    }

    .pin-error-alert {
      width: 100%;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #ef4444;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .touch-numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
    }

    .numpad-btn {
      height: 50px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;

      &:hover {
        background: var(--bg-hover);
        border-color: var(--border-light);
        transform: scale(1.02);
      }

      &:active {
        transform: scale(0.96);
        background: var(--primary);
        color: white;
      }

      &--clear {
        color: #ef4444;
        font-size: 16px;
      }

      &--back {
        color: #f59e0b;
        font-size: 18px;
      }
    }

    .pin-modal-actions {
      display: flex;
      gap: 10px;
      width: 100%;
      margin-top: 6px;
    }
  `]
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  lan = inject(LanStatusService);
  theme = inject(ThemeService);
  deviceService = inject(DeviceBindingService);

  showServerModal = signal<boolean>(false);
  isNetworkError = signal<boolean>(false);
  isBlocked = signal<boolean>(false);

  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  activeQuickUser = signal<string | null>(null);

  // Desktop Activation state
  desktopActivateUsername = signal<string>('');
  desktopActivatePassword = signal<string>('');
  desktopActivateError = signal<string>('');
  desktopActivateLoading = signal<boolean>(false);

  // Desktop Employee Selection state
  employeeSearchQuery = signal<string>('');
  employeeRoleFilter = signal<string>('ALL');
  employeePasswordInput = signal<string>('');
  employeeLoginError = signal<string>('');
  employeeLoginLoading = signal<boolean>(false);
  showEmployeePasswordModal = signal<boolean>(false);

  // Admin auth toggle state inside modal
  adminAuthMode = signal<'PIN' | 'PASSWORD'>('PIN');
  adminUsernameInput = signal<string>('');
  adminPasswordInput = signal<string>('');

  readonly clientAllowedEmployees = computed(() => {
    const all = this.deviceService.cachedEmployees();
    if (!this.lan.isClientMode()) {
      return all;
    }
    // In Client Mode: strictly allow ONLY Waiter and Kitchen staff
    return all.filter(e => {
      const r = (e.role || '').toUpperCase();
      return r === 'WAITER' || r === 'KITCHEN';
    });
  });

  readonly filteredEmployees = computed(() => {
    let list = this.clientAllowedEmployees();
    const roleFilter = this.employeeRoleFilter();
    if (roleFilter !== 'ALL') {
      list = list.filter(e => {
        const r = (e.role || '').toUpperCase();
        if (roleFilter === 'ADMIN') return r === 'ADMIN' || r === 'MANAGER';
        return r === roleFilter;
      });
    }
    const q = this.employeeSearchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(e =>
        (e.fullName || '').toLowerCase().includes(q) ||
        (e.username || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  readonly quickAccounts: QuickAccount[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Platforma Rahbari',
      name: 'Super Admin',
      username: 'superadmin',
      password: 'superadmin123',
      icon: '🌐',
      badgeClass: 'badge-admin',
      description: 'Platform Super Admin'
    },
    {
      role: 'ADMIN',
      title: 'Demo Admin',
      name: 'Oybek Rustamov',
      username: 'admin',
      password: 'admin123',
      icon: '👑',
      badgeClass: 'badge-admin',
      description: 'Demo Restaurant Admin'
    },
    {
      role: 'WAITER',
      title: 'Ofitsiant 1',
      name: 'waiter1',
      username: 'waiter1',
      password: 'admin123',
      icon: '🍽️',
      badgeClass: 'badge-waiter',
      description: 'Ofitsiant 1 (waiter1)'
    },
    {
      role: 'WAITER',
      title: 'Ofitsiant 2',
      name: 'waiter2',
      username: 'waiter2',
      password: 'admin123',
      icon: '🍽️',
      badgeClass: 'badge-waiter',
      description: 'Ofitsiant 2 (waiter2)'
    },
    {
      role: 'KITCHEN',
      title: 'Pitsaxona',
      name: 'pizza',
      username: 'pizza',
      password: 'admin123',
      icon: '🍕',
      badgeClass: 'badge-kitchen',
      description: 'Pitsaxona stansiyasi'
    },
    {
      role: 'KITCHEN',
      title: 'Somsapaz',
      name: 'somsa',
      username: 'somsa',
      password: 'admin123',
      icon: '🥟',
      badgeClass: 'badge-kitchen',
      description: 'Somsapaz stansiyasi'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService
  ) {
    this.loginForm = this.fb.group({
      restaurantCode: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    if (this.lan.isDesktop()) {
      // In Desktop POS terminal mode, always require explicit staff PIN entry.
      // Clear any leftover employee session so terminal opens cleanly at employee/activation screen
      if (this.authService.isAuthenticated()) {
        this.authService.logout();
      }
      this.deviceService.refreshDeviceInfo().subscribe();
    } else {
      if (this.authService.isAuthenticated()) {
        this.router.navigate([this.authService.getDefaultRoute()]);
        return;
      }
    }
    this.lan.checkImmediate();
  }

  onUnbindTerminal(): void {
    const currentName = this.deviceService.boundRestaurant()?.name || 'ushbu restoran';
    const confirmed = confirm(`Haqiqatan ham ushbu POS terminalini "${currentName}"dan ajratmoqchimisiz?\n\nAjratilgandan so'ng yangi restoran admin logini va paroli kiritilishi talab qilinadi.`);
    if (confirmed) {
      this.deviceService.unbindLocalTerminal();
      this.notify.info('Terminal restorandan ajratildi. Yangi restoran login va parolini kiriting.');
    }
  }

  onForgotPassword(): void {
    this.notify.info('Parolni tiklash uchun administratoringiz yoki qo‘llab-quvvatlash xizmati (+998 71 200-00-00) bilan bog‘laning.');
  }

  onServerModalClosed(): void {
    this.showServerModal.set(false);
    this.errorMessage.set('');
    this.isNetworkError.set(false);
    this.lan.checkImmediate();
    if (this.lan.isDesktop()) {
      this.deviceService.refreshDeviceInfo().subscribe();
    }
  }

  /* Desktop Initial Activation Submit */
  onDesktopActivate(): void {
    const user = this.desktopActivateUsername().trim();
    const pass = this.desktopActivatePassword();
    if (!user || !pass) return;

    this.desktopActivateLoading.set(true);
    this.desktopActivateError.set('');

    this.deviceService.activate(user, pass).subscribe({
      next: () => {
        this.desktopActivateLoading.set(false);
        this.notify.success('Kompyuter muvaffaqiyatli restoranga biriktirildi!');
      },
      error: (err) => {
        this.desktopActivateLoading.set(false);
        const msg = err?.error?.message || 'Qurilmani biriktirishda xatolik yuz berdi';
        this.desktopActivateError.set(msg);
      }
    });
  }

  /* Desktop Employee Selection & PIN Login */
  isEmpAdmin(emp: DeviceEmployee | null): boolean {
    if (!emp) return false;
    const r = (emp.role || '').toUpperCase();
    return r === 'ADMIN' || !!emp.isAdmin || emp.authenticationType === 'PASSWORD_AND_PIN';
  }

  onSelectEmployee(emp: DeviceEmployee): void {
    this.deviceService.selectEmployee(emp);
    this.adminAuthMode.set('PIN');
    this.adminUsernameInput.set(emp.username || '');
    this.adminPasswordInput.set('');
    this.employeePasswordInput.set('');
    this.employeeLoginError.set('');
    this.showEmployeePasswordModal.set(true);
  }

  closeEmployeePasswordModal(): void {
    this.showEmployeePasswordModal.set(false);
    this.employeePasswordInput.set('');
    this.adminUsernameInput.set('');
    this.adminPasswordInput.set('');
    this.employeeLoginError.set('');
    this.deviceService.selectEmployee(null);
  }

  onNumpadPress(char: string): void {
    if (char === 'C') {
      this.employeePasswordInput.set('');
    } else if (char === 'DEL') {
      this.employeePasswordInput.update(p => p.slice(0, -1));
    } else {
      if (this.employeePasswordInput().length < 4) {
        this.employeePasswordInput.update(p => p + char);
      }
    }
  }

  onEmployeeLoginSubmit(): void {
    const emp = this.deviceService.selectedEmployee();
    if (!emp) return;

    if (this.lan.isClientMode()) {
      const r = (emp.role || '').toUpperCase();
      if (r !== 'WAITER' && r !== 'KITCHEN') {
        this.employeeLoginError.set('Ushbu mijoz (Client) terminali faqat ofitsiant va oshpazlar uchun mo‘ljallangan.');
        return;
      }
    }

    let secret = '';
    const isAdmin = !this.lan.isClientMode() && this.isEmpAdmin(emp);
    if (isAdmin && this.adminAuthMode() === 'PASSWORD') {
      secret = this.adminPasswordInput();
      if (!secret) return;
    } else {
      secret = this.employeePasswordInput();
      if (!secret) return;
    }

    this.employeeLoginLoading.set(true);
    this.employeeLoginError.set('');

    this.deviceService.employeeLogin(emp.id, secret).subscribe({
      next: () => {
        this.employeeLoginLoading.set(false);
        this.showEmployeePasswordModal.set(false);
        this.notify.success(`Xush kelibsiz, ${emp.fullName}!`);
        this.router.navigate([this.authService.getDefaultRoute()]);
      },
      error: (err) => {
        this.employeeLoginLoading.set(false);
        const msg = err?.error?.message || (isAdmin && this.adminAuthMode() === 'PASSWORD' ? 'Parol noto‘g‘ri.' : 'Parol yoki PIN noto‘g‘ri.');
        this.employeeLoginError.set(msg);
      }
    });
  }

  /* Helpers */
  getRoleTitle(role: string): string {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return 'Admin';
    if (r === 'MANAGER') return 'Menejer';
    if (r === 'WAITER') return 'Ofitsiant';
    if (r === 'CASHIER') return 'Kassir';
    if (r === 'KITCHEN') return 'Oshpaz';
    return r;
  }

  getRoleBadgeClass(role: string): string {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN' || r === 'MANAGER') return 'staff-role-badge--admin';
    if (r === 'WAITER') return 'staff-role-badge--waiter';
    if (r === 'CASHIER') return 'staff-role-badge--cashier';
    if (r === 'KITCHEN') return 'staff-role-badge--kitchen';
    return 'staff-role-badge--default';
  }

  getRoleAvatarClass(role: string): string {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN' || r === 'MANAGER') return 'staff-avatar--admin';
    if (r === 'WAITER') return 'staff-avatar--waiter';
    if (r === 'CASHIER') return 'staff-avatar--cashier';
    if (r === 'KITCHEN') return 'staff-avatar--kitchen';
    return 'staff-avatar--default';
  }

  getInitials(name: string): string {
    if (!name) return 'POS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /* Web Standard Login */
  quickLogin(acc: QuickAccount): void {
    this.activeQuickUser.set(acc.username);
    this.loginForm.patchValue({
      restaurantCode: '',
      username: acc.username,
      password: acc.password
    });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.activeQuickUser.set(null);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.isNetworkError.set(false);
    this.isBlocked.set(false);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.activeQuickUser.set(null);
        if (response.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.authService.getDefaultRoute();
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.activeQuickUser.set(null);

        if (err.status === 403) {
          this.isBlocked.set(true);
          return;
        }

        const isNet = err.status === 0 ||
                      (err.name === 'HttpErrorResponse' && !err.status) ||
                      err.message?.includes('Failed to fetch') ||
                      err.message?.includes('0 Unknown Error') ||
                      err.statusText === 'Unknown Error' ||
                      this.lan.connectionState() !== 'ONLINE';
        this.isNetworkError.set(isNet);
        if (isNet) {
          this.errorMessage.set(`Markaziy Serverga (${this.lan.currentServerUrl()}) ulanib bo‘lmadi. Server kompyuter yoqilganligini va uning IP manzili to‘g‘ri sozlanganligini tekshiring.`);
        } else {
          const msg = err.error?.message || 'Login yoki parol noto‘g‘ri. Qayta urinib ko‘ring.';
          this.errorMessage.set(msg);
        }
      }
    });
  }
}
