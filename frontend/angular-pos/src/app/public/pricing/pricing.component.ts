import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BillingService, PlanResponse } from '../../core/services/billing.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pricing-page">
      <!-- Public Header Navbar -->
      <header class="public-nav">
        <div class="public-nav__container">
          <div class="public-nav__brand" routerLink="/">
            <span class="brand-icon">🍽️</span>
            <span class="brand-text">Restaurant<strong>POS</strong> <span class="saas-badge">SaaS</span></span>
          </div>

          <nav class="public-nav__links">
            <a routerLink="/pricing" class="nav-link active">Tariflar</a>
            <a routerLink="/login" class="nav-link">Tizimga kirish</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Restoran ochish</a>
          </nav>
        </div>
      </header>

      <!-- Hero Header -->
      <section class="pricing-hero">
        <div class="pricing-hero__badge">✨ O'zbekiston bo'ylab 500+ restoranlar ishonchi</div>
        <h1 class="pricing-hero__title">Restoraningiz uchun shaffof va qulay tariflar</h1>
        <p class="pricing-hero__subtitle">
          Super-adminga bog'lanish shart emas. Hoziroq ro'yxatdan o'ting, 15 kun bepul sinab ko'ring va POS tizimini to'liq boshqaring.
        </p>
      </section>

      <!-- Pricing Grid -->
      <section class="pricing-grid-container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Tariflar yuklanmoqda...</p>
          </div>
        } @else if (error()) {
          <div class="error-banner">
            {{ error() }}
          </div>
        } @else {
          <div class="pricing-grid">
            @for (plan of plans(); track plan.id) {
              <div class="plan-card" [class.popular]="plan.code === 'PRO'" [class.trial]="plan.code === 'TRIAL'">
                @if (plan.code === 'PRO') {
                  <div class="popular-ribbon">Eng ommabop</div>
                }
                @if (plan.code === 'TRIAL') {
                  <div class="popular-ribbon trial-ribbon">15 kun bepul</div>
                }

                <div class="plan-card__header">
                  <h3 class="plan-name">{{ plan.name }}</h3>
                  <p class="plan-desc">{{ plan.description || 'Restoran boshqaruvi uchun' }}</p>
                  
                  <div class="plan-price-wrap">
                    @if (plan.price === 0) {
                      <span class="plan-price">0</span>
                      <span class="plan-currency">so'm</span>
                    } @else {
                      <span class="plan-price">{{ formatPrice(plan.price) }}</span>
                      <span class="plan-currency">so'm / oy</span>
                    }
                  </div>
                </div>

                <!-- Limits Summary (All Unlimited) -->
                <div class="plan-card__limits">
                  <div class="limit-item">
                    <span class="limit-icon">🪑</span>
                    <span class="limit-label">Stollar soni:</span>
                    <strong class="limit-val text-success">♾️ Cheksiz</strong>
                  </div>
                  <div class="limit-item">
                    <span class="limit-icon">👥</span>
                    <span class="limit-label">Xodimlar:</span>
                    <strong class="limit-val text-success">♾️ Cheksiz</strong>
                  </div>
                  <div class="limit-item">
                    <span class="limit-icon">🍔</span>
                    <span class="limit-label">Mahsulotlar:</span>
                    <strong class="limit-val text-success">♾️ Cheksiz</strong>
                  </div>
                  <div class="limit-item">
                    <span class="limit-icon">🍳</span>
                    <span class="limit-label">Oshxonalar:</span>
                    <strong class="limit-val text-success">♾️ Cheksiz</strong>
                  </div>
                </div>

                <!-- Features Checklist -->
                <div class="plan-card__features">
                  <h4 class="features-heading">Imkoniyatlar:</h4>
                  <ul class="features-list">
                    @for (feat of getPlanFeatures(plan); track feat) {
                      <li [class.feature-excluded]="feat.startsWith('❌')">
                        <span class="check-icon">{{ feat.startsWith('❌') ? '—' : '✓' }}</span>
                        {{ feat }}
                      </li>
                    }
                  </ul>
                </div>

                <div class="plan-card__action">
                  <button class="btn btn-choose" 
                          [class.btn-primary]="plan.code === 'PRO'"
                          [class.btn-outline]="plan.code !== 'PRO'"
                          (click)="choosePlan(plan.code)">
                    {{ plan.code === 'TRIAL' ? '15 kun bepul boshlash' : 'Tarifni tanlash' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Feature Comparison / FAQ Section -->
      <section class="pricing-features-section">
        <div class="container">
          <h2 class="section-title">Barcha tariflarda mavjud imkoniyatlar</h2>
          <div class="features-grid">
            <div class="feature-box">
              <div class="feature-box__icon">⚡</div>
              <h4>Tezkor Ofitsiant & Kassa</h4>
              <p>Stollarni real vaqtda bron qilish, zakaz qabul qilish va chek chop etish.</p>
            </div>
            <div class="feature-box">
              <div class="feature-box__icon">👨‍🍳</div>
              <h4>Oshxona Ekrani (KDS)</h4>
              <p>Buyurtmalar statusini real vaqt rejimida yangilab oshxona ishini jadallashtiradi.</p>
            </div>
            <div class="feature-box">
              <div class="feature-box__icon">📊</div>
              <h4>Moliyaviy Hisobotlar</h4>
              <p>Kunlik tushum, ofitsiantlar samaradorligi va eng ko'p sotilgan taomlar tahlili.</p>
            </div>
            <div class="feature-box">
              <div class="feature-box__icon">🔒</div>
              <h4>To'liq Ma'lumot Xavfsizligi</h4>
              <p>Har bir restoranning ma'lumotlari boshqa restoranlardan to'liq izolyatsiya qilingan.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Public Footer -->
      <footer class="public-footer">
        <div class="footer-inner">
          <p>© 2026 RestaurantPOS SaaS Platform. O'zbekiston bo'ylab barcha huquqlar himoyalangan.</p>
          <div class="footer-links">
            <a routerLink="/pricing">Tariflar</a>
            <a routerLink="/register">Ro'yxatdan o'tish</a>
            <a routerLink="/auth/login">Kirish</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .pricing-page {
      min-height: 100vh;
      background: var(--bg-primary, #0f172a);
      color: var(--text-primary, #f8fafc);
      font-family: inherit;
      display: flex;
      flex-direction: column;
    }

    .public-nav {
      border-bottom: 1px solid var(--border, #334155);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 100;

      &__container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        color: var(--text-primary, #f8fafc);

        .saas-badge {
          font-size: 11px;
          background: #6366f1;
          color: white;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 600;
          text-transform: uppercase;
        }
      }

      &__links {
        display: flex;
        align-items: center;
        gap: 20px;

        .nav-link {
          color: var(--text-secondary, #94a3b8);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;

          &:hover, &.active {
            color: #6366f1;
          }
        }
      }
    }

    .pricing-hero {
      text-align: center;
      padding: 60px 24px 40px;
      max-width: 800px;
      margin: 0 auto;

      &__badge {
        display: inline-block;
        font-size: 13px;
        font-weight: 600;
        color: #818cf8;
        background: rgba(99, 102, 241, 0.12);
        padding: 6px 16px;
        border-radius: 9999px;
        margin-bottom: 20px;
        border: 1px solid rgba(99, 102, 241, 0.25);
      }

      &__title {
        font-size: 40px;
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 16px;
        letter-spacing: -0.02em;
      }

      &__subtitle {
        font-size: 17px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.6;
      }
    }

    .pricing-grid-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 24px 60px;
      width: 100%;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      align-items: stretch;
    }

    .plan-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 16px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -10px rgba(0,0,0,0.5);
        border-color: #6366f1;
      }

      &.popular {
        border: 2px solid #6366f1;
        background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-secondary, #1e293b) 100%);
        box-shadow: 0 8px 24px -6px rgba(99, 102, 241, 0.3);
      }

      &.trial {
        border-style: dashed;
      }

      .popular-ribbon {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #6366f1;
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 14px;
        border-radius: 9999px;
        letter-spacing: 0.05em;
        text-transform: uppercase;

        &.trial-ribbon {
          background: #10b981;
        }
      }

      &__header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border, #334155);

        .plan-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .plan-desc {
          font-size: 13px;
          color: var(--text-secondary, #94a3b8);
          margin-bottom: 16px;
          min-height: 38px;
        }

        .plan-price-wrap {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 6px;

          .plan-price {
            font-size: 32px;
            font-weight: 800;
            color: var(--text-primary, #f8fafc);
          }

          .plan-currency {
            font-size: 14px;
            color: var(--text-secondary, #94a3b8);
          }
        }
      }

      &__limits {
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: var(--bg-tertiary, rgba(255,255,255,0.03));
        padding: 14px;
        border-radius: 10px;
        margin-bottom: 24px;

        .limit-item {
          display: flex;
          align-items: center;
          font-size: 13px;

          .limit-icon { margin-right: 8px; font-size: 14px; }
          .limit-label { color: var(--text-secondary, #94a3b8); flex: 1; }
          .limit-val { font-weight: 600; color: var(--text-primary, #f8fafc); }
        }
      }

      &__features {
        flex: 1;
        margin-bottom: 28px;

        .features-heading {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #64748b);
          margin-bottom: 12px;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;

          li {
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary, #cbd5e1);

            .check-icon {
              color: #10b981;
              font-weight: bold;
            }

            &.feature-excluded {
              color: var(--text-muted, #64748b);
              .check-icon {
                color: #ef4444;
              }
            }
          }
        }
      }

      &__action {
        button {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
      }
    }

    .pricing-features-section {
      padding: 60px 24px;
      background: var(--bg-secondary, #1e293b);
      border-top: 1px solid var(--border, #334155);

      .section-title {
        text-align: center;
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 40px;
      }

      .features-grid {
        max-width: 1000px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 24px;
      }

      .feature-box {
        background: var(--bg-primary, #0f172a);
        padding: 24px;
        border-radius: 12px;
        border: 1px solid var(--border, #334155);

        &__icon {
          font-size: 28px;
          margin-bottom: 12px;
        }

        h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        p {
          font-size: 13px;
          color: var(--text-secondary, #94a3b8);
          line-height: 1.5;
        }
      }
    }

    .public-footer {
      padding: 30px 24px;
      border-top: 1px solid var(--border, #334155);
      background: var(--bg-primary, #0f172a);
      margin-top: auto;

      .footer-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 13px;
        color: var(--text-muted, #64748b);
      }

      .footer-links {
        display: flex;
        gap: 20px;

        a {
          color: var(--text-secondary, #94a3b8);
          text-decoration: none;
          &:hover { color: #6366f1; }
        }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      border: 1px solid transparent;

      &-primary {
        background: #6366f1;
        color: white;
        &:hover { background: #4f46e5; }
      }

      &-outline {
        background: transparent;
        border-color: var(--border, #334155);
        color: var(--text-primary, #f8fafc);
        &:hover {
          background: rgba(255,255,255,0.05);
          border-color: #6366f1;
        }
      }

      &-sm {
        padding: 8px 16px;
        font-size: 13px;
      }
    }

    .loading-state {
      text-align: center;
      padding: 60px;
      color: var(--text-secondary, #94a3b8);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border, #334155);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PricingComponent implements OnInit {
  private billingService = inject(BillingService);
  private router = inject(Router);

  plans = signal<PlanResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.billingService.getPublicPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Tariflar ro‘yxatini yuklashda xatolik yuz berdi.');
        this.loading.set(false);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price);
  }

  getPlanFeatures(plan: PlanResponse): string[] {
    if (plan.code === 'PRO') {
      return [
        '⭐️ Barcha STANDARD imkoniyatlari',
        '✅ Oshxona Ekrani (KDS - Kitchen Display System)',
        '✅ Mobil Ofitsiant Ilovasi (Android planshet / telefon)',
        'Cheksiz xodimlar, stollar, mahsulotlar va buyurtmalar',
        'Sexlar bo‘yicha avtomatik buyurtma marshrutlash',
        'LAN va Offline/Online sinxronlash',
        '24/7 prioritet qo‘llab-quvvatlash'
      ];
    } else if (plan.code === 'STANDARD') {
      return [
        'Barcha asosiy POS tizim funksiyalari',
        'Cheksiz xodimlar, stollar, mahsulotlar va buyurtmalar',
        'Interaktiv stollar va zallar boshqaruvi',
        'Kassa, to‘lovlar, chek printerlari',
        'Ombor va mahsulotlar kirim-chiqimi',
        'P&L va barcha moliya hisobotlari',
        'LAN va Offline/Online sinxronlash',
        '❌ Oshxona Ekrani (KDS) kirmaydi',
        '❌ Mobil Ofitsiant ilovasi kirmaydi'
      ];
    } else {
      // TRIAL
      return [
        '15 kun bepul to‘liq sinov davri (0 UZS)',
        'Barcha asosiy POS tizim funksiyalari',
        'Cheksiz xodimlar, stollar, mahsulotlar va buyurtmalar',
        'Kassa, to‘lovlar va chek chop etish',
        'Ombor va tahliliy hisobotlar',
        'LAN va Offline/Online sinxronlash',
        '❌ Oshxona Ekrani (KDS) kirmaydi',
        '❌ Mobil Ofitsiant ilovasi kirmaydi'
      ];
    }
  }

  choosePlan(planCode: string): void {
    this.router.navigate(['/register'], { queryParams: { plan: planCode } });
  }
}
