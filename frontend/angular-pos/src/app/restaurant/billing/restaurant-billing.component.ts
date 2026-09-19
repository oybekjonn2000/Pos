import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BillingService,
  CurrentSubscriptionResponse,
  PlanResponse,
  CalculatePriceResponse,
  InvoiceResponse,
  SubscriptionPeriodResponse
} from '../../core/services/billing.service';

@Component({
  selector: 'app-restaurant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billing-page">
      <!-- Page Header -->
      <div class="billing-header">
        <div>
          <h1 class="page-title">Tariflar va Obuna Boshqaruvi</h1>
          <p class="page-subtitle">Restoraningiz obuna holati, xizmat limitlari va hisob-fakturalar</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCheckoutModal()">
            ⚡ Tarifni Yangilash / Uzaytirish
          </button>
        </div>
      </div>

      <!-- Warning Banners based on Subscription Expiry & Warnings -->
      @if (sub()) {
        <!-- Expired Banner -->
        @if (sub()!.status === 'EXPIRED') {
          <div class="banner banner-expired">
            <div class="banner-icon">🚫</div>
            <div class="banner-content">
              <h3>Obunangiz muddati tugagan!</h3>
              <p>
                Yangi buyurtmalar va asosiy POS operatsiyalari to'xtatildi. 
                Ma'lumotlaringiz xavfsiz saqlanmoqda. POS xizmatidan to'liq foydalanish uchun obunani uzaytiring.
              </p>
            </div>
            <button class="btn btn-danger-dark" (click)="openCheckoutModal()">
              Hoziroq uzaytirish
            </button>
          </div>
        }

        <!-- 1 Day Remaining Banner -->
        @if (sub()!.warningLevel === '1_DAY' && sub()!.status !== 'EXPIRED') {
          <div class="banner banner-urgent">
            <div class="banner-icon">⏰</div>
            <div class="banner-content">
              <h3>Obunangiz ertaga tugaydi!</h3>
              <p>Xizmatingiz to'xtab qolmasligi uchun bugun obunani uzaytirishni tavsiya qilamiz.</p>
            </div>
            <button class="btn btn-warning-dark" (click)="openCheckoutModal()">
              Uzaytirish
            </button>
          </div>
        }

        <!-- 3 Days Remaining Banner -->
        @if (sub()!.warningLevel === '3_DAYS') {
          <div class="banner banner-warning">
            <div class="banner-icon">⚠️</div>
            <div class="banner-content">
              <h3>Obunangiz 3 kundan keyin tugaydi!</h3>
              <p>Uzluksiz xizmat uchun to'lovni oldindan amalga oshirishingiz mumkin.</p>
            </div>
            <button class="btn btn-warning-dark" (click)="openCheckoutModal()">
              Tarifni uzaytirish
            </button>
          </div>
        }

        <!-- 7 Days Remaining Banner -->
        @if (sub()!.warningLevel === '7_DAYS') {
          <div class="banner banner-info">
            <div class="banner-icon">ℹ️</div>
            <div class="banner-content">
              <h3>Obunangiz 7 kundan keyin tugaydi.</h3>
              <p>Obuna muddatini uzaytirish yoki yuqori tarifga o'tishingiz mumkin.</p>
            </div>
            <button class="btn btn-outline" (click)="openCheckoutModal()">
              Batafsil
            </button>
          </div>
        }

        <!-- Trial Banner -->
        @if (sub()!.status === 'TRIAL') {
          <div class="banner banner-trial">
            <div class="banner-icon">✨</div>
            <div class="banner-content">
              <h3>Siz bepul sinov (Trial) davridasiz!</h3>
              <p>
                Sinov muddati tugashiga <strong>{{ sub()!.daysRemaining }} kun</strong> qoldi.
                Chegirmali obuna tariflaridan birini tanlang.
              </p>
            </div>
            <button class="btn btn-trial-action" (click)="openCheckoutModal()">
              Tarif tanlash
            </button>
          </div>
        }

        <!-- Scheduled Downgrade Notice -->
        @if (sub()!.hasScheduledDowngrade) {
          <div class="banner banner-info">
            <div class="banner-icon">🔄</div>
            <div class="banner-content">
              <h3>Rejalashtirilgan tarif o'zgarishi: {{ sub()!.nextPlanName }}</h3>
              <p>
                Joriy billing muddati ({{ formatDate(sub()!.endDate) }}) tugagach, 
                avtomatik ravishda yangi tarif kuchga kiradi.
              </p>
            </div>
          </div>
        }
      }

      @if (loading()) {
        <div class="loading-box">
          <div class="spinner"></div>
          <p>Obuna ma'lumotlari yuklanmoqda...</p>
        </div>
      } @else if (sub()) {
        <!-- Main Stats Grid -->
        <div class="billing-grid">
          <!-- Card 1: Current Plan Overview -->
          <div class="card plan-overview-card">
            <div class="card-header">
              <span class="card-title">Joriy Tarif</span>
              <span class="status-badge" [ngClass]="getStatusBadgeClass(sub()!.status)">
                {{ getStatusLabel(sub()!.status) }}
              </span>
            </div>

            <div class="plan-price-row">
              <div>
                <h2 class="plan-name">{{ sub()!.planName }}</h2>
                <span class="plan-code-badge">{{ sub()!.planCode }}</span>
              </div>
              <div class="price-wrap">
                <span class="price-val">{{ formatPrice(sub()!.price) }}</span>
                <span class="price-cur">so'm / oy</span>
              </div>
            </div>

            <div class="plan-details-list">
              <div class="detail-row">
                <span class="label">Boshlangan sana:</span>
                <span class="val">{{ formatDate(sub()!.startDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Tugash sanasi:</span>
                <span class="val">{{ formatDate(sub()!.endDate) }}</span>
              </div>
              <div class="detail-row highlight">
                <span class="label">Qolgan muddat:</span>
                <span class="val days-val">{{ sub()!.daysRemaining }} kun</span>
              </div>
              <div class="detail-row">
                <span class="label">Tizim holati:</span>
                <span class="val" [class.text-success]="sub()!.operating" [class.text-danger]="!sub()!.operating">
                  {{ sub()!.operating ? 'Faol (Operatsiyalar ruxsat etilgan)' : 'Bloklangan (Faqat ko‘rish rejimi)' }}
                </span>
              </div>
            </div>

            <div class="card-footer-actions">
              <button class="btn btn-outline-primary" (click)="openCheckoutModal()">
                ⚡ Tarifni Yangilash / Muddatni Uzaytirish
              </button>
            </div>
          </div>

          <!-- Card 2: Resource Limits & Usage -->
          <div class="card usage-card">
            <div class="card-header">
              <span class="card-title">Resurs Limitlari va Ishlatilishi</span>
              <span class="card-subtitle">Haqiqiy holat</span>
            </div>

            <div class="meters-container">
              <!-- Users (Employees) -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">👥 Xodimlar (Foydalanuvchilar)</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentUsers }}</strong> / {{ sub()!.maxUsers && sub()!.maxUsers > 0 ? sub()!.maxUsers : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentUsers, sub()!.maxUsers)" [class.danger]="isLimitReached(sub()!.currentUsers, sub()!.maxUsers)"></div>
                </div>
              </div>

              <!-- Tables -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">🪑 Stollar soni</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentTables }}</strong> / {{ sub()!.maxTables && sub()!.maxTables > 0 ? sub()!.maxTables : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentTables, sub()!.maxTables)" [class.danger]="isLimitReached(sub()!.currentTables, sub()!.maxTables)"></div>
                </div>
              </div>

              <!-- Products -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">🍔 Mahsulotlar katalogi</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentProducts }}</strong> / {{ sub()!.maxProducts && sub()!.maxProducts > 0 ? sub()!.maxProducts : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentProducts, sub()!.maxProducts)" [class.danger]="isLimitReached(sub()!.currentProducts, sub()!.maxProducts)"></div>
                </div>
              </div>

              <!-- Kitchens -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">👨‍🍳 Oshxonalar / Sexlar</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentKitchens }}</strong> / {{ sub()!.maxKitchens && sub()!.maxKitchens > 0 ? sub()!.maxKitchens : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentKitchens, sub()!.maxKitchens)" [class.danger]="isLimitReached(sub()!.currentKitchens, sub()!.maxKitchens)"></div>
                </div>
              </div>

              <!-- Devices -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">📱 Ulangan Qurilmalar</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentDevices }}</strong> / {{ sub()!.maxDevices && sub()!.maxDevices > 0 ? sub()!.maxDevices : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentDevices, sub()!.maxDevices)"></div>
                </div>
              </div>

              <!-- Monthly Orders -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">🧾 Oylik Buyurtmalar</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentMonthOrders }}</strong> / {{ sub()!.maxOrdersPerMonth && sub()!.maxOrdersPerMonth > 0 ? sub()!.maxOrdersPerMonth : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentMonthOrders, sub()!.maxOrdersPerMonth)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs for Invoices & History -->
        <div class="tabs-nav">
          <button class="tab-btn" [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'">
            🧾 Hisob-fakturalar ({{ invoices().length }})
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'periods'" (click)="activeTab = 'periods'">
            📅 Obunalar Tarixi ({{ periods().length }})
          </button>
        </div>

        <!-- Tab 1: Invoices -->
        @if (activeTab === 'invoices') {
          <div class="card table-card">
            <div class="card-header">
              <span class="card-title">Hisob-fakturalar ro'yxati</span>
              <button class="btn btn-sm btn-outline" (click)="loadInvoices()">Yangilash</button>
            </div>

            @if (invoices().length === 0) {
              <div class="empty-state">
                <p>Hozircha hisob-fakturalar mavjud emas.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Hisob-faktura #</th>
                      <th>Tarif</th>
                      <th>Muddat</th>
                      <th>Asosiy Summa</th>
                      <th>Chegirma</th>
                      <th>Yakuniy Summa</th>
                      <th>Holat</th>
                      <th>Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inv of invoices(); track inv.id) {
                      <tr>
                        <td class="code-cell"><strong>{{ inv.invoiceNumber }}</strong></td>
                        <td>{{ inv.planName }}</td>
                        <td>{{ inv.durationMonths }} oy</td>
                        <td>{{ formatPrice(inv.baseAmount) }} {{ inv.currency }}</td>
                        <td class="text-success">
                          {{ inv.discountPercent > 0 ? '-' + inv.discountPercent + '% (-' + formatPrice(inv.discountAmount) + ')' : '-' }}
                        </td>
                        <td class="amount-cell">{{ formatPrice(inv.finalAmount) }} {{ inv.currency }}</td>
                        <td>
                          <span class="status-badge" [ngClass]="getInvoiceBadgeClass(inv.status)">
                            {{ inv.status }}
                          </span>
                        </td>
                        <td>{{ formatDate(inv.createdAt) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Tab 2: Subscription Periods History -->
        @if (activeTab === 'periods') {
          <div class="card table-card">
            <div class="card-header">
              <span class="card-title">Obunalar Davrlari Tarixi</span>
              <button class="btn btn-sm btn-outline" (click)="loadPeriods()">Yangilash</button>
            </div>

            @if (periods().length === 0) {
              <div class="empty-state">
                <p>Hozircha davrlar tarixi mavjud emas.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Tarif</th>
                      <th>Tur (Turi)</th>
                      <th>Boshlanish</th>
                      <th>Tugash</th>
                      <th>Hisob-faktura</th>
                      <th>Yaratilgan vaqt</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (per of periods(); track per.id) {
                      <tr>
                        <td><strong>{{ per.planName }}</strong> ({{ per.planCode }})</td>
                        <td>
                          <span class="provider-badge">{{ per.periodType }}</span>
                        </td>
                        <td>{{ formatDate(per.startDate) }}</td>
                        <td>{{ formatDate(per.endDate) }}</td>
                        <td class="code-cell">{{ per.invoiceNumber || '-' }}</td>
                        <td>{{ formatDate(per.createdAt) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }

      <!-- Checkout / Upgrade Modal with Real-time Calculation -->
      @if (showCheckoutModal()) {
        <div class="modal-overlay" (click)="closeCheckoutModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Tarif Tanlash va Hisob-faktura Yaratish</h2>
              <button class="btn-close" (click)="closeCheckoutModal()">✕</button>
            </div>

            <div class="modal-body">
              @if (!checkoutCreatedInvoice()) {
                <!-- Step 1: Select Plan -->
                <div class="step-section">
                  <label class="section-label">1. Tarif rejasini tanlang:</label>
                  <div class="plans-selection">
                    @for (plan of availablePlans(); track plan.code) {
                      <div class="modal-plan-card" 
                           [class.active]="selectedPlanCode() === plan.code"
                           (click)="selectPlan(plan.code)">
                        <div class="p-name">{{ plan.name }}</div>
                        <div class="p-price">{{ formatPrice(plan.price) }} so'm</div>
                        <div class="p-limit">
                          {{ plan.maxTables && plan.maxTables > 0 ? plan.maxTables + ' stol' : 'Cheksiz stol' }} • 
                          {{ plan.maxUsers && plan.maxUsers > 0 ? plan.maxUsers + ' xodim' : 'Cheksiz xodim' }}
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Step 2: Select Duration -->
                <div class="step-section">
                  <label class="section-label">2. Obuna muddatini tanlang:</label>
                  <div class="months-selection">
                    @for (opt of monthOptions; track opt.value) {
                      <div class="month-card" 
                           [class.active]="selectedMonths() === opt.value"
                           (click)="selectMonths(opt.value)">
                        @if (opt.badge) {
                          <span class="month-badge">{{ opt.badge }}</span>
                        }
                        <div class="month-label">{{ opt.label }}</div>
                        <div class="month-price-hint">{{ opt.hint }}</div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Calculation Summary Box -->
                @if (calculating()) {
                  <div class="calc-loading">Narx hisoblanmoqda...</div>
                } @else if (calcResult()) {
                  <div class="price-summary-box">
                    <div class="price-summary-row">
                      <span>Tarif:</span>
                      <strong>{{ calcResult()!.planName }}</strong>
                    </div>
                    <div class="price-summary-row">
                      <span>Tanlangan davr:</span>
                      <span>{{ calcResult()!.months }} oy ({{ formatPrice(calcResult()!.monthlyPrice) }} so'm / oy)</span>
                    </div>
                    <div class="price-summary-row">
                      <span>Asosiy summa:</span>
                      <span>{{ formatPrice(calcResult()!.baseAmount) }} so'm</span>
                    </div>

                    @if (calcResult()!.discountAmount > 0) {
                      <div class="price-summary-row discount-row">
                        <span>Chegirma ({{ calcResult()!.discountPercent }}%):</span>
                        <span class="text-success">-{{ formatPrice(calcResult()!.discountAmount) }} so'm</span>
                      </div>
                    }

                    @if (calcResult()!.adjustmentAmount !== 0) {
                      <div class="price-summary-row">
                        <span>Qayta hisob-kitob (Adjustment):</span>
                        <span>{{ formatPrice(calcResult()!.adjustmentAmount) }} so'm</span>
                      </div>
                    }

                    <div class="price-summary-total">
                      <span>To'lanadigan yakuniy summa:</span>
                      <strong>{{ formatPrice(calcResult()!.finalAmount) }} so'm</strong>
                    </div>

                    @if (calcResult()!.isDowngrade) {
                      <div class="notice-box notice-warning">
                        ℹ️ <strong>Tarif pasaytirilishi (Downgrade):</strong> Yangi tarif joriy billing davri tugagandan keyin kuchga kiradi.
                      </div>
                    }

                    @if (calcResult()!.isUpgrade) {
                      <div class="notice-box notice-info">
                        ⚡ <strong>Upgrade:</strong> Yangi tarif to'lov tasdiqlanishi bilan darhol faollashadi.
                      </div>
                    }
                  </div>
                }

                @if (checkoutError()) {
                  <div class="alert alert-error">{{ checkoutError() }}</div>
                }

                <div class="modal-actions">
                  <button class="btn btn-outline" (click)="closeCheckoutModal()">Bekor qilish</button>
                  <button class="btn btn-primary" [disabled]="initiatingCheckout() || calculating()" (click)="confirmCheckout()">
                    @if (initiatingCheckout()) {
                      <span>Yaratilmoqda...</span>
                    } @else {
                      <span>Hisob-faktura Yaratish →</span>
                    }
                  </button>
                </div>
              } @else {
                <!-- Invoice Confirmation Screen (No Fake Billing) -->
                <div class="invoice-created-box">
                  <div class="invoice-icon">🧾</div>
                  <h3>Hisob-faktura Muvaffaqiyatli Yaratildi!</h3>
                  <div class="invoice-number-pill">{{ checkoutCreatedInvoice()!.invoiceNumber }}</div>

                  <p class="invoice-amount-desc">
                    To'lanadigan summa: <strong>{{ formatPrice(checkoutCreatedInvoice()!.finalAmount) }} {{ checkoutCreatedInvoice()!.currency }}</strong>
                  </p>

                  <div class="manual-instruction-alert">
                    <p><strong>To'lov bo'yicha ko'rsatma:</strong></p>
                    <p>
                      Hozirgi vaqtda to'lovlar qo'lda (Manual) qabul qilinadi.
                      Hisob-faktura raqami asosida administratorga to'lov amalga oshirilgach, 
                      Super Admin hisobingizni tasdiqlaydi va tarif avtomatik faollashadi.
                    </p>
                  </div>

                  <div class="modal-actions">
                    <button class="btn btn-primary" (click)="closeCheckoutModal()">
                      Tushunarli, Yopish
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      color: var(--text-primary, #f8fafc);
    }

    .billing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .page-title {
        font-size: 26px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--text-secondary, #94a3b8);
      }
    }

    .banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 20px;

      .banner-icon { font-size: 26px; }
      .banner-content {
        flex: 1;
        h3 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        p { font-size: 13px; margin: 0; line-height: 1.4; }
      }

      &-expired {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        h3 { color: #ef4444; }
      }

      &-urgent {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
        h3 { color: #f87171; }
      }

      &-warning {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #fcd34d;
        h3 { color: #f59e0b; }
      }

      &-info {
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: #c7d2fe;
        h3 { color: #818cf8; }
      }

      &-trial {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.35);
        color: #fcd34d;
        h3 { color: #f59e0b; }
      }
    }

    .billing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;

      @media (max-width: 850px) {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 14px;
      padding: 24px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border, #334155);

        .card-title {
          font-size: 16px;
          font-weight: 700;
        }
        .card-subtitle {
          font-size: 12px;
          color: var(--text-muted, #64748b);
        }
      }
    }

    .plan-price-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 20px;

      .plan-name {
        font-size: 24px;
        font-weight: 800;
        color: #6366f1;
        margin-bottom: 4px;
      }

      .plan-code-badge {
        font-size: 11px;
        font-weight: 700;
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .price-wrap {
        .price-val { font-size: 24px; font-weight: 800; }
        .price-cur { font-size: 12px; color: var(--text-secondary, #94a3b8); margin-left: 4px; }
      }
    }

    .plan-details-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;

        .label { color: var(--text-secondary, #94a3b8); }
        .val { font-weight: 600; color: var(--text-primary, #f8fafc); }

        &.highlight {
          background: rgba(99, 102, 241, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          .days-val { color: #818cf8; font-weight: 700; }
        }
      }
    }

    .meters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .meter-item {
        .meter-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;

          .meter-label { color: var(--text-secondary, #cbd5e1); font-weight: 500; }
          .meter-counts { color: var(--text-primary, #f8fafc); }
        }

        .progress-bar {
          height: 8px;
          background: var(--bg-primary, #0f172a);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border, #334155);

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #10b981);
            border-radius: 4px;
            transition: width 0.3s ease;

            &.danger {
              background: #ef4444;
            }
          }
        }
      }
    }

    .tabs-nav {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .tab-btn {
        padding: 10px 18px;
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border, #334155);
        color: var(--text-secondary, #94a3b8);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: white;
          border-color: #6366f1;
        }

        &.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid var(--border, #334155);
      }

      th {
        color: var(--text-muted, #64748b);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
      }

      .amount-cell {
        font-weight: 700;
        color: var(--text-primary, #f8fafc);
      }

      .provider-badge {
        background: rgba(255,255,255,0.06);
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }

      .code-cell {
        font-family: monospace;
        color: var(--text-muted, #94a3b8);
        font-size: 12px;
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;

      &.status-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &.status-trial { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &.status-expiring { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &.status-expired { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.status-paid { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &.status-pending { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
      &.status-cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 16px;
      width: 100%;
      max-width: 620px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
      margin: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 { font-size: 18px; font-weight: 700; margin: 0; }
      .btn-close {
        background: transparent;
        border: none;
        color: var(--text-secondary, #94a3b8);
        font-size: 18px;
        cursor: pointer;
        &:hover { color: white; }
      }
    }

    .modal-body {
      overflow-y: auto;
      max-height: calc(85vh - 80px);
    }

    .step-section {
      margin-bottom: 20px;

      .section-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary, #cbd5e1);
        display: block;
        margin-bottom: 10px;
      }
    }

    .plans-selection {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }

    .modal-plan-card {
      background: var(--bg-primary, #0f172a);
      border: 2px solid var(--border, #334155);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;

      &:hover { border-color: #6366f1; }
      &.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
      }

      .p-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
      .p-price { font-size: 14px; font-weight: 800; color: #10b981; margin-bottom: 4px; }
      .p-limit { font-size: 10px; color: var(--text-muted, #64748b); }
    }

    .months-selection {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      @media (max-width: 500px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .month-card {
      background: var(--bg-primary, #0f172a);
      border: 2px solid var(--border, #334155);
      border-radius: 10px;
      padding: 12px 8px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      position: relative;

      &:hover { border-color: #6366f1; }
      &.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.12);
      }

      .month-badge {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
        white-space: nowrap;
      }

      .month-label { font-size: 14px; font-weight: 700; margin-bottom: 4px; padding-top: 4px; }
      .month-price-hint { font-size: 10px; color: var(--text-muted, #64748b); }
    }

    .price-summary-box {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .price-summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--text-secondary, #cbd5e1);
      }

      .price-summary-total {
        display: flex;
        justify-content: space-between;
        font-size: 15px;
        padding-top: 8px;
        border-top: 1px solid rgba(16, 185, 129, 0.2);
        color: var(--text-primary, #f8fafc);

        strong { color: #10b981; font-size: 18px; font-weight: 800; }
      }
    }

    .notice-box {
      margin-top: 10px;
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;

      &.notice-warning {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #fcd34d;
      }

      &.notice-info {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: #c7d2fe;
      }
    }

    .invoice-created-box {
      text-align: center;
      padding: 20px;

      .invoice-icon { font-size: 40px; margin-bottom: 12px; }
      h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
      .invoice-number-pill {
        display: inline-block;
        padding: 6px 14px;
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        font-family: monospace;
        font-size: 14px;
        font-weight: 700;
        border-radius: 6px;
        margin-bottom: 14px;
      }
      .invoice-amount-desc {
        font-size: 16px;
        margin-bottom: 16px;
        strong { color: #10b981; }
      }
      .manual-instruction-alert {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border, #334155);
        border-radius: 8px;
        padding: 14px;
        text-align: left;
        font-size: 13px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
        margin-bottom: 20px;
        p { margin: 0 0 6px 0; &:last-child { margin: 0; } }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid transparent;

      &-primary { background: #6366f1; color: white; &:hover { background: #4f46e5; } }
      &-outline { background: transparent; border-color: var(--border, #334155); color: var(--text-primary, #f8fafc); }
      &-outline-primary { background: transparent; border-color: #6366f1; color: #818cf8; width: 100%; &:hover { background: rgba(99, 102, 241, 0.1); } }
      &-danger-dark { background: #ef4444; color: white; padding: 8px 16px; border-radius: 6px; font-size: 13px; }
      &-warning-dark { background: #f59e0b; color: #1e1b4b; font-weight: 700; padding: 8px 16px; border-radius: 6px; font-size: 13px; }
      &-trial-action { background: #f59e0b; color: #1e1b4b; font-weight: 700; padding: 8px 16px; border-radius: 6px; font-size: 13px; }
      &-sm { padding: 6px 12px; font-size: 12px; }
    }

    .text-success { color: #10b981; }
    .text-danger { color: #ef4444; }

    .loading-box { text-align: center; padding: 40px; color: var(--text-secondary, #94a3b8); }
    .spinner {
      width: 36px; height: 36px; border: 3px solid var(--border, #334155);
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RestaurantBillingComponent implements OnInit {
  private billingService = inject(BillingService);

  sub = signal<CurrentSubscriptionResponse | null>(null);
  invoices = signal<InvoiceResponse[]>([]);
  periods = signal<SubscriptionPeriodResponse[]>([]);
  availablePlans = signal<PlanResponse[]>([]);
  loading = signal(true);
  activeTab: 'invoices' | 'periods' = 'invoices';

  // Checkout modal
  showCheckoutModal = signal(false);
  selectedPlanCode = signal<string>('BUSINESS');
  selectedMonths = signal<number>(1);
  calculating = signal(false);
  calcResult = signal<CalculatePriceResponse | null>(null);
  initiatingCheckout = signal(false);
  checkoutCreatedInvoice = signal<any | null>(null);
  checkoutError = signal<string | null>(null);

  readonly monthOptions = [
    { value: 1,  label: '1 oy',   hint: 'Standart narx', badge: '' },
    { value: 3,  label: '3 oy',   hint: '5% chegirma',   badge: '-5%' },
    { value: 6,  label: '6 oy',   hint: '10% chegirma',  badge: '-10%' },
    { value: 12, label: '12 oy',  hint: '20% chegirma',  badge: '-20%' },
  ];

  ngOnInit(): void {
    this.loadCurrentSubscription();
    this.loadInvoices();
    this.loadPeriods();
    this.loadPlans();
  }

  loadCurrentSubscription(): void {
    this.loading.set(true);
    this.billingService.getCurrentSubscription().subscribe({
      next: (data) => {
        this.sub.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadInvoices(): void {
    this.billingService.getInvoices().subscribe({
      next: (items) => this.invoices.set(items)
    });
  }

  loadPeriods(): void {
    this.billingService.getPeriods().subscribe({
      next: (items) => this.periods.set(items)
    });
  }

  loadPlans(): void {
    this.billingService.getPublicPlans().subscribe({
      next: (plans) => {
        this.availablePlans.set(plans.filter(p => p.code !== 'TRIAL'));
      }
    });
  }

  calcPercentage(current: number, max: number): number {
    if (!max || max <= 0) return 20;
    return Math.min(Math.round((current / max) * 100), 100);
  }

  isLimitReached(current: number, max: number): boolean {
    if (!max || max <= 0) return false;
    return current >= max;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'TRIAL': return 'Sinov davri (Trial)';
      case 'ACTIVE': return 'Faol (Active)';
      case 'EXPIRING_SOON': return 'Yaqinda tugaydi (Expiring Soon)';
      case 'EXPIRED': return 'Muddati tugagan (Expired)';
      case 'SUSPENDED': return 'To‘xtatilgan (Suspended)';
      case 'PENDING_PAYMENT': return 'To‘lov kutilmoqda (Pending)';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'TRIAL': return 'status-trial';
      case 'EXPIRING_SOON': return 'status-expiring';
      case 'EXPIRED': return 'status-expired';
      case 'SUSPENDED': return 'status-cancelled';
      case 'PENDING_PAYMENT': return 'status-pending';
      default: return 'status-pending';
    }
  }

  getInvoiceBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-pending';
    }
  }

  openCheckoutModal(): void {
    this.checkoutCreatedInvoice.set(null);
    this.checkoutError.set(null);
    this.selectedMonths.set(1);
    if (this.sub()) {
      const initialCode = (this.sub()!.planCode === 'TRIAL' || !this.sub()!.planCode) ? 'BUSINESS' : this.sub()!.planCode;
      this.selectedPlanCode.set(initialCode);
    }
    this.showCheckoutModal.set(true);
    this.triggerCalculate();
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal.set(false);
    this.checkoutCreatedInvoice.set(null);
    this.checkoutError.set(null);
  }

  selectPlan(planCode: string): void {
    this.selectedPlanCode.set(planCode);
    this.triggerCalculate();
  }

  selectMonths(months: number): void {
    this.selectedMonths.set(months);
    this.triggerCalculate();
  }

  triggerCalculate(): void {
    this.calculating.set(true);
    this.calcResult.set(null);
    this.checkoutError.set(null);

    this.billingService.calculatePrice({
      planCode: this.selectedPlanCode(),
      months: this.selectedMonths()
    }).subscribe({
      next: (res) => {
        this.calcResult.set(res);
        this.calculating.set(false);
      },
      error: (err) => {
        this.calculating.set(false);
        this.checkoutError.set(err?.error?.message || 'Narxni hisoblashda xatolik yuz berdi');
      }
    });
  }

  confirmCheckout(): void {
    this.initiatingCheckout.set(true);
    this.checkoutError.set(null);

    this.billingService.initiateCheckout({
      planCode: this.selectedPlanCode(),
      months: this.selectedMonths(),
      provider: 'MANUAL'
    }).subscribe({
      next: (res) => {
        this.initiatingCheckout.set(false);
        this.checkoutCreatedInvoice.set(res);
        this.loadInvoices();
        this.loadCurrentSubscription();
      },
      error: (err) => {
        this.initiatingCheckout.set(false);
        this.checkoutError.set(err?.error?.message || 'Hisob-faktura yaratishda xatolik yuz berdi');
      }
    });
  }
}
