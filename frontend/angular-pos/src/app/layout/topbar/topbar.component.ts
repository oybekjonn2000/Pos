import { Component, computed, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConnectionService } from '../../core/services/connection.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <header class="topbar">
      <div class="topbar__left">
        <div class="topbar__title">
          {{ pageTitle }}
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
             (click)="openLanSettings.emit()"
             [title]="'LAN Server: ' + lan.currentServerUrl() + ' - Sozlash uchun bosing'">
          <span class="dot"></span>
          <span class="status-label">{{ getStatusLabel() }}</span>
          @if (lan.connectionState() === 'ONLINE' && lan.latencyMs() > 0) {
            <span class="latency-badge">
              {{ lan.latencyMs() }}ms
            </span>
          }
        </div>

        <!-- Theme Switcher (Light / Dark) -->
        <div class="theme-switcher"
             [title]="theme.isDark() ? 'Kunduzgi rejimga o‘tish (Light)' : 'Tungi rejimga o‘tish (Dark)'"
             (click)="theme.toggleTheme()">
          <button type="button" class="theme-btn" [class.active]="!theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('light')" title="Light Theme">
            <span class="theme-icon">☀</span>
            <span class="theme-label">Light</span>
          </button>
          <button type="button" class="theme-btn" [class.active]="theme.isDark()" (click)="$event.stopPropagation(); theme.setTheme('dark')" title="Dark Theme">
            <span class="theme-icon">🌙</span>
            <span class="theme-label">Dark</span>
          </button>
        </div>

        <!-- User menu -->
        <div class="topbar__user" (click)="logout()" title="Tizimdan chiqish">
          <span class="user-fullname">{{ auth.user()?.fullName }}</span>
          <span class="user-logout-hint" style="color: var(--text-muted)">⟵ Chiqish</span>
          <span class="user-logout-icon">🚪</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host-context(.no-sidebar) .topbar {
      left: 0 !important;
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

      &__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
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
        padding: 6px 14px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
        border: 1px solid var(--border);
        transition: all var(--transition);

        &:hover {
          background: var(--bg-hover);
          color: var(--danger);
          border-color: var(--danger);
        }

        .user-logout-icon {
          display: none;
          font-size: 16px;
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

    /* Mobile overrides */
    @media (max-width: 767px) {
      .topbar {
        left: 0 !important;
        padding: 0 10px;
        gap: 8px;
        height: 50px;

        &__title {
          font-size: 14px;
          max-width: 140px;
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
          padding: 5px 8px;
          min-height: 36px;

          .user-fullname {
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
          }

          .user-logout-hint {
            display: none;
          }

          .user-logout-icon {
            display: inline-block;
          }
        }
      }
    }
  `]
})
export class TopbarComponent {
  @Output() openLanSettings = new EventEmitter<void>();

  pageTitle = 'Restaurant POS';
  currentTime = new Date();

  lan = inject(LanStatusService);
  theme = inject(ThemeService);

  constructor(
    public auth: AuthService,
    public connection: ConnectionService
  ) {
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  getStatusLabel(): string {
    if (this.lan.connectionState() === 'ONLINE') {
      return 'LAN Online';
    } else if (this.lan.connectionState() === 'RECONNECTING') {
      return 'Qayta ulanmoqda...';
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

  logout(): void {
    this.auth.logout();
  }
}
