import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService, CurrentSubscriptionResponse, PaymentHistoryItem, PlanResponse, CheckoutResponse } from '../../core/services/billing.service';

@Component({
  selector: 'app-restaurant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billing-page">
      <!-- Page Header -->
      <div class="billing-header">
        <div>
          <h1 class="page-title">Tarif va Obuna Boshqaruvi</h1>
          <p class="page-subtitle">Restoraningiz obuna holati, limitlar va to'lovlar tarixi</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCheckoutModal()">
            ⚡ Tarifni yangilash / Uzaytirish
          </button>
        </div>
      </div>

      <!-- Expired Warning Banner -->
      @if (sub() && sub()!.status === 'EXPIRED') {
        <div class="banner banner-expired">
          <div class="banner-icon">⚠️</div>
          <div class="banner-content">
            <h3>Obunangiz muddati tugagan!</h3>
            <p>
              Yangi buyurtma va to'lovlarni qabul qilish vaqtincha cheklandi. 
              Barcha ma'lumotlaringiz xavfsiz saqlanmoqda. POS'dan to'liq foydalanish uchun obunani yangilang.
            </p>
          </div>
          <button class="btn btn-danger-dark" (click)="openCheckoutModal()">
            Hoziroq yangilash
          </button>
        </div>
      }

      <!-- Trial Warning Banner -->
      @if (sub() && sub()!.status === 'TRIAL') {
        <div class="banner banner-trial">
          <div class="banner-icon">✨</div>
          <div class="banner-content">
            <h3>Siz 14 kunlik bepul sinov davridasiz!</h3>
            <p>
              Sinov muddati tugashiga <strong>{{ sub()!.daysRemaining }} kun</strong> qoldi.
              Muddatingiz tugashidan oldin tarifni tanlab, uzluksiz xizmatdan bahramand bo'ling.
            </p>
          </div>
          <button class="btn btn-trial-action" (click)="openCheckoutModal()">
            Tarif tanlash
          </button>
        </div>
      }

      @if (loading()) {
        <div class="loading-box">
          <div class="spinner"></div>
          <p>Obuna ma'lumotlari yuklanmoqda...</p>
        </div>
      } @else if (sub()) {
        <!-- Main Stats & Cards -->
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
              <h2 class="plan-name">{{ sub()!.planName }}</h2>
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
                <span class="label">Qolgan kunlar:</span>
                <span class="val days-val">{{ sub()!.daysRemaining }} kun</span>
              </div>
              <div class="detail-row">
                <span class="label">POS Holati:</span>
                <span class="val" [class.text-success]="sub()!.operating" [class.text-danger]="!sub()!.operating">
                  {{ sub()!.operating ? 'Faol (Ruxsat berilgan)' : 'To‘xtatilgan (Cheklangan)' }}
                </span>
              </div>
            </div>

            <div class="card-footer-actions">
              <button class="btn btn-outline-primary" (click)="openCheckoutModal()">
                Tarifni o'zgartirish (Upgrade)
              </button>
            </div>
          </div>

          <!-- Card 2: Resource Limits & Usage -->
          <div class="card usage-card">
            <div class="card-header">
              <span class="card-title">Tarif Bo'yicha Resurs Limitlari</span>
              <span class="card-subtitle">Hozirgi foydalanish ko'rsatkichi</span>
            </div>

            <div class="meters-container">
              <!-- Tables Meter -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">🪑 Stollar soni</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentTables }}</strong> / {{ sub()!.maxTables ? sub()!.maxTables : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentTables, sub()!.maxTables)"></div>
                </div>
              </div>

              <!-- Users Meter -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">👥 Xodimlar / Foydalanuvchilar</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentUsers }}</strong> / {{ sub()!.maxUsers ? sub()!.maxUsers : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentUsers, sub()!.maxUsers)"></div>
                </div>
              </div>

              <!-- Products Meter -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">🍔 Mahsulotlar katalogi</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentProducts }}</strong> / {{ sub()!.maxProducts ? sub()!.maxProducts : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentProducts, sub()!.maxProducts)"></div>
                </div>
              </div>

              <!-- Kitchens Meter -->
              <div class="meter-item">
                <div class="meter-info">
                  <span class="meter-label">👨‍🍳 Oshxonalar / Sexlar</span>
                  <span class="meter-counts">
                    <strong>{{ sub()!.currentKitchens }}</strong> / {{ sub()!.maxKitchens ? sub()!.maxKitchens : 'Cheksiz' }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="calcPercentage(sub()!.currentKitchens, sub()!.maxKitchens)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment History Table -->
        <div class="card history-card">
          <div class="card-header">
            <span class="card-title">To'lovlar Tarixi</span>
            <button class="btn btn-sm btn-outline" (click)="loadPaymentHistory()">Yangilash</button>
          </div>

          @if (paymentHistory().length === 0) {
            <div class="empty-state">
              <p>Hozircha hech qanday to'lovlar amalga oshirilmagan.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Tarif</th>
                    <th>Summa</th>
                    <th>To'lov Tizimi</th>
                    <th>Tranzaksiya ID</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of paymentHistory(); track p.id) {
                    <tr>
                      <td>{{ formatDate(p.createdAt) }}</td>
                      <td><strong>{{ p.planName || p.planCode }}</strong></td>
                      <td class="amount-cell">{{ formatPrice(p.amount) }} {{ p.currency }}</td>
                      <td>
                        <span class="provider-badge">{{ p.provider }}</span>
                      </td>
                      <td class="code-cell">{{ p.providerTransactionId || p.id.substring(0, 8) }}</td>
                      <td>
                        <span class="status-badge" [ngClass]="getPaymentStatusBadgeClass(p.status)">
                          {{ p.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Checkout / Upgrade Modal -->
      @if (showCheckoutModal()) {
        <div class="modal-overlay" (click)="closeCheckoutModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Tarifni Tanlash va To'lash</h2>
              <button class="btn-close" (click)="closeCheckoutModal()">✕</button>
            </div>

            <div class="modal-body">
              @if (!checkoutResponse()) {
                <!-- Step 1: Select Plan -->
                <div class="step-section">
                  <label class="section-label">1. Tarif rejasini tanlang:</label>
                  <div class="plans-selection">
                    @for (plan of availablePlans(); track plan.code) {
                      <div class="modal-plan-card" 
                           [class.active]="selectedPlanCode() === plan.code"
                           (click)="selectedPlanCode.set(plan.code)">
                        <div class="p-name">{{ plan.name }}</div>
                        <div class="p-price">{{ formatPrice(plan.price) }} so'm</div>
                        <div class="p-limit">{{ plan.maxTables ? plan.maxTables + ' stol' : 'Cheksiz' }} • {{ plan.maxUsers ? plan.maxUsers + ' xodim' : 'Cheksiz' }}</div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Step 2: Select Duration (Months) -->
                <div class="step-section">
                  <label class="section-label">2. Obuna muddatini tanlang:</label>
                  <div class="months-selection">
                    @for (opt of monthOptions; track opt.value) {
                      <div class="month-card" 
                           [class.active]="selectedMonths() === opt.value"
                           (click)="selectedMonths.set(opt.value)">
                        @if (opt.badge) {
                          <span class="month-badge">{{ opt.badge }}</span>
                        }
                        <div class="month-label">{{ opt.label }}</div>
                        <div class="month-price-hint">{{ opt.hint }}</div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Step 3: Waiter Mobile App -->
                <div class="step-section">
                  <label class="section-label">3. Ofitsiant Mobile App (ixtiyoriy):</label>
                  <div class="waiter-section">
                    <div class="waiter-info-box">
                      <span class="waiter-icon">📱</span>
                      <div class="waiter-info-text">
                        <strong>Ofitsiant mobil ilovasi</strong>
                        <p>Dastlabki <strong>2 ta ofitsiant bepul</strong>. Qo'shimcha har bir ofitsiant uchun oyiga <strong>35,000 so'm</strong>.</p>
                      </div>
                    </div>
                    <div class="waiter-counter">
                      <label>Jami ofitsiantlar soni:</label>
                      <div class="counter-row">
                        <button class="counter-btn" (click)="decrementWaiters()" [disabled]="totalWaiters() <= 0">−</button>
                        <span class="counter-val">{{ totalWaiters() }}</span>
                        <button class="counter-btn" (click)="incrementWaiters()">+</button>
                      </div>
                      @if (totalWaiters() > 0) {
                        <small class="waiter-cost-hint">
                          @if (totalWaiters() <= 2) {
                            ✅ {{ totalWaiters() }} ofitsiant — bepul
                          } @else {
                            📱 2 ta bepul + {{ totalWaiters() - 2 }} ta × 35,000 = <strong>{{ formatPrice((totalWaiters() - 2) * 35000) }} so'm/oy</strong>
                          }
                        </small>
                      }
                    </div>
                  </div>
                </div>

                <!-- Step 4: Select Provider -->
                <div class="step-section">
                  <label class="section-label">4. To'lov tizimini tanlang:</label>
                  <div class="providers-selection">
                    <div class="provider-pill" [class.active]="selectedProvider() === 'MOCK'" (click)="selectedProvider.set('MOCK')">
                      🧪 Test To'lov (Mock)
                    </div>
                    <div class="provider-pill" [class.active]="selectedProvider() === 'CLICK'" (click)="selectedProvider.set('CLICK')">
                      🔹 Click Up
                    </div>
                    <div class="provider-pill" [class.active]="selectedProvider() === 'PAYME'" (click)="selectedProvider.set('PAYME')">
                      🟢 Payme
                    </div>
                    <div class="provider-pill" [class.active]="selectedProvider() === 'UZUM'" (click)="selectedProvider.set('UZUM')">
                      🍇 Uzum Bank
                    </div>
                  </div>
                </div>

                <!-- Total Price Summary -->
                <div class="price-summary-box">
                  <div class="price-summary-row">
                    <span>Tarif narxi:</span>
                    <span>{{ formatPrice(getSelectedPlanPrice()) }} so'm × {{ selectedMonths() }} oy</span>
                  </div>
                  @if (getExtraWaiters() > 0) {
                    <div class="price-summary-row">
                      <span>Qo'shimcha {{ getExtraWaiters() }} ofitsiant:</span>
                      <span>{{ formatPrice(getExtraWaiters() * 35000) }} so'm × {{ selectedMonths() }} oy</span>
                    </div>
                  }
                  <div class="price-summary-total">
                    <span>Jami to'lov:</span>
                    <strong>{{ formatPrice(calcTotalAmount()) }} so'm</strong>
                  </div>
                </div>

                @if (checkoutError()) {
                  <div class="alert alert-error">{{ checkoutError() }}</div>
                }

                <div class="modal-actions">
                  <button class="btn btn-outline" (click)="closeCheckoutModal()">Bekor qilish</button>
                  <button class="btn btn-primary" [disabled]="initiatingCheckout()" (click)="confirmCheckout()">
                    @if (initiatingCheckout()) {
                      <span>Yaratilmoqda...</span>
                    } @else {
                      <span>To'lovga o'tish →</span>
                    }
                  </button>
                </div>
              } @else {
                <!-- Step 5: Mock Payment Simulation -->
                <div class="mock-payment-box">
                  <div class="mock-header">
                    <span class="mock-icon">💳</span>
                    <h3>To'lov Yaratildi</h3>
                    <p class="mock-amount">{{ formatPrice(checkoutResponse()!.amount) }} {{ checkoutResponse()!.currency }}</p>
                    <small>Tranzaksiya ID: {{ checkoutResponse()!.paymentId }}</small>
                  </div>

                  <div class="mock-simulation-alert">
                    ⚡ <strong>Development Rejimi:</strong> Test to'lovini simulyatsiya qiling.
                  </div>

                  <div class="mock-actions">
                    <button class="btn btn-success" [disabled]="simulatingPay()" (click)="executeMockPay(true)">
                      ✅ Test To'lov: Muvaffaqiyatli (PAID)
                    </button>
                    <button class="btn btn-danger" [disabled]="simulatingPay()" (click)="executeMockPay(false)">
                      ❌ Test To'lov: Xatolik (FAILED)
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
      margin-bottom: 24px;

      .banner-icon { font-size: 24px; }
      .banner-content {
        flex: 1;
        h3 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        p { font-size: 13px; margin: 0; line-height: 1.4; }
      }

      &-expired {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
        h3 { color: #ef4444; }
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

      @media (max-width: 800px) {
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
      gap: 18px;

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
          }
        }
      }
    }

    .history-card {
      margin-top: 10px;
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
      &.status-expired { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.status-paid { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &.status-failed { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.status-pending { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
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
      max-height: calc(80vh - 80px);
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

    .waiter-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .waiter-info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 10px;
      padding: 12px 14px;

      .waiter-icon { font-size: 24px; }
      .waiter-info-text {
        strong { font-size: 13px; font-weight: 700; display: block; margin-bottom: 4px; }
        p { font-size: 12px; color: var(--text-secondary, #94a3b8); margin: 0; line-height: 1.4; }
      }
    }

    .waiter-counter {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      label { font-size: 13px; color: var(--text-secondary, #94a3b8); }

      .counter-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 8px;
        padding: 6px 12px;

        .counter-btn {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #818cf8;
          font-size: 18px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          &:hover:not(:disabled) { background: #6366f1; color: white; }
          &:disabled { opacity: 0.3; cursor: not-allowed; }
        }

        .counter-val {
          font-size: 20px;
          font-weight: 800;
          min-width: 28px;
          text-align: center;
          color: #f8fafc;
        }
      }

      .waiter-cost-hint {
        font-size: 12px;
        color: var(--text-secondary, #94a3b8);
        strong { color: #10b981; }
      }
    }

    .price-summary-box {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .price-summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--text-secondary, #94a3b8);
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

    .providers-selection {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .provider-pill {
        padding: 8px 14px;
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { border-color: #6366f1; }
        &.active {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
      }
    }

    .mock-payment-box {
      text-align: center;
      padding: 20px;

      .mock-header {
        margin-bottom: 20px;
        .mock-icon { font-size: 36px; margin-bottom: 8px; }
        h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
        .mock-amount { font-size: 28px; font-weight: 800; color: #10b981; margin: 4px 0; }
        small { color: var(--text-muted, #64748b); font-family: monospace; }
      }

      .mock-simulation-alert {
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.3);
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        color: #c7d2fe;
        margin-bottom: 24px;
      }

      .mock-actions {
        display: flex;
        gap: 12px;
        justify-content: center;

        button {
          flex: 1;
          padding: 12px;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
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
      &-success { background: #10b981; color: white; &:hover { background: #059669; } }
      &-danger { background: #ef4444; color: white; &:hover { background: #dc2626; } }
      &-danger-dark { background: #ef4444; color: white; padding: 8px 16px; border-radius: 6px; font-size: 13px; }
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
  paymentHistory = signal<PaymentHistoryItem[]>([]);
  availablePlans = signal<PlanResponse[]>([]);
  loading = signal(true);

  // Modal state
  showCheckoutModal = signal(false);
  selectedPlanCode = signal<string>('BUSINESS');
  selectedProvider = signal<string>('MOCK');
  selectedMonths = signal<number>(1);
  totalWaiters = signal<number>(0);
  initiatingCheckout = signal(false);
  simulatingPay = signal(false);
  checkoutResponse = signal<CheckoutResponse | null>(null);
  checkoutError = signal<string | null>(null);

  readonly monthOptions = [
    { value: 1,  label: '1 oy',   hint: 'Standart', badge: '' },
    { value: 3,  label: '3 oy',   hint: "10% chegirma", badge: '-10%' },
    { value: 6,  label: '6 oy',   hint: "15% chegirma", badge: '-15%' },
    { value: 12, label: '12 oy',  hint: "20% chegirma", badge: '-20%' },
  ];

  ngOnInit(): void {
    this.loadCurrentSubscription();
    this.loadPaymentHistory();
    this.loadPlans();
  }

  loadCurrentSubscription(): void {
    this.loading.set(true);
    this.billingService.getCurrentSubscription().subscribe({
      next: (data) => {
        this.sub.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadPaymentHistory(): void {
    this.billingService.getPaymentHistory().subscribe({
      next: (items) => this.paymentHistory.set(items)
    });
  }

  loadPlans(): void {
    this.billingService.getPublicPlans().subscribe({
      next: (plans) => {
        // Exclude trial from upgrade modal
        this.availablePlans.set(plans.filter(p => p.code !== 'TRIAL'));
      }
    });
  }

  calcPercentage(current: number, max: number): number {
    if (!max || max <= 0) return 20; // Default visualization for unlimited
    return Math.min(Math.round((current / max) * 100), 100);
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
      case 'EXPIRED': return 'Muddati tugagan (Expired)';
      case 'SUSPENDED': return 'To‘xtatilgan (Suspended)';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'TRIAL': return 'status-trial';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-pending';
    }
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'FAILED': return 'status-failed';
      default: return 'status-pending';
    }
  }

  openCheckoutModal(): void {
    this.checkoutResponse.set(null);
    this.checkoutError.set(null);
    this.selectedMonths.set(1);
    this.totalWaiters.set(0);
    if (this.sub()) {
      this.selectedPlanCode.set(this.sub()!.planCode === 'TRIAL' ? 'BUSINESS' : this.sub()!.planCode);
    }
    this.showCheckoutModal.set(true);
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal.set(false);
    this.checkoutResponse.set(null);
    this.checkoutError.set(null);
  }

  incrementWaiters(): void {
    this.totalWaiters.update(v => v + 1);
  }

  decrementWaiters(): void {
    this.totalWaiters.update(v => Math.max(0, v - 1));
  }

  getExtraWaiters(): number {
    return Math.max(0, this.totalWaiters() - 2);
  }

  getSelectedPlanPrice(): number {
    const plan = this.availablePlans().find(p => p.code === this.selectedPlanCode());
    return plan?.price ?? 0;
  }

  calcTotalAmount(): number {
    const planTotal = this.getSelectedPlanPrice() * this.selectedMonths();
    const waiterExtra = this.getExtraWaiters() * 35000 * this.selectedMonths();
    return planTotal + waiterExtra;
  }

  confirmCheckout(): void {
    this.initiatingCheckout.set(true);
    this.checkoutError.set(null);

    this.billingService.initiateCheckout({
      planCode: this.selectedPlanCode(),
      provider: this.selectedProvider(),
      months: this.selectedMonths(),
      extraWaiters: this.getExtraWaiters()
    }).subscribe({
      next: (res) => {
        this.initiatingCheckout.set(false);
        this.checkoutResponse.set(res);
      },
      error: (err) => {
        this.initiatingCheckout.set(false);
        this.checkoutError.set(err?.error?.message || 'Checkout yaratishda xatolik yuz berdi');
      }
    });
  }

  executeMockPay(simulateSuccess: boolean): void {
    if (!this.checkoutResponse()) return;

    this.simulatingPay.set(true);
    this.billingService.mockPay({
      paymentId: this.checkoutResponse()!.paymentId,
      simulateSuccess
    }).subscribe({
      next: (updatedSub) => {
        this.simulatingPay.set(false);
        this.sub.set(updatedSub);
        this.loadPaymentHistory();
        this.closeCheckoutModal();
      },
      error: (err) => {
        this.simulatingPay.set(false);
        this.loadPaymentHistory();
        this.closeCheckoutModal();
      }
    });
  }
}
