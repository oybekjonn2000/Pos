import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { LoadingService } from '../../core/services/loading.service';
import { AuthService } from '../../core/services/auth.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanServerConfigModalComponent } from '../../shared/components/lan-server-config-modal/lan-server-config-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent, TopbarComponent, LanServerConfigModalComponent],
  template: `
    @if (loading.isLoading()) {
      <div class="global-loading"></div>
    }

    <!-- Global LAN Disconnection / Reconnection Banner -->
    @if (lan.connectionState() !== 'ONLINE') {
      <div class="lan-alert-banner offline">
        <div class="banner-content">
          <span class="pulse-icon">🔴</span>
          <span class="banner-text">
            <strong>Server bilan aloqa uzildi!</strong> Qayta ulanilmoqda ({{ lan.currentServerUrl() }})...
          </span>
        </div>
        <button class="btn-banner-action" (click)="showLanModal = true">Sozlash</button>
      </div>
    }

    @if (lan.justReconnected()) {
      <div class="lan-alert-banner online">
        <div class="banner-content">
          <span class="icon">🟢</span>
          <span class="banner-text">
            <strong>Aloqa tiklandi!</strong> Markaziy server bilan barcha ma'lumotlar qayta sinxronlandi.
          </span>
        </div>
      </div>
    }

    <div class="pos-layout" [class.no-sidebar]="auth.isWaiter()">
      @if (!auth.isWaiter()) {
        <app-sidebar (collapsedChange)="sidebarCollapsed = $event" (openLanSettings)="showLanModal = true" />
      }

      <div class="pos-content" [class.sidebar-collapsed]="sidebarCollapsed" [class.no-sidebar]="auth.isWaiter()">
        <app-topbar (openLanSettings)="showLanModal = true" />
        <main class="pos-page" [class.pos-page--in-pos]="isInPos()">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Mobile Bottom Navigation (Visible on screen < 768px, hidden when inside active POS order) -->
    @if (!isInPos()) {
      <nav class="mobile-bottom-nav">
        @if (auth.isWaiter()) {
          <a routerLink="/tables" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">🪑</span>
            <span class="mobile-nav-label">Joylar</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">📋</span>
            <span class="mobile-nav-label">Buyurtmalar</span>
          </a>
        } @else if (isCook()) {
          <a routerLink="/kitchen" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">👨‍🍳</span>
            <span class="mobile-nav-label">Oshxona</span>
          </a>
        } @else {
          <!-- Admin / Manager -->
          <a routerLink="/tables" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">🪑</span>
            <span class="mobile-nav-label">Joylar</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">📋</span>
            <span class="mobile-nav-label">Buyurtmalar</span>
          </a>
          <a routerLink="/kitchen" routerLinkActive="active" class="mobile-nav-item">
            <span class="mobile-nav-icon">👨‍🍳</span>
            <span class="mobile-nav-label">Oshxona</span>
          </a>
        }

        <!-- Profile trigger button on bottom nav -->
        <button type="button" class="mobile-nav-item" (click)="showProfileModal = true">
          <span class="mobile-nav-icon">👤</span>
          <span class="mobile-nav-label">Profil</span>
        </button>
      </nav>
    }

    <!-- Mobile Profile Bottom Sheet -->
    @if (showProfileModal) {
      <div class="profile-sheet-backdrop" (click)="showProfileModal = false">
        <div class="profile-sheet" (click)="$event.stopPropagation()">
          <div class="sheet-handle"></div>
          <div class="sheet-header">
            <div class="user-avatar-lg">
              {{ getUserInitials() }}
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ auth.user()?.fullName }}</h3>
              <span class="user-role-badge">{{ auth.user()?.role || 'Foydalanuvchi' }}</span>
            </div>
            <button class="sheet-close" (click)="showProfileModal = false">✕</button>
          </div>

          <div class="sheet-body">
            <!-- Theme Toggle Row -->
            <div class="sheet-row" (click)="theme.toggleTheme()">
              <div class="sheet-row-info">
                <span class="sheet-icon">{{ theme.isDark() ? '🌙' : '☀' }}</span>
                <div>
                  <div class="sheet-row-title">Tungi / Kunduzgi rejim</div>
                  <div class="sheet-row-sub">{{ theme.isDark() ? 'Hozir: Dark (Tungi)' : 'Hozir: Light (Kunduzgi)' }}</div>
                </div>
              </div>
              <span class="sheet-action-arrow">➜</span>
            </div>

            <!-- LAN Server Status Row -->
            <div class="sheet-row" (click)="showProfileModal = false; showLanModal = true">
              <div class="sheet-row-info">
                <span class="sheet-icon">📡</span>
                <div>
                  <div class="sheet-row-title">POS Server Holati</div>
                  <div class="sheet-row-sub">
                    {{ lan.connectionState() === 'ONLINE' ? '🟢 Online' : '🔴 Offline' }}
                    ({{ lan.currentServerUrl().replace('http://', '') }})
                  </div>
                </div>
              </div>
              <span class="sheet-action-arrow">⚙️</span>
            </div>

            <!-- Logout Button -->
            <button class="btn-mobile-logout" (click)="logout()">
              <span>🚪</span> Tizimdan chiqish
            </button>
          </div>
        </div>
      </div>
    }

    <!-- LAN Server Config Modal -->
    @if (showLanModal) {
      <app-lan-server-config-modal (closed)="showLanModal = false" />
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .lan-alert-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      font-size: 13px;
      animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.offline {
        background: linear-gradient(90deg, #991b1b, #7f1d1d);
        color: #fef2f2;
        border-bottom: 1px solid rgba(239, 68, 68, 0.4);
      }

      &.online {
        background: linear-gradient(90deg, #065f46, #047857);
        color: #ecfdf5;
        border-bottom: 1px solid rgba(16, 185, 129, 0.4);
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .btn-banner-action {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      }
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    /* Mobile Bottom Navigation */
    .mobile-bottom-nav {
      display: none;
    }

    @media (max-width: 767px) {
      .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: calc(56px + var(--safe-bottom));
        padding-bottom: var(--safe-bottom);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border);
        z-index: 1000;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
      }

      .mobile-nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        height: 100%;
        background: transparent;
        border: none;
        color: var(--text-muted);
        text-decoration: none;
        cursor: pointer;
        padding: 4px 0;
        transition: color 0.15s ease;
        -webkit-tap-highlight-color: transparent;

        .mobile-nav-icon {
          font-size: 20px;
          line-height: 1;
        }

        .mobile-nav-label {
          font-size: 11px;
          font-weight: 600;
        }

        &.active, &:hover {
          color: var(--primary);
        }
      }

      /* Profile bottom sheet modal */
      .profile-sheet-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 10000;
        display: flex;
        align-items: flex-end;
      }

      .profile-sheet {
        background: var(--bg-card);
        width: 100%;
        border-radius: 20px 20px 0 0;
        padding: 16px 20px calc(24px + var(--safe-bottom)) 20px;
        box-shadow: var(--shadow-lg);
        animation: slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .sheet-handle {
        width: 38px;
        height: 4px;
        background: var(--border-light);
        border-radius: 100px;
        align-self: center;
      }

      .sheet-header {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .user-avatar-lg {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-details {
        flex: 1;
        min-width: 0;

        .user-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary);
          border-radius: 100px;
          margin-top: 4px;
        }
      }

      .sheet-close {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sheet-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .sheet-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
          transform: scale(0.99);
          background: var(--bg-hover);
        }

        .sheet-row-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .sheet-icon {
            font-size: 20px;
          }

          .sheet-row-title {
            font-size: 13.5px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .sheet-row-sub {
            font-size: 11.5px;
            color: var(--text-muted);
            margin-top: 2px;
          }
        }

        .sheet-action-arrow {
          font-size: 14px;
          color: var(--text-muted);
        }
      }

      .btn-mobile-logout {
        margin-top: 6px;
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border: 1.5px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
          background: #ef4444;
          color: white;
        }
      }

      @keyframes slideUpSheet {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = false;
  showLanModal = false;
  showProfileModal = false;

  lan = inject(LanStatusService);
  theme = inject(ThemeService);
  router = inject(Router);

  constructor(
    public loading: LoadingService,
    public auth: AuthService
  ) {}

  isInPos(): boolean {
    return this.router.url.includes('/pos');
  }

  isCook(): boolean {
    const role = (this.auth.user()?.role || '').toUpperCase();
    return role === 'COOK' || role === 'KITCHEN';
  }

  getUserInitials(): string {
    const name = this.auth.user()?.fullName ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.showProfileModal = false;
    this.auth.logout();
  }
}
