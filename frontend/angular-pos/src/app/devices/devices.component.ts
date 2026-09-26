import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../shared/components/icon/icon.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { FeatureService } from '../core/services/feature.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, TranslatePipe],
  template: `
    <div class="fade-in devices-container">
      <!-- Page Header -->
      <div class="devices-header">
        <div>
          <h1 class="devices-title">{{ 'devices.title' | translate }}</h1>
          <p class="devices-subtitle">{{ 'devices.subtitle' | translate }}</p>
        </div>
        <div>
          <span *ngIf="hasAccess()" class="status-tag status-tag--active">
            <app-icon name="check-circle" [size]="14"></app-icon>
            PRO Mobil APK Faol
          </span>
          <span *ngIf="!hasAccess()" class="status-tag status-tag--locked">
            <app-icon name="lock" [size]="14"></app-icon>
            {{ 'devices.proBadge' | translate }}
          </span>
        </div>
      </div>

      <!-- 1. NON-PRO VIEW: RESTRICTION & UPGRADE NOTICE -->
      <div *ngIf="!hasAccess()" class="pro-locked-section">
        <div class="pro-locked-banner">
          <div class="pro-locked-hero-icon">
            <app-icon name="smartphone" [size]="48"></app-icon>
          </div>
          <div class="pro-locked-content">
            <span class="pro-pill-badge">
              <app-icon name="crown" [size]="14"></app-icon>
              {{ 'devices.proBadge' | translate }}
            </span>
            <h2 class="pro-locked-heading">{{ 'devices.proRequiredTitle' | translate }}</h2>
            <p class="pro-locked-text">{{ 'devices.proRequiredDesc' | translate }}</p>
            <div class="pro-locked-actions">
              <a routerLink="/restaurant/billing" class="pos-btn pos-btn--primary btn-upgrade-pro">
                <app-icon name="arrow-right" [size]="18"></app-icon>
                <span>{{ 'devices.upgradeToPro' | translate }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- PRO Benefits Feature Grid -->
        <div class="pro-features-grid">
          <div class="pro-feature-card">
            <div class="feature-icon-circle">
              <app-icon name="utensils" [size]="22"></app-icon>
            </div>
            <h4 class="feature-title">{{ 'devices.proFeature1' | translate }}</h4>
            <p class="feature-desc">{{ 'devices.proFeature1Desc' | translate }}</p>
          </div>

          <div class="pro-feature-card">
            <div class="feature-icon-circle">
              <app-icon name="refresh-cw" [size]="22"></app-icon>
            </div>
            <h4 class="feature-title">{{ 'devices.proFeature2' | translate }}</h4>
            <p class="feature-desc">{{ 'devices.proFeature2Desc' | translate }}</p>
          </div>

          <div class="pro-feature-card">
            <div class="feature-icon-circle">
              <app-icon name="bell" [size]="22"></app-icon>
            </div>
            <h4 class="feature-title">{{ 'devices.proFeature3' | translate }}</h4>
            <p class="feature-desc">{{ 'devices.proFeature3Desc' | translate }}</p>
          </div>

          <div class="pro-feature-card">
            <div class="feature-icon-circle">
              <app-icon name="shield" [size]="22"></app-icon>
            </div>
            <h4 class="feature-title">{{ 'devices.proFeature4' | translate }}</h4>
            <p class="feature-desc">{{ 'devices.proFeature4Desc' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- 2. PRO VIEW: SERVER CONNECTION SETTINGS & SETUP GUIDE -->
      <div *ngIf="hasAccess()" class="pro-active-section">
        <div class="pos-card connection-card">
          <div class="card-head">
            <div class="card-head-title">
              <app-icon name="wifi" [size]="20"></app-icon>
              <span>{{ 'devices.connectionTitle' | translate }}</span>
            </div>
            <span class="badge-ready">
              <app-icon name="check-circle" [size]="14"></app-icon>
              Ulanishga tayyor
            </span>
          </div>
          <p class="card-head-sub">{{ 'devices.connectionDesc' | translate }}</p>

          <div class="connection-params-grid">
            <div class="param-box">
              <span class="param-label">{{ 'devices.serverIp' | translate }}</span>
              <span class="param-value">{{ serverHost }}</span>
              <span class="param-hint">Server Wi-Fi manzili</span>
            </div>
            <div class="param-box">
              <span class="param-label">{{ 'devices.serverPort' | translate }}</span>
              <span class="param-value">{{ serverPort }}</span>
              <span class="param-hint">Standart POS porti</span>
            </div>
            <div class="param-box">
              <span class="param-label">{{ 'devices.restCode' | translate }}</span>
              <span class="param-value">{{ restaurantCode() || 'AVTO' }}</span>
              <span class="param-hint">{{ restaurantName() }}</span>
            </div>
          </div>
        </div>

        <!-- Setup Instructions Card -->
        <div class="pos-card setup-steps-card">
          <h3 class="steps-card-title">
            <app-icon name="smartphone" [size]="20"></app-icon>
            {{ 'devices.instructionTitle' | translate }}
          </h3>
          <div class="steps-list">
            <div class="step-item">
              <span class="step-badge">1</span>
              <div class="step-text">
                <strong>{{ 'devices.step1' | translate }}</strong>
                <p>Android smartfonga APK faylini o‘rnating va barcha ruxsatlarni tasdiqlang.</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-badge">2</span>
              <div class="step-text">
                <strong>{{ 'devices.step2' | translate }}</strong>
                <p>Ofitsiant telefoni va ushbu POS kompyuter bir xil Wi-Fi routerga ulangan bo‘lishi lozim.</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-badge">3</span>
              <div class="step-text">
                <strong>{{ 'devices.step3' | translate }}</strong>
                <p>Server IP: <code>{{ serverHost }}</code>, Port: <code>{{ serverPort }}</code>.</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-badge">4</span>
              <div class="step-text">
                <strong>{{ 'devices.step4' | translate }}</strong>
                <p>Ofitsiantlar PIN-kodini Xodimlar bo‘limida o‘rnatishingiz mumkin.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .devices-container {
      padding: 0;
      max-width: 1100px;
    }

    .devices-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
    }

    .devices-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .devices-subtitle {
      color: var(--text-muted);
      font-size: 14px;
    }

    .status-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .status-tag--active {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
    }

    .status-tag--locked {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #f59e0b;
    }

    /* Pro Locked Section */
    .pro-locked-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pro-locked-banner {
      background: linear-gradient(135deg, rgba(30, 33, 43, 0.95) 0%, rgba(20, 22, 32, 0.98) 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 16px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 28px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .pro-locked-hero-icon {
      width: 88px;
      height: 88px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .pro-pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .pro-locked-heading {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .pro-locked-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 18px;
      max-width: 650px;
    }

    .btn-upgrade-pro {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-weight: 700;
      text-decoration: none;
    }

    /* Feature Grid */
    .pro-features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .pro-feature-card {
      background: var(--bg-card, #1e212b);
      border: 1px solid var(--border-color, #32374a);
      border-radius: 14px;
      padding: 20px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .pro-feature-card:hover {
      transform: translateY(-2px);
      border-color: rgba(245, 158, 11, 0.4);
    }

    .feature-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color, #32374a);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      color: var(--icon-color, #a9bce6);
    }

    .feature-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .feature-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Pro Active Section */
    .pro-active-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .connection-card {
      padding: 24px;
      background: var(--bg-card, #1e212b);
      border: 1px solid var(--border-color, #32374a);
      border-radius: 16px;
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .card-head-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .badge-ready {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-size: 12px;
      font-weight: 700;
    }

    .card-head-sub {
      color: var(--text-muted);
      font-size: 13px;
      margin-bottom: 20px;
    }

    .connection-params-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .param-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color, #32374a);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .param-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .param-value {
      font-size: 20px;
      font-weight: 800;
      color: #38bdf8;
      font-family: monospace;
      letter-spacing: 0.5px;
    }

    .param-hint {
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* Setup Steps */
    .setup-steps-card {
      padding: 24px;
      background: var(--bg-card, #1e212b);
      border: 1px solid var(--border-color, #32374a);
      border-radius: 16px;
    }

    .steps-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 17px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .step-text strong {
      display: block;
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .step-text p {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
      margin: 0;
    }

    .step-text code {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #38bdf8;
      font-family: monospace;
    }

    @media (max-width: 768px) {
      .pro-locked-banner {
        flex-direction: column;
        text-align: center;
      }
      .devices-header {
        flex-direction: column;
      }
    }
  `]
})
export class DevicesComponent {
  private readonly featureService = inject(FeatureService);
  private readonly authService = inject(AuthService);

  readonly hasAccess = computed(() => {
    return this.authService.isSuperAdmin() || this.featureService.canAccessMobileApp() || this.featureService.isPro();
  });

  readonly serverHost = window.location.hostname || '192.168.1.100';
  readonly serverPort = '8080';
  readonly restaurantCode = computed(() => this.authService.restaurantCode());
  readonly restaurantName = computed(() => this.authService.restaurantName());
}
