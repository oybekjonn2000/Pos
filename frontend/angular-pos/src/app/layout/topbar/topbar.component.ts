import { Component, computed, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConnectionService } from '../../core/services/connection.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe, AppIconComponent, LanguageSelectorComponent],
  template: `
    <header class="topbar" [class.collapsed]="sidebarCollapsed">
      <div class="topbar__left">
        @if (!auth.isWaiter()) {
          <button type="button" class="topbar__hamburger" (click)="toggleMobileMenu.emit()" title="Menyuni ochish/yopish" aria-label="Menyu">
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
          </button>
        }
        <div class="topbar__title-group">
          <div class="tenant-badge" [class.tenant-badge--super]="auth.isSuperAdmin()">
            <span class="tenant-icon"><app-icon [name]="auth.isSuperAdmin() ? 'globe' : 'building'" [size]="14"></app-icon></span>
            <span class="tenant-name">{{ auth.restaurantName() }}</span>
            @if (auth.restaurantCode()) {
              <span class="tenant-code">{{ auth.restaurantCode() }}</span>
            }
          </div>
        </div>
      </div>

      <div class="topbar__right">
        <!-- Current time (Hidden on mobile) -->
        <div class="topbar__time">
          {{ currentTime | date:'HH:mm:ss' }}
        </div>

        <!-- Connection status -->
        <div class="connection-indicator"
             [class]="lan.connectionState() === 'ONLINE' ? 'online' : 'offline'"
             (click)="lan.isDesktop() ? openLanSettings.emit() : null"
             [style.cursor]="lan.isDesktop() ? 'pointer' : 'default'"
             [title]="lan.isDesktop() ? ('LAN Server: ' + lan.currentServerUrl() + ' - Sozlash uchun bosing') : ('Server holati: ' + getStatusLabel())">
          <span class="dot"></span>
          <span class="status-label">{{ getStatusLabel() }}</span>
          @if (lan.connectionState() === 'ONLINE' && lan.latencyMs() > 0) {
            <span class="latency-badge">
              {{ lan.latencyMs() }}ms
            </span>
          }
        </div>

        <!-- Language Selector -->
        <app-language-selector></app-language-selector>

        <!-- Theme Switcher (Light / Dark) -->
        <div class="theme-switcher"
             [title]="theme.isDark() ? 'Kunduzgi rejimga o‘tish (Light)' : 'Tungi rejimga o‘tish (Dark)'"
             (click)="theme.toggleTheme()">
          <button type="button" class="theme-btn" [class.active]="!theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('light')" title="Light Theme">
            <span class="theme-icon"><app-icon name="sun" [size]="15"></app-icon></span>
            <span class="theme-label">Light</span>
          </button>
          <button type="button" class="theme-btn" [class.active]="theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('dark')" title="Dark Theme">
            <span class="theme-icon"><app-icon name="moon" [size]="15"></app-icon></span>
            <span class="theme-label">Dark</span>
          </button>
        </div>

        <!-- User Profile (Admin block) -->
        <div class="topbar__user" (click)="openProfile.emit()" [title]="auth.user()?.fullName || 'Foydalanuvchi'">
          <div class="topbar__avatar">
            {{ getUserInitials() }}
          </div>
          <div class="topbar__user-info">
            <span class="topbar__user-name">{{ auth.user()?.fullName }}</span>
            <span class="topbar__user-role">{{ auth.user()?.role || auth.user()?.username }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host-context(.no-sidebar) .topbar {
      left: 0 !important;
    }

    :host-context(.sidebar-collapsed) .topbar,
    .topbar.collapsed {
      left: var(--sidebar-collapsed-width) !important;
    }

    .topbar {
      position: fixed;
      top: 0;
      right: 0;
      left: var(--sidebar-width);
      height: var(--topbar-height);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      z-index: 999;
      gap: 16px;
      transition: left var(--transition-slow);

      &__left { flex: 1; }

      &__title-group {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      &__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .tenant-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary);

        .tenant-icon {
          font-size: 13px;
        }

        .tenant-name {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tenant-code {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        &--super {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(99, 102, 241, 0.08);
          color: #6366f1;
        }
      }

      &__right {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      &__time {
        font-family: var(--font-mono);
        font-size: 14px;
        color: var(--text-secondary);
        background: var(--bg-tertiary);
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
      }

      /* Theme Switcher Styles */
      .theme-switcher {
        display: inline-flex;
        align-items: center;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: 100px;
        padding: 3px;
        gap: 2px;
        cursor: pointer;
        user-select: none;
        transition: all var(--transition);

        &:hover {
          border-color: var(--primary-light);
        }
      }

      .theme-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 100px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-size: 12px;
        font-weight: 600;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

        .theme-icon {
          font-size: 13px;
          line-height: 1;
        }

        .theme-label {
          font-size: 12px;
        }

        &.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
      }

      &__user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 12px 4px 6px;
        border-radius: 100px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        cursor: pointer;
        user-select: none;
        transition: all var(--transition);

        &:hover {
          background: var(--bg-hover);
          border-color: var(--primary-light);
        }

        .topbar__avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), #8b5cf6);
          color: white;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .topbar__user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          text-align: left;
        }

        .topbar__user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar__user-role {
          font-size: 10px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .latency-badge {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        border-radius: 100px;
        padding: 1px 6px;
        font-size: 11px;
        font-weight: 700;
      }
    }

    .topbar__hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;

      .hamburger-bar {
        width: 18px;
        height: 2px;
        background: var(--text-primary);
        border-radius: 2px;
        transition: all 0.2s ease;
      }

      &:active {
        background: var(--bg-hover);
        transform: scale(0.96);
      }
    }

    /* Tablet (768px - 1023px) */
    @media (min-width: 768px) and (max-width: 1023px) {
      .topbar {
        left: 68px !important;
        padding: 0 14px;
      }
      .topbar__hamburger {
        display: flex;
      }
    }

    /* Mobile overrides (< 768px) */
    @media (max-width: 767px) {
      .topbar {
        left: 0 !important;
        padding: 0 10px;
        gap: 8px;
        height: 52px;

        &__hamburger {
          display: flex;
        }

        &__title {
          font-size: 13.5px;
          max-width: 130px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &__right {
          gap: 6px;
        }

        &__time {
          display: none;
        }

        .tenant-badge {
          padding: 2px 6px;
          font-size: 11px;
          .tenant-name {
            max-width: 100px;
          }
        }

        .connection-indicator {
          padding: 5px 8px;
          font-size: 11px;

          .status-label {
            display: none;
          }

          .latency-badge {
            display: none;
          }
        }

        .theme-switcher {
          padding: 2px;
          .theme-btn {
            padding: 4px 6px;
            .theme-label {
              display: none;
            }
          }
        }

        &__user {
          padding: 2px;
          border-radius: 50%;
          min-height: auto;

          .topbar__user-info {
            display: none;
          }
        }
      }
    }
  `]
})
export class TopbarComponent {
  @Input() sidebarCollapsed = false;
  @Output() openLanSettings = new EventEmitter<void>();
  @Output() toggleMobileMenu = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();

  currentTime = new Date();

  lan = inject(LanStatusService);
  theme = inject(ThemeService);

  constructor(public i18n: TranslationService, 
    public auth: AuthService,
    public connection: ConnectionService
  ) {
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  getStatusLabel(): string {
    if (this.lan.connectionState() === 'ONLINE') {
      return 'LAN Online';
    } else if (this.lan.connectionState() === 'RECONNECTING') {
      return this.i18n.t('common.loading');
    } else {
      return 'LAN Offline';
    }
  }

  getStatusTooltip(): string {
    const sim = this.connection.offlineSimulation();
    const base = sim ? 'SIMULATING OFFLINE - Click to toggle' : 'Click to simulate offline mode';
    const pending = this.connection.pendingSyncCount();
    return pending > 0 ? `${base} | ${pending} pending sync events` : base;
  }

  getUserInitials(): string {
    const name = this.auth.user()?.fullName ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.auth.logout();
  }
}
