import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '../../shared/components/toast-container.component';
import { LoadingService } from '../../core/services/loading.service';
import { AuthService } from '../../core/services/auth.service';
import { LanStatusService } from '../../core/services/lan-status.service';
import { LanServerConfigModalComponent } from '../../shared/components/lan-server-config-modal/lan-server-config-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent, LanServerConfigModalComponent],
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
        <main class="pos-page">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toast-container />

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
  `]
})
export class ShellComponent {
  sidebarCollapsed = false;
  showLanModal = false;

  lan = inject(LanStatusService);

  constructor(
    public loading: LoadingService,
    public auth: AuthService
  ) {}
}
