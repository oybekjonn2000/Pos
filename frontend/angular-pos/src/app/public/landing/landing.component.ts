import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BillingService, PlanResponse } from '../../core/services/billing.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Public Header Navbar -->
      <header class="landing-header">
        <div class="container header-container">
          <div class="brand" routerLink="/">
            <span class="brand-icon">🍽️</span>
            <span class="brand-name">Restaurant<strong>POS</strong> <span class="badge-saas">SaaS</span></span>
          </div>

          <nav class="nav-menu">
            <a href="#features" class="nav-item">Imkoniyatlar</a>
            <a href="#advantages" class="nav-item">Afzalliklar</a>
            <a href="#pricing" class="nav-item">Tariflar</a>
            <a href="#faq" class="nav-item">Savol-Javob</a>
          </nav>

          <div class="header-actions">
            <!-- Theme toggle -->
            <button type="button" class="btn-theme-toggle" (click)="theme.toggleTheme()" [title]="theme.isDark() ? 'Kunduzgi rejim (Light)' : 'Tungi rejim (Dark)'">
              {{ theme.isDark() ? '☀️' : '🌙' }}
            </button>

            @if (auth.isAuthenticated()) {
              <a [routerLink]="auth.getDefaultRoute()" class="btn btn-primary btn-sm">
                Dashboardga o'tish →
              </a>
            } @else {
              <a routerLink="/login" class="btn btn-outline btn-sm">
                Kirish
              </a>
              <a routerLink="/register" class="btn btn-primary btn-sm">
                Restoran ochish
              </a>
            }
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-badge">
            <span class="badge-dot"></span> O'zbekiston bo'ylab 500+ restoranlar tanlovi
          </div>

          <h1 class="hero-title">
            Restoraningizni Boshqarish Endi <span class="gradient-text">Oson va Shaffof</span>
          </h1>

          <p class="hero-subtitle">
            Ofitsiantlar, oshxona ekranlari (KDS), kassa, ombor va hisobotlar — barchasi yagona bulutli POS tizimida. 
            Super-adminga murojaat qilmasdan, hoziroq <strong>14 kun bepul</strong> sinab ko'ring!
          </p>

          <div class="hero-cta-group">
            <a routerLink="/register" class="btn btn-primary btn-lg">
              🚀 14 kun bepul boshlash
            </a>
            <a href="#pricing" class="btn btn-outline btn-lg">
              💳 Tariflarni ko'rish
            </a>
          </div>

          <!-- Hero Metrics Cards -->
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-num">99.9%</span>
              <span class="metric-label">Uzluksiz Barqarorlik</span>
            </div>
            <div class="metric-card">
              <span class="metric-num">2x</span>
              <span class="metric-label">Tezkor Buyurtma Olish</span>
            </div>
            <div class="metric-card">
              <span class="metric-num">0 so'm</span>
              <span class="metric-label">Boshlang'ich To'lov</span>
            </div>
            <div class="metric-card">
              <span class="metric-num">LAN</span>
              <span class="metric-label">Offline/Online Rejim</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">IMKONIYATLAR</span>
            <h2 class="section-title">Restoraningiz uchun to'liq POS ekotizimi</h2>
            <p class="section-desc">Kichik kafedan yirik restoranlar tarmog'igacha barcha operatsiyalarni avtomatlashtiring.</p>
          </div>

          <div class="features-grid">
            <!-- Feature 1 -->
            <div class="feature-card">
              <div class="feature-icon icon-blue">📱</div>
              <h3 class="feature-title">Ofitsiantlar Boshqaruvi</h3>
              <p class="feature-text">
                Interaktiv stollar xaritasi, buyurtmalarni tezkor kiritish, ofitsiant shaxsiy PIN-kodi va stollarni boshqarish.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="feature-card">
              <div class="feature-icon icon-amber">👨‍🍳</div>
              <h3 class="feature-title">Oshxona Ekranlari (KDS)</h3>
              <p class="feature-text">
                Buyurtmalar avtomatik sexlarga (Issiq ovqat, Mangal, Bar) taqsimlanadi. Tayyor bo'lish vaqti va holatlar nazorati.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="feature-card">
              <div class="feature-icon icon-green">💵</div>
              <h3 class="feature-title">Kassa va To'lovlar</h3>
              <p class="feature-text">
                Naqd, karta, Click/Payme va aralash to'lovlar. Chek chiqarish, xizmat foizini hisoblash va smenani yopish.
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="feature-card">
              <div class="feature-icon icon-purple">📦</div>
              <h3 class="feature-title">Ombor va Retseptlar</h3>
              <p class="feature-text">
                Mahsulotlar tarkibi (ingredientlar), xomashyo sarfi, qoldiqlar tahlili va mahsulotlar tannarxi kalkulyatsiyasi.
              </p>
            </div>

            <!-- Feature 5 -->
            <div class="feature-card">
              <div class="feature-icon icon-cyan">🪑</div>
              <h3 class="feature-title">Stollar va Zallar Xaritasi</h3>
              <p class="feature-text">
                Restoran zallarini (Asosiy zal, VIP xonalar, Yozgi ayvon) qulay boshqarish, stollarning bandlik ranglari.
              </p>
            </div>

            <!-- Feature 6 -->
            <div class="feature-card">
              <div class="feature-icon icon-emerald">🖨️</div>
              <h3 class="feature-title">Printer bilan Ishlash</h3>
              <p class="feature-text">
                80mm va 58mm termal printerlar bilan to'liq integratsiya. Oshxona va kassa cheklarini avtomatik chop etish.
              </p>
            </div>

            <!-- Feature 7 -->
            <div class="feature-card">
              <div class="feature-icon icon-indigo">🌐</div>
              <h3 class="feature-title">Online va Offline Ishlash</h3>
              <p class="feature-text">
                Internet uzilib qolgan taqdirda ham lokal tarmoq (LAN) orqali kassa va oshxona to'xtovsiz ishlashda davom etadi.
              </p>
            </div>

            <!-- Feature 8 -->
            <div class="feature-card">
              <div class="feature-icon icon-rose">👥</div>
              <h3 class="feature-title">Xodimlarni Boshqarish</h3>
              <p class="feature-text">
                Admin, Menejer, Kassir, Ofitsiant, Oshpaz rollari. Har bir xodim uchun shaxsiy ruxsatlar va faoliyat auditi.
              </p>
            </div>

            <!-- Feature 9 -->
            <div class="feature-card">
              <div class="feature-icon icon-violet">📊</div>
              <h3 class="feature-title">Moliya va Hisobotlar</h3>
              <p class="feature-text">
                Kunlik va oylik tushum, sof foyda, eng xaridorgir taomlar, ofitsiantlar reytingi va sotuvlar dinamikasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Advantages Section -->
      <section id="advantages" class="advantages-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">AFZALLIKLAR</span>
            <h2 class="section-title">Nega aynan RestaurantPOS SaaS?</h2>
          </div>

          <div class="advantages-grid">
            <div class="advantage-item">
              <div class="adv-num">01</div>
              <h4>Mustaqil Tezkor Start</h4>
              <p>Super-adminga bog'lanish yoki kutish shart emas. 2 daqiqada ro'yxatdan o'tib, darhol POS'dan foydalanishni boshlang.</p>
            </div>

            <div class="advantage-item">
              <div class="adv-num">02</div>
              <h4>Multi-Tenant Xavfsizlik</h4>
              <p>Zero-trust arxitekturasi: har bir restoranning ma'lumotlari, savdolari va xodimlari faqat o'ziga ko'rinadi.</p>
            </div>

            <div class="advantage-item">
              <div class="adv-num">03</div>
              <h4>Istalgan Qurilmada</h4>
              <p>Monoblok, Windows kompyuter, planshet yoki smartfon — barcha zamonaviy ekranlarga moslashadi.</p>
            </div>

            <div class="advantage-item">
              <div class="adv-num">04</div>
              <h4>O'zbekistonga Moslashgan</h4>
              <p>O'zbek va rus tillari, so'm valyutasi, mahalliy soliq va to'lov tizimlari (Click, Payme, Uzum) uchun qulay.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing" class="pricing-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">TARIF REJALARI</span>
            <h2 class="section-title">Shaffof va Qulay Narxlar</h2>
            <p class="section-desc">Hech qanday yashirin to'lovlarsiz. Dastlabki 14 kun barcha tariflar mutlaqo bepul!</p>
          </div>

          <div class="pricing-cards-grid">
            @for (plan of plans(); track plan.id) {
              <div class="plan-card" [class.featured]="plan.code === 'BUSINESS'" [class.trial-card]="plan.code === 'TRIAL'">
                @if (plan.code === 'BUSINESS') {
                  <div class="featured-badge">Tavsiya etiladi</div>
                }
                @if (plan.code === 'TRIAL') {
                  <div class="featured-badge trial-badge">14 kun bepul</div>
                }

                <div class="plan-card-top">
                  <h3 class="plan-title">{{ plan.name }}</h3>
                  <p class="plan-desc">{{ plan.description || 'Restoran boshqaruvi uchun' }}</p>

                  <div class="price-block">
                    <span class="amount">{{ formatPrice(plan.price) }}</span>
                    <span class="unit">so'm / oy</span>
                  </div>
                </div>

                <div class="plan-limits">
                  <div class="limit-line">🪑 Stollar: <strong>{{ plan.maxTables ? plan.maxTables + ' ta' : 'Cheksiz' }}</strong></div>
                  <div class="limit-line">👥 Xodimlar: <strong>{{ plan.maxUsers ? plan.maxUsers + ' ta' : 'Cheksiz' }}</strong></div>
                  <div class="limit-line">🍔 Mahsulotlar: <strong>{{ plan.maxProducts ? plan.maxProducts + ' ta' : 'Cheksiz' }}</strong></div>
                  <div class="limit-line">👨‍🍳 Oshxonalar: <strong>{{ plan.maxKitchens ? plan.maxKitchens + ' ta' : 'Cheksiz' }}</strong></div>
                </div>

                <div class="plan-features">
                  <ul class="features-list">
                    @for (feat of getPlanFeatures(plan); track feat) {
                      <li><span class="check-icon">✓</span> {{ feat }}</li>
                    }
                  </ul>
                </div>

                <div class="plan-action">
                  <a [routerLink]="['/register']" [queryParams]="{ plan: plan.code }" 
                     class="btn w-full"
                     [class.btn-primary]="plan.code === 'BUSINESS'"
                     [class.btn-outline]="plan.code !== 'BUSINESS'">
                    {{ plan.code === 'TRIAL' ? 'Sinovni boshlash' : 'Tarifni tanlash' }}
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section id="faq" class="faq-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">SAVOL-JAVOB</span>
            <h2 class="section-title">Ko'p beriladigan savollar</h2>
          </div>

          <div class="faq-grid">
            <div class="faq-item" (click)="toggleFaq(1)">
              <div class="faq-question">
                <h4>14 kunlik bepul sinov qanday ishlaydi?</h4>
                <span class="faq-toggle">{{ openFaq() === 1 ? '−' : '+' }}</span>
              </div>
              @if (openFaq() === 1) {
                <div class="faq-answer">
                  Ro'yxatdan o'tishingiz bilan sizga avtomatik ravishda 14 kunlik to'liq litsenziya beriladi. 
                  Bu davrda hech qanday to'lov kartasi talab qilinmaydi. 14 kundan so'ng o'zingizga ma'qul tarifni sotib olishingiz mumkin.
                </div>
              }
            </div>

            <div class="faq-item" (click)="toggleFaq(2)">
              <div class="faq-question">
                <h4>Internet o'chib qolsa tizim to'xtab qoladimi?</h4>
                <span class="faq-toggle">{{ openFaq() === 2 ? '−' : '+' }}</span>
              </div>
              @if (openFaq() === 2) {
                <div class="faq-answer">
                  Yo'q! RestaurantPOS lokal server va LAN orqali ishlaydi. Internet yo'q bo'lsa ham ofitsiantlar buyurtma olaveradi, 
                  oshxonaga chek chiqadi va kassa ishlayveradi.
                </div>
              }
            </div>

            <div class="faq-item" (click)="toggleFaq(3)">
              <div class="faq-question">
                <h4>Mavjud chek printerlarimizni ulay olamizmi?</h4>
                <span class="faq-toggle">{{ openFaq() === 3 ? '−' : '+' }}</span>
              </div>
              @if (openFaq() === 3) {
                <div class="faq-answer">
                  Ha, tizim har qanday Windows bilan ishlaydigan standart 80mm va 58mm termal chek printerlarini (USB, LAN, Wi-Fi) qo'llab-quvvatlaydi.
                </div>
              }
            </div>

            <div class="faq-item" (click)="toggleFaq(4)">
              <div class="faq-question">
                <h4>Obuna muddati tugasa ma'lumotlarim o'chib ketadimi?</h4>
                <span class="faq-toggle">{{ openFaq() === 4 ? '−' : '+' }}</span>
              </div>
              @if (openFaq() === 4) {
                <div class="faq-answer">
                  Hech qachon! Barcha buyurtmalaringiz, hisobotlaringiz, stollar va mahsulotlar xavfsiz saqlanadi. 
                  Faqat yangi buyurtmalar qabul qilish vaqtinchalik cheklanadi. Yangi to'lov qilishingiz bilan barcha funksiyalar qayta ochiladi.
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Pre-Footer CTA -->
      <section class="cta-banner-section">
        <div class="container cta-container">
          <h2>Restoraningizni zamonaviy darajaga olib chiqing</h2>
          <p>Super-adminga bog'lanish shart emas. Hoziroq ro'yxatdan o'ting va bugunoq ish boshlang.</p>
          <div class="cta-buttons">
            <a routerLink="/register" class="btn btn-primary btn-lg">🚀 Restoranni ro'yxatdan o'tkazish</a>
            <a routerLink="/login" class="btn btn-outline btn-lg">🔑 Tizimga kirish</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="container footer-content">
          <div class="footer-col brand-col">
            <div class="brand">
              <span class="brand-icon">🍽️</span>
              <span class="brand-name">Restaurant<strong>POS</strong> SaaS</span>
            </div>
            <p class="brand-tagline">O'zbekiston restoranlari va kafelari uchun zamonaviy bulutli va lokal POS tizimi.</p>
          </div>

          <div class="footer-col">
            <h4>Sahifalar</h4>
            <ul>
              <li><a href="#features">Imkoniyatlar</a></li>
              <li><a href="#advantages">Afzalliklar</a></li>
              <li><a href="#pricing">Tariflar</a></li>
              <li><a href="#faq">Savol-Javob</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Platforma</h4>
            <ul>
              <li><a routerLink="/login">Tizimga kirish</a></li>
              <li><a routerLink="/register">Ro'yxatdan o'tish</a></li>
              <li><a routerLink="/pricing">Tariflar jadvali</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Bog'lanish</h4>
            <p>Qo'llab-quvvatlash: 24/7</p>
            <p>Email: support&#64;restaurantpos.uz</p>
            <p>Telegram: &#64;restaurantpos_uz</p>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="container">
            <p>© 2026 RestaurantPOS SaaS Platform. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: var(--bg-primary, #0f172a);
      color: var(--text-primary, #f8fafc);
      font-family: inherit;
      overflow-x: hidden;
    }

    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Header */
    .landing-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 0 var(--border);

      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 20px;
        font-weight: 700;

        .brand-icon { font-size: 24px; }
        .badge-saas {
          font-size: 11px;
          background: #6366f1;
          color: white;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 600;
          text-transform: uppercase;
        }
      }

      .nav-menu {
        display: flex;
        gap: 28px;

        @media (max-width: 768px) {
          display: none;
        }

        .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;

          &:hover {
            color: var(--primary);
          }
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .btn-theme-toggle {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, border-color 0.2s;
          &:hover {
            background: var(--bg-hover);
            border-color: var(--border-light);
          }
        }
      }
    }

    /* Hero */
    .hero-section {
      padding: 90px 0 60px;
      text-align: center;
      position: relative;
      background: radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%);

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: #818cf8;
        padding: 6px 18px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 24px;

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
        }
      }

      .hero-title {
        font-size: 52px;
        font-weight: 900;
        line-height: 1.15;
        max-width: 900px;
        margin: 0 auto 24px;
        letter-spacing: -0.02em;

        @media (max-width: 768px) {
          font-size: 36px;
        }
      }

      .hero-subtitle {
        font-size: 18px;
        color: var(--text-secondary, #94a3b8);
        max-width: 760px;
        margin: 0 auto 36px;
        line-height: 1.6;

        strong { color: #34d399; }
      }

      .hero-cta-group {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 60px;
        flex-wrap: wrap;
      }

      .hero-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        max-width: 960px;
        margin: 0 auto;

        .metric-card {
          background: var(--bg-secondary, #1e293b);
          border: 1px solid var(--border, #334155);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;

          .metric-num {
            font-size: 28px;
            font-weight: 800;
            color: #818cf8;
          }

          .metric-label {
            font-size: 13px;
            color: var(--text-secondary, #94a3b8);
          }
        }
      }
    }

    /* Section Headers */
    .section-header {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 50px;

      .section-tag {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #818cf8;
        background: rgba(99, 102, 241, 0.1);
        padding: 4px 14px;
        border-radius: 9999px;
        display: inline-block;
        margin-bottom: 12px;
      }

      .section-title {
        font-size: 34px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .section-desc {
        font-size: 16px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
      }
    }

    /* Features Grid */
    .features-section {
      padding: 90px 0;
      background: var(--bg-secondary, #1e293b);
      border-top: 1px solid var(--border, #334155);
      border-bottom: 1px solid var(--border, #334155);

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      }

      .feature-card {
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 16px;
        padding: 28px;
        transition: transform 0.2s, border-color 0.2s;

        &:hover {
          transform: translateY(-4px);
          border-color: #6366f1;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 18px;

          &.icon-blue { background: rgba(59, 130, 246, 0.15); }
          &.icon-amber { background: rgba(245, 158, 11, 0.15); }
          &.icon-green { background: rgba(16, 185, 129, 0.15); }
          &.icon-purple { background: rgba(168, 85, 247, 0.15); }
          &.icon-cyan { background: rgba(6, 182, 212, 0.15); }
          &.icon-emerald { background: rgba(16, 185, 129, 0.15); }
          &.icon-indigo { background: rgba(99, 102, 241, 0.15); }
          &.icon-rose { background: rgba(244, 63, 94, 0.15); }
          &.icon-violet { background: rgba(139, 92, 246, 0.15); }
        }

        .feature-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .feature-text {
          font-size: 14px;
          color: var(--text-secondary, #94a3b8);
          line-height: 1.6;
          margin: 0;
        }
      }
    }

    /* Advantages */
    .advantages-section {
      padding: 90px 0;

      .advantages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
      }

      .advantage-item {
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border, #334155);
        border-radius: 16px;
        padding: 30px 24px;

        .adv-num {
          font-size: 24px;
          font-weight: 900;
          color: #6366f1;
          margin-bottom: 14px;
        }

        h4 {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        p {
          font-size: 14px;
          color: var(--text-secondary, #94a3b8);
          line-height: 1.5;
          margin: 0;
        }
      }
    }

    /* Pricing Section */
    .pricing-section {
      padding: 90px 0;
      background: var(--bg-secondary, #1e293b);
      border-top: 1px solid var(--border, #334155);
      border-bottom: 1px solid var(--border, #334155);

      .pricing-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 24px;
        align-items: stretch;
      }

      .plan-card {
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 16px;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: transform 0.2s, border-color 0.2s;

        &:hover {
          transform: translateY(-4px);
          border-color: #6366f1;
        }

        &.featured {
          border: 2px solid #6366f1;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
        }

        &.trial-card {
          border-style: dashed;
        }

        .featured-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #6366f1;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 9999px;
          text-transform: uppercase;

          &.trial-badge {
            background: #10b981;
          }
        }

        .plan-card-top {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border, #334155);

          .plan-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
          .plan-desc { font-size: 13px; color: var(--text-secondary, #94a3b8); margin-bottom: 14px; min-height: 36px; }

          .price-block {
            .amount { font-size: 32px; font-weight: 800; color: var(--text-primary, #f8fafc); }
            .unit { font-size: 13px; color: var(--text-secondary, #94a3b8); margin-left: 4px; }
          }
        }

        .plan-limits {
          background: var(--bg-secondary, #1e293b);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;

          .limit-line {
            display: flex;
            justify-content: space-between;
            color: var(--text-secondary, #94a3b8);
            strong { color: var(--text-primary, #f8fafc); }
          }
        }

        .plan-features {
          flex: 1;
          margin-bottom: 24px;

          .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;

            li {
              font-size: 13px;
              color: var(--text-secondary, #cbd5e1);
              display: flex;
              align-items: center;
              gap: 8px;

              .check-icon {
                color: #10b981;
                font-weight: 700;
              }
            }
          }
        }

        .plan-action {
          .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            font-size: 14px;
            border-radius: 10px;
          }
        }
      }
    }

    /* FAQ */
    .faq-section {
      padding: 90px 0;

      .faq-grid {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .faq-item {
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border, #334155);
        border-radius: 12px;
        padding: 18px 24px;
        cursor: pointer;
        transition: border-color 0.2s;

        &:hover { border-color: #6366f1; }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;

          h4 { font-size: 16px; font-weight: 700; margin: 0; }
          .faq-toggle { font-size: 20px; font-weight: bold; color: #818cf8; }
        }

        .faq-answer {
          margin-top: 12px;
          font-size: 14px;
          color: var(--text-secondary, #94a3b8);
          line-height: 1.6;
        }
      }
    }

    /* CTA Banner */
    .cta-banner-section {
      padding: 80px 0;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
      border-top: 1px solid var(--border, #334155);
      border-bottom: 1px solid var(--border, #334155);

      .cta-container {
        text-align: center;
        max-width: 800px;

        h2 { font-size: 34px; font-weight: 800; margin-bottom: 12px; }
        p { font-size: 16px; color: var(--text-secondary, #94a3b8); margin-bottom: 28px; }

        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
      }
    }

    /* Footer */
    .landing-footer {
      padding: 60px 0 30px;
      background: var(--bg-primary, #0f172a);

      .footer-content {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr;
        gap: 36px;
        margin-bottom: 40px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }

      .brand-col {
        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .brand-tagline {
          font-size: 13px;
          color: var(--text-muted, #64748b);
          line-height: 1.5;
        }
      }

      .footer-col {
        h4 {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          color: var(--text-primary, #f8fafc);
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;

          a {
            color: var(--text-secondary, #94a3b8);
            text-decoration: none;
            font-size: 13px;
            transition: color 0.2s;
            &:hover { color: #818cf8; }
          }
        }

        p {
          font-size: 13px;
          color: var(--text-secondary, #94a3b8);
          margin-bottom: 8px;
        }
      }

      .footer-bottom {
        border-top: 1px solid var(--border, #334155);
        padding-top: 24px;
        text-align: center;
        font-size: 13px;
        color: var(--text-muted, #64748b);
      }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;

      &-primary {
        background: #6366f1;
        color: white;
        &:hover { background: #4f46e5; transform: translateY(-1px); }
      }

      &-outline {
        background: transparent;
        border-color: var(--border, #334155);
        color: var(--text-primary, #f8fafc);
        &:hover { background: rgba(255,255,255,0.06); border-color: #818cf8; }
      }

      &-sm {
        padding: 8px 16px;
        font-size: 13px;
      }

      &-lg {
        padding: 14px 28px;
        font-size: 16px;
        border-radius: 10px;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  public auth = inject(AuthService);
  public theme = inject(ThemeService);
  private billingService = inject(BillingService);

  plans = signal<PlanResponse[]>([]);
  openFaq = signal<number | null>(1);

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.billingService.getPublicPlans().subscribe({
      next: (data) => this.plans.set(data),
      error: () => {}
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price || 0);
  }

  toggleFaq(id: number): void {
    this.openFaq.update(curr => curr === id ? null : id);
  }

  getPlanFeatures(plan: PlanResponse): string[] {
    if (plan.features && plan.features.length > 0) {
      return plan.features;
    }
    if (plan.code === 'TRIAL') {
      return ['14 kun bepul sinov', 'Barcha POS funksiyalari', 'Oshxona ekrani (KDS)', 'Chek chiqarish'];
    } else if (plan.code === 'STARTER') {
      return ['Kichik kafe va choyxonalar', 'Stollar va buyurtmalar', 'Chek va hisobotlar', '24/7 yordam'];
    } else if (plan.code === 'BUSINESS') {
      return ['Katta restoranlar uchun', 'Oshxona ekrani (KDS)', 'Ko‘p zallar va stollar', 'Yetkazib berish (Delivery)'];
    } else {
      return ['Yirik restoran tarmoqlari', 'Cheksiz mahsulotlar', 'Cheksiz stollar va xodimlar', 'Prioritet yordam'];
    }
  }
}
