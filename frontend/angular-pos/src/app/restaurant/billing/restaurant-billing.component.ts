import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BillingService,
  CurrentSubscriptionResponse,
  PlanResponse,
  CalculatePriceResponse,
  InvoiceResponse,
  SubscriptionPeriodResponse,
  SubscriptionRequestResponse
} from '../../core/services/billing.service';
import { FeatureService } from '../../core/services/feature.service';

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
          <button class="btn btn-warning-dark" (click)="openRequestModal()">
            📝 Obunaga Ariza Berish (Bank / Chek)
          </button>
          <button class="btn btn-primary" (click)="openCheckoutModal()">
            ⚡ Tezkor To'lov (Online)
          </button>
        </div>
      </div>

      <!-- Pending or Rejected Subscription Request Banner -->
      @if (latestRequest() && latestRequest()!.status === 'PENDING_APPROVAL') {
        <div class="banner banner-pending-request">
          <div class="banner-icon">🟡</div>
          <div class="banner-content">
            <h3>Obuna arizangiz ko'rib chiqilmoqda!</h3>
            <p>
              Tanlangan tarif: <strong>{{ latestRequest()!.planName }}</strong> ({{ latestRequest()!.durationMonths }} oy, {{ formatPrice(latestRequest()!.amount) }} {{ latestRequest()!.currency }}).
              To'lov usuli: <strong>{{ getPaymentMethodLabel(latestRequest()!.paymentMethod) }}</strong>.
              Ariza yuborilgan vaqt: {{ formatDate(latestRequest()!.createdAt) }}.
              Super Admin to'lovni tekshirib tasdiqlashi bilan obuna avtomatik ravishda faollashadi.
            </p>
          </div>
          <button class="btn btn-sm btn-outline-danger" (click)="cancelCurrentRequest(latestRequest()!.id)">
            Bekor qilish
          </button>
        </div>
      } @else if (latestRequest() && latestRequest()!.status === 'REJECTED') {
        <div class="banner banner-rejected-request">
          <div class="banner-icon">❌</div>
          <div class="banner-content">
            <h3>Obuna so'rovi rad etildi</h3>
            <p>
              Rad etish sababi: <strong>{{ latestRequest()!.rejectionReason || 'To\'lov tasdiqlanmadi' }}</strong>.
              Iltimos, ma'lumotlarni tekshirib qayta ariza yuboring.
            </p>
          </div>
          <button class="btn btn-sm btn-warning-dark" (click)="openRequestModal()">
            Qayta ariza berish
          </button>
        </div>
      }

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

          <!-- Card 2: Resource Limits & Usage (Unlimited Architecture) -->
          <div class="card usage-card">
            <div class="card-header">
              <div>
                <span class="card-title">Resurs Limitlari va Ishlatilishi</span>
                <span class="unlimited-pill">♾️ Barcha Tariflarda Cheksiz</span>
              </div>
              <span class="card-subtitle">Haqiqiy ishlatilgan miqdor</span>
            </div>

            <div class="unlimited-notice">
              <span class="notice-icon">✨</span>
              <span>Tizimda hech qanday resurs cheklovi yo'q. Istalgancha xodim, stol, mahsulot va buyurtmalar yaratishingiz mumkin.</span>
            </div>

            <div class="resource-grid">
              <!-- Users / Employees -->
              <div class="resource-item">
                <div class="res-icon">👥</div>
                <div class="res-body">
                  <span class="res-name">Xodimlar (Foydalanuvchilar)</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentUsers || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Waiters -->
              <div class="resource-item">
                <div class="res-icon">🍽️</div>
                <div class="res-body">
                  <span class="res-name">Ofitsiantlar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentWaiters || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Chefs -->
              <div class="resource-item">
                <div class="res-icon">👨‍🍳</div>
                <div class="res-body">
                  <span class="res-name">Oshpazlar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentChefs || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Tables -->
              <div class="resource-item">
                <div class="res-icon">🪑</div>
                <div class="res-body">
                  <span class="res-name">Stollar soni</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentTables || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Halls / Zones -->
              <div class="resource-item">
                <div class="res-icon">🏛️</div>
                <div class="res-body">
                  <span class="res-name">Zallar / Hududlar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentHalls || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Products -->
              <div class="resource-item">
                <div class="res-icon">🍔</div>
                <div class="res-body">
                  <span class="res-name">Mahsulotlar katalogi</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentProducts || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Categories -->
              <div class="resource-item">
                <div class="res-icon">🏷️</div>
                <div class="res-body">
                  <span class="res-name">Kategoriyalar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentCategories || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Kitchens -->
              <div class="resource-item">
                <div class="res-icon">🍳</div>
                <div class="res-body">
                  <span class="res-name">Oshxonalar / Sexlar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentKitchens || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Orders -->
              <div class="resource-item">
                <div class="res-icon">🧾</div>
                <div class="res-body">
                  <span class="res-name">Buyurtmalar</span>
                  <div class="res-stat">
                    <strong>{{ (sub()!.currentOrders ?? sub()!.currentMonthOrders) || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Printers -->
              <div class="resource-item">
                <div class="res-icon">🖨️</div>
                <div class="res-body">
                  <span class="res-name">Printerlar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentPrinters || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
                </div>
              </div>

              <!-- Devices -->
              <div class="resource-item">
                <div class="res-icon">📱</div>
                <div class="res-body">
                  <span class="res-name">Ulangan Qurilmalar</span>
                  <div class="res-stat">
                    <strong>{{ sub()!.currentDevices || 0 }} ta</strong> ishlatilgan
                    <span class="badge-infinite">Cheksiz</span>
                  </div>
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
          <button class="tab-btn" [class.active]="activeTab === 'requests'" (click)="activeTab = 'requests'">
            📑 Obuna Arizalari ({{ requestHistory().length }})
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

        <!-- Tab 3: Subscription Requests History -->
        @if (activeTab === 'requests') {
          <div class="card table-card">
            <div class="card-header">
              <span class="card-title">Obunaga Yuborilgan Arizalar Tarixi</span>
              <div class="card-actions">
                <button class="btn btn-sm btn-warning-dark" (click)="openRequestModal()">
                  ➕ Yangi Ariza Berish
                </button>
                <button class="btn btn-sm btn-outline" (click)="loadSubscriptionRequests()">
                  Yangilash
                </button>
              </div>
            </div>

            @if (requestHistory().length === 0) {
              <div class="empty-state">
                <p>Hozircha arizalar yuborilmagan.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Tarif</th>
                      <th>Muddat</th>
                      <th>Summa</th>
                      <th>To'lov Usuli</th>
                      <th>To'lov Cheki</th>
                      <th>Holat</th>
                      <th>Izoh / Sabab</th>
                      <th>Yuborilgan Vaqt</th>
                      <th>Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (req of requestHistory(); track req.id) {
                      <tr>
                        <td><strong>{{ req.planName }}</strong> ({{ req.planCode }})</td>
                        <td>{{ req.durationMonths }} oy</td>
                        <td class="amount-cell">{{ formatPrice(req.amount) }} {{ req.currency }}</td>
                        <td>
                          <span class="provider-badge">{{ getPaymentMethodLabel(req.paymentMethod) }}</span>
                        </td>
                        <td>
                          @if (req.receiptUrl) {
                            <a [href]="req.receiptUrl" target="_blank" class="receipt-link">📎 Chekni ko'rish</a>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>
                          <span class="status-badge" [ngClass]="getRequestStatusBadge(req.status)">
                            {{ getRequestStatusLabel(req.status) }}
                          </span>
                        </td>
                        <td>
                          @if (req.rejectionReason) {
                            <span class="text-danger">Rad sababi: {{ req.rejectionReason }}</span>
                          } @else if (req.adminNotes) {
                            <span>{{ req.adminNotes }}</span>
                          } @else if (req.clientNotes) {
                            <span class="text-muted">{{ req.clientNotes }}</span>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>{{ formatDate(req.createdAt) }}</td>
                        <td>
                          @if (req.status === 'PENDING_APPROVAL') {
                            <button class="btn btn-xs btn-outline-danger" (click)="cancelCurrentRequest(req.id)">
                              Bekor qilish
                            </button>
                          }
                        </td>
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
                           [class.pro-card]="plan.code === 'PRO'"
                           (click)="selectPlan(plan.code)">
                        <div class="p-header">
                          <div class="p-name">{{ plan.name }}</div>
                          @if (plan.code === 'PRO') {
                            <span class="pro-tag">⚡ Tavsiya etiladi</span>
                          }
                        </div>
                        <div class="p-price">{{ formatPrice(plan.price) }} so'm <small>/ oy</small></div>
                        <div class="p-features-summary">
                          @if (plan.code === 'PRO') {
                            <div class="feat-badge feat-pro">✅ Barcha Standard + Oshxona Ekrani (KDS) + Mobil Ilova</div>
                          } @else {
                            <div class="feat-badge feat-std">Barcha POS funksiyalari (❌ KDS va Mobil Ilovasiz)</div>
                          }
                        </div>
                        <div class="p-limit">
                          ♾️ Barcha resurslar to'liq cheksiz
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
                <!-- Invoice Confirmation Screen & Interactive Mock Simulator -->
                <div class="invoice-created-box">
                  <div class="invoice-icon">🧾</div>
                  <h3>Hisob-faktura Muvaffaqiyatli Yaratildi!</h3>
                  <div class="invoice-number-pill">{{ checkoutCreatedInvoice()!.invoiceNumber }}</div>

                  <p class="invoice-amount-desc">
                    To'lanadigan summa: <strong>{{ formatPrice(checkoutCreatedInvoice()!.finalAmount) }} {{ checkoutCreatedInvoice()!.currency }}</strong>
                  </p>

                  <!-- Real-time Test Payment Simulator (Mock Gateway) -->
                  <div class="mock-simulator-box">
                    <div class="simulator-header">
                      <span class="simulator-badge">🧪 To'lov Simulyatori (Mock Gateway)</span>
                      <p class="simulator-desc">
                        SaaS obunani darhol faollashtirish va imkoniyatlarni ochish uchun test to'lovini amalga oshiring:
                      </p>
                    </div>

                    <div class="mock-btn-group">
                      <button class="btn btn-mock-success" [disabled]="processingPayment()" (click)="handleMockPayment('SUCCESS')">
                        🟢 Test To'lov: Muvaffaqiyatli (Success)
                      </button>
                      <button class="btn btn-mock-fail" [disabled]="processingPayment()" (click)="handleMockPayment('FAILED')">
                        🔴 Test To'lov: Xatolik (Failed)
                      </button>
                      <button class="btn btn-mock-cancel" [disabled]="processingPayment()" (click)="handleMockPayment('CANCELLED')">
                        ⚪ Bekor Qilish (Cancel)
                      </button>
                    </div>

                    @if (processingPayment()) {
                      <div class="simulator-spinner-row">
                        <div class="spinner-sm"></div>
                        <span>To'lov qayta ishlanmoqda...</span>
                      </div>
                    }

                    @if (paymentMessage()) {
                      <div class="simulator-alert" [class.alert-success]="paymentSuccess()" [class.alert-error]="!paymentSuccess()">
                        {{ paymentMessage() }}
                      </div>
                    }
                  </div>

                  <div class="manual-instruction-alert">
                    <p><strong>To'lov tizimlari:</strong></p>
                    <p>
                      Super Admin tomonidan Click, Payme, Uzcard va Humo sozlanishi mumkin. 
                      Hisob-faktura raqami: <code>{{ checkoutCreatedInvoice()!.invoiceNumber }}</code>
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

      <!-- Manual B2B Subscription Request Modal -->
      @if (showRequestModal()) {
        <div class="modal-overlay" (click)="closeRequestModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Obunaga Ariza Berish (B2B / Bank / Chek)</h2>
              <button class="btn-close" (click)="closeRequestModal()">✕</button>
            </div>

            <div class="modal-body">
              <!-- Step 1: Select Plan -->
              <div class="step-section">
                <label class="section-label">1. Tarif rejasini tanlang:</label>
                <div class="plans-selection">
                  @for (plan of availablePlans(); track plan.code) {
                    <div class="modal-plan-card" 
                         [class.active]="requestPlanCode() === plan.code"
                         [class.pro-card]="plan.code === 'PRO'"
                         (click)="selectRequestPlan(plan)">
                      <div class="p-header">
                        <div class="p-name">{{ plan.name }}</div>
                        @if (plan.code === 'PRO') {
                          <span class="pro-tag">⚡ Tavsiya etiladi</span>
                        }
                      </div>
                      <div class="p-price">{{ formatPrice(plan.price) }} so'm <small>/ oy</small></div>
                      <div class="p-features-summary">
                        @if (plan.code === 'PRO') {
                          <div class="feat-badge feat-pro">✅ Barcha Standard + Oshxona Ekrani (KDS) + Mobil Ilova</div>
                        } @else {
                          <div class="feat-badge feat-std">Barcha POS funksiyalari (❌ KDS va Mobil Ilovasiz)</div>
                        }
                      </div>
                      <div class="p-limit">♾️ Barcha resurslar cheksiz</div>
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
                         [class.active]="requestMonths() === opt.value"
                         (click)="selectRequestMonths(opt.value)">
                      @if (opt.badge) {
                        <span class="month-badge">{{ opt.badge }}</span>
                      }
                      <div class="month-label">{{ opt.label }}</div>
                      <div class="month-price-hint">{{ opt.hint }}</div>
                    </div>
                  }
                </div>
              </div>

              <!-- Step 3: Select Payment Method -->
              <div class="step-section">
                <label class="section-label">3. To'lov turini tanlang:</label>
                <div class="payment-methods-grid">
                  <div class="pm-card" [class.active]="requestPaymentMethod() === 'BANK_TRANSFER'" (click)="requestPaymentMethod.set('BANK_TRANSFER')">
                    <div class="pm-icon">🏦</div>
                    <div class="pm-info">
                      <div class="pm-title">Bank Hisob-Raqamiga (Perechislenie)</div>
                      <div class="pm-desc">Yuridik shaxslar uchun to'lov topshirig'i (schet-faktura)</div>
                    </div>
                  </div>

                  <div class="pm-card" [class.active]="requestPaymentMethod() === 'CARD_TRANSFER'" (click)="requestPaymentMethod.set('CARD_TRANSFER')">
                    <div class="pm-icon">💳</div>
                    <div class="pm-info">
                      <div class="pm-title">Karta Raqamiga O'tkazma</div>
                      <div class="pm-desc">Uzcard / Humo orqali to'lov cheki bilan</div>
                    </div>
                  </div>

                  <div class="pm-card" [class.active]="requestPaymentMethod() === 'CLICK_PAYME_MANUAL'" (click)="requestPaymentMethod.set('CLICK_PAYME_MANUAL')">
                    <div class="pm-icon">📱</div>
                    <div class="pm-info">
                      <div class="pm-title">Click / Payme (Kvitansiya)</div>
                      <div class="pm-desc">Ilova orqali to'langan kvitansiya skrinshoti bilan</div>
                    </div>
                  </div>

                  <div class="pm-card" [class.active]="requestPaymentMethod() === 'CASH'" (click)="requestPaymentMethod.set('CASH')">
                    <div class="pm-icon">💵</div>
                    <div class="pm-info">
                      <div class="pm-title">Naqd To'lov (Kassaga)</div>
                      <div class="pm-desc">Ofis yoki vakilga naqd to'lov qilish</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Company Bank Details Card -->
              <div class="bank-details-box">
                <div class="bd-header">
                  <span class="bd-title">📋 Rasmiy To'lov Rekvizitlari</span>
                  <span class="bd-tag">Kompaniya</span>
                </div>
                <div class="bd-grid">
                  <div class="bd-item">
                    <span class="bd-lbl">Qabul qiluvchi:</span>
                    <strong>"RESTAURANT POS INNOVATION" MCHJ</strong>
                  </div>
                  <div class="bd-item">
                    <span class="bd-lbl">H/R (Hisob raqam):</span>
                    <strong class="code-font">2020 8000 9005 1234 5678</strong>
                  </div>
                  <div class="bd-item">
                    <span class="bd-lbl">Bank:</span>
                    <span>ATIB "Ipoteka Bank" Toshkent sh. filiali</span>
                  </div>
                  <div class="bd-item">
                    <span class="bd-lbl">MFO:</span>
                    <strong class="code-font">00423</strong>
                  </div>
                  <div class="bd-item">
                    <span class="bd-lbl">STIR / INN:</span>
                    <strong class="code-font">308 123 456</strong>
                  </div>
                  <div class="bd-item">
                    <span class="bd-lbl">Karta raqami (Karta o'tkazmasi uchun):</span>
                    <strong class="code-font">9860 3501 2345 6789</strong> (Humo)
                  </div>
                </div>
              </div>

              <!-- Step 4: Upload Receipt -->
              <div class="step-section">
                <label class="section-label">4. To'lov cheki yoki kvitansiya fayli (Ixtiyoriy lekin tavsiya etiladi):</label>
                <div class="receipt-upload-box">
                  <input type="file" #receiptInput accept="image/png,image/jpeg,image/webp,application/pdf" (change)="onReceiptFileSelected($event)" style="display: none" />
                  
                  @if (uploadingReceipt()) {
                    <div class="upload-progress">
                      <div class="spinner-sm"></div>
                      <span>Fayl serverga yuklanmoqda...</span>
                    </div>
                  } @else if (requestReceiptUrl()) {
                    <div class="receipt-preview">
                      <span class="receipt-check">✅ To'lov cheki yuklandi</span>
                      <a [href]="requestReceiptUrl()" target="_blank" class="receipt-link">📎 Chekni ko'rish</a>
                      <button type="button" class="btn btn-sm btn-outline-danger" (click)="requestReceiptUrl.set('')">O'chirish</button>
                    </div>
                  } @else {
                    <button type="button" class="btn btn-outline" (click)="receiptInput.click()">
                      📎 Chek yoki kvitansiya faylini yuklash (JPG, PNG, PDF)
                    </button>
                    <span class="upload-hint">Maksimal hajm: 10 MB</span>
                  }
                </div>
              </div>

              <!-- Step 5: Notes -->
              <div class="step-section">
                <label class="section-label">5. Qo'shimcha izoh yoki to'lovchi rekviziti (Ixtiyoriy):</label>
                <textarea [(ngModel)]="requestClientNotes" class="form-control" rows="2" placeholder="Masalan: To'lov Ipoteka bank ilovasidan o'tkazildi, to'lovchi: Rustamov A."></textarea>
              </div>

              <!-- Price Summary -->
              @if (requestCalcResult()) {
                <div class="price-summary-box">
                  <div class="price-summary-row">
                    <span>Tanlangan tarif:</span>
                    <strong>{{ requestCalcResult()!.planName }}</strong>
                  </div>
                  <div class="price-summary-row">
                    <span>Muddat:</span>
                    <span>{{ requestCalcResult()!.months }} oy</span>
                  </div>
                  <div class="price-summary-row">
                    <span>Asosiy narx:</span>
                    <span>{{ formatPrice(requestCalcResult()!.baseAmount) }} so'm</span>
                  </div>
                  @if (requestCalcResult()!.discountAmount > 0) {
                    <div class="price-summary-row discount-row">
                      <span>Muddat chegirmasi ({{ requestCalcResult()!.discountPercent }}%):</span>
                      <span class="text-success">-{{ formatPrice(requestCalcResult()!.discountAmount) }} so'm</span>
                    </div>
                  }
                  <div class="price-summary-total">
                    <span>To'lanadigan yakuniy summa:</span>
                    <strong>{{ formatPrice(requestCalcResult()!.finalAmount) }} so'm</strong>
                  </div>
                </div>
              }

              @if (requestError()) {
                <div class="alert alert-error">{{ requestError() }}</div>
              }

              @if (requestSuccessMessage()) {
                <div class="alert alert-success">{{ requestSuccessMessage() }}</div>
              }

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="closeRequestModal()">Bekor qilish</button>
                <button class="btn btn-primary" [disabled]="submittingRequest() || uploadingReceipt()" (click)="submitSubscriptionRequest()">
                  @if (submittingRequest()) {
                    <span>Yuborilmoqda...</span>
                  } @else {
                    <span>Ariza Yuborish →</span>
                  }
                </button>
              </div>
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
    .unlimited-pill {
      font-size: 11px;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      padding: 3px 8px;
      border-radius: 9999px;
      display: inline-block;
      margin-left: 8px;
      vertical-align: middle;
    }

    .unlimited-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #c7d2fe;

      .notice-icon { font-size: 16px; }
    }

    .resource-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .resource-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--bg-primary, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 8px;
      transition: border-color 0.2s;

      &:hover {
        border-color: rgba(99, 102, 241, 0.5);
      }

      .res-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .res-body {
        flex: 1;
        overflow: hidden;
      }

      .res-name {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary, #94a3b8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }

      .res-stat {
        font-size: 12px;
        color: var(--text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;

        strong {
          color: #f8fafc;
          font-weight: 700;
        }
      }

      .badge-infinite {
        font-size: 10px;
        font-weight: 700;
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        padding: 1px 6px;
        border-radius: 4px;
        display: inline-block;
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
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;

      @media (max-width: 550px) {
        grid-template-columns: 1fr;
      }
    }

    .modal-plan-card {
      background: var(--bg-primary, #0f172a);
      border: 2px solid var(--border, #334155);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      position: relative;

      &:hover { border-color: #6366f1; }
      &.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.08);
        box-shadow: 0 0 0 1px #6366f1;
      }

      &.pro-card {
        border-color: rgba(245, 158, 11, 0.4);
        &.active {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
          box-shadow: 0 0 0 1px #f59e0b;
        }
      }

      .p-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .p-name { font-size: 15px; font-weight: 800; }
      .pro-tag {
        font-size: 10px;
        font-weight: 700;
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .p-price {
        font-size: 16px;
        font-weight: 800;
        color: #10b981;
        margin-bottom: 8px;
        small { font-size: 11px; font-weight: 500; color: var(--text-muted, #94a3b8); }
      }

      .p-features-summary {
        margin-bottom: 8px;
      }

      .feat-badge {
        font-size: 11px;
        line-height: 1.4;
        padding: 4px 8px;
        border-radius: 6px;

        &.feat-std {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary, #94a3b8);
        }

        &.feat-pro {
          background: rgba(99, 102, 241, 0.15);
          color: #c7d2fe;
          font-weight: 600;
        }
      }

      .p-limit {
        font-size: 11px;
        color: #10b981;
        font-weight: 600;
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
      padding: 16px;

      .invoice-icon { font-size: 40px; margin-bottom: 10px; }
      h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
      .invoice-number-pill {
        display: inline-block;
        padding: 6px 14px;
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        font-family: monospace;
        font-size: 14px;
        font-weight: 700;
        border-radius: 6px;
        margin-bottom: 12px;
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
        padding: 12px;
        text-align: left;
        font-size: 12px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
        margin-bottom: 16px;
        p { margin: 0 0 4px 0; &:last-child { margin: 0; } }
      }
    }

    .mock-simulator-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      text-align: left;

      .simulator-header {
        margin-bottom: 12px;
      }

      .simulator-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        background: #6366f1;
        color: white;
        padding: 3px 10px;
        border-radius: 9999px;
        margin-bottom: 6px;
      }

      .simulator-desc {
        font-size: 12px;
        color: var(--text-secondary, #cbd5e1);
        margin: 0;
        line-height: 1.4;
      }

      .mock-btn-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      .btn-mock-success {
        background: #10b981;
        color: white;
        flex: 1;
        min-width: 140px;
        &:hover { background: #059669; }
      }

      .btn-mock-fail {
        background: #ef4444;
        color: white;
        flex: 1;
        min-width: 140px;
        &:hover { background: #dc2626; }
      }

      .btn-mock-cancel {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border, #334155);
        color: var(--text-secondary, #cbd5e1);
        &:hover { background: rgba(255, 255, 255, 0.15); }
      }

      .simulator-spinner-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        font-size: 12px;
        color: #818cf8;
      }

      .spinner-sm {
        width: 16px;
        height: 16px;
        border: 2px solid var(--border, #334155);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .simulator-alert {
        margin-top: 10px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;

        &.alert-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
        }

        &.alert-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .banner-pending-request {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fcd34d;
      margin-bottom: 24px;
      h3 { color: #f59e0b; }
    }

    .banner-rejected-request {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      margin-bottom: 24px;
      h3 { color: #f87171; }
    }

    .modal-lg {
      max-width: 760px;
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .pm-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--bg-primary, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(99, 102, 241, 0.5);
      }

      &.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
      }

      .pm-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .pm-info {
        flex: 1;
      }

      .pm-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary, #f8fafc);
        margin-bottom: 2px;
      }

      .pm-desc {
        font-size: 11px;
        color: var(--text-muted, #94a3b8);
        line-height: 1.3;
      }
    }

    .bank-details-box {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;

      .bd-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        .bd-title {
          font-size: 13px;
          font-weight: 700;
          color: #c7d2fe;
        }

        .bd-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          border-radius: 4px;
        }
      }

      .bd-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 16px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .bd-item {
        font-size: 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .bd-lbl {
          font-size: 11px;
          color: var(--text-muted, #94a3b8);
        }

        .code-font {
          font-family: monospace;
          color: #38bdf8;
          letter-spacing: 0.5px;
        }
      }
    }

    .receipt-upload-box {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .upload-hint {
        font-size: 11px;
        color: var(--text-muted, #94a3b8);
      }

      .receipt-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 6px;
        font-size: 12px;

        .receipt-check {
          color: #10b981;
          font-weight: 600;
        }

        .receipt-link {
          color: #38bdf8;
          text-decoration: underline;
        }
      }

      .upload-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #818cf8;
      }
    }

    .spinner-sm {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(99, 102, 241, 0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: 11px;
      border-radius: 4px;
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid #ef4444;
      color: #f87171;
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .receipt-link {
      color: #38bdf8;
      font-size: 12px;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;

      &.status-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
      &.status-active, &.status-paid { background: rgba(16, 185, 129, 0.2); color: #10b981; }
      &.status-expired, &.status-cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
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
  private featureService = inject(FeatureService);

  sub = signal<CurrentSubscriptionResponse | null>(null);
  invoices = signal<InvoiceResponse[]>([]);
  periods = signal<SubscriptionPeriodResponse[]>([]);
  availablePlans = signal<PlanResponse[]>([]);
  loading = signal(true);
  activeTab: 'invoices' | 'periods' | 'requests' = 'invoices';

  // Subscription Requests states
  latestRequest = signal<SubscriptionRequestResponse | null>(null);
  requestHistory = signal<SubscriptionRequestResponse[]>([]);
  showRequestModal = signal(false);
  requestPlanCode = signal<string>('STANDARD');
  requestPlanId = signal<string>('');
  requestMonths = signal<number>(1);
  requestPaymentMethod = signal<string>('BANK_TRANSFER');
  requestReceiptUrl = signal<string>('');
  requestClientNotes = '';
  requestCalcResult = signal<CalculatePriceResponse | null>(null);
  submittingRequest = signal(false);
  uploadingReceipt = signal(false);
  requestError = signal<string | null>(null);
  requestSuccessMessage = signal<string | null>(null);

  // Checkout modal
  showCheckoutModal = signal(false);
  selectedPlanCode = signal<string>('STANDARD');
  selectedMonths = signal<number>(1);
  calculating = signal(false);
  calcResult = signal<CalculatePriceResponse | null>(null);
  initiatingCheckout = signal(false);
  checkoutCreatedInvoice = signal<any | null>(null);
  checkoutError = signal<string | null>(null);

  // Mock Payment Simulator states
  processingPayment = signal(false);
  paymentMessage = signal<string | null>(null);
  paymentSuccess = signal(false);

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
    this.loadSubscriptionRequests();
  }

  loadCurrentSubscription(): void {
    this.loading.set(true);
    this.billingService.getCurrentSubscription().subscribe({
      next: (data) => {
        this.sub.set(data);
        this.loading.set(false);
        this.featureService.refreshFeatures().subscribe();
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
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
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
    this.paymentMessage.set(null);
    this.processingPayment.set(false);
    this.selectedMonths.set(1);
    if (this.sub()) {
      const currentCode = this.sub()!.planCode;
      const initialCode = (!currentCode || currentCode === 'TRIAL' || currentCode === 'STARTER') ? 'STANDARD' : currentCode;
      this.selectedPlanCode.set(initialCode);
    } else {
      this.selectedPlanCode.set('STANDARD');
    }
    this.showCheckoutModal.set(true);
    this.triggerCalculate();
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal.set(false);
    this.checkoutCreatedInvoice.set(null);
    this.checkoutError.set(null);
    this.paymentMessage.set(null);
    this.processingPayment.set(false);
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

  handleMockPayment(outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED'): void {
    const inv = this.checkoutCreatedInvoice();
    if (!inv || !inv.paymentId) {
      this.paymentSuccess.set(false);
      this.paymentMessage.set('To‘lov identifikatori topilmadi.');
      return;
    }

    this.processingPayment.set(true);
    this.paymentMessage.set(null);

    this.billingService.processMockPayment(inv.paymentId, outcome).subscribe({
      next: () => {
        this.processingPayment.set(false);
        if (outcome === 'SUCCESS') {
          this.paymentSuccess.set(true);
          this.paymentMessage.set('✅ To‘lov muvaffaqiyatli qabul qilindi! Obuna darhol faollashtirildi.');
          this.loadCurrentSubscription();
          this.loadInvoices();
          this.loadPeriods();
          this.featureService.refreshFeatures().subscribe();
          setTimeout(() => {
            this.closeCheckoutModal();
          }, 1800);
        } else if (outcome === 'FAILED') {
          this.paymentSuccess.set(false);
          this.paymentMessage.set('❌ To‘lov rad etildi (Xatolik simulyatsiya qilindi).');
          this.loadInvoices();
        } else {
          this.paymentSuccess.set(false);
          this.paymentMessage.set('⚪ To‘lov bekor qilindi.');
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.processingPayment.set(false);
        this.paymentSuccess.set(false);
        this.paymentMessage.set(err?.error?.message || 'Mock to‘lovni amalga oshirishda xatolik yuz berdi.');
      }
    });
  }

  // ==========================================
  // SUBSCRIPTION REQUESTS (B2B APPROVAL FLOW)
  // ==========================================

  loadSubscriptionRequests(): void {
    this.billingService.getLatestSubscriptionRequest().subscribe({
      next: (req) => this.latestRequest.set(req)
    });
    this.billingService.getSubscriptionRequestHistory().subscribe({
      next: (history) => this.requestHistory.set(history)
    });
  }

  openRequestModal(preselectPlanCode?: string): void {
    this.requestError.set(null);
    this.requestSuccessMessage.set(null);
    this.submittingRequest.set(false);
    this.uploadingReceipt.set(false);
    this.requestReceiptUrl.set('');
    this.requestClientNotes = '';
    this.requestMonths.set(1);
    this.requestPaymentMethod.set('BANK_TRANSFER');

    const code = preselectPlanCode || this.sub()?.planCode || 'STANDARD';
    const plan = this.availablePlans().find(p => p.code === code) || this.availablePlans()[0];
    if (plan) {
      this.requestPlanCode.set(plan.code);
      this.requestPlanId.set(plan.id);
    } else {
      this.requestPlanCode.set('STANDARD');
      this.requestPlanId.set('');
    }

    this.showRequestModal.set(true);
    this.triggerRequestCalculate();
  }

  closeRequestModal(): void {
    this.showRequestModal.set(false);
    this.requestError.set(null);
    this.requestSuccessMessage.set(null);
  }

  selectRequestPlan(plan: PlanResponse): void {
    this.requestPlanCode.set(plan.code);
    this.requestPlanId.set(plan.id);
    this.triggerRequestCalculate();
  }

  selectRequestMonths(months: number): void {
    this.requestMonths.set(months);
    this.triggerRequestCalculate();
  }

  triggerRequestCalculate(): void {
    const planId = this.requestPlanId();
    const planCode = this.requestPlanCode();
    const months = this.requestMonths();

    this.billingService.calculatePrice({
      planId: planId || undefined,
      planCode: !planId ? planCode : undefined,
      months: months
    }).subscribe({
      next: (res) => this.requestCalcResult.set(res),
      error: () => this.requestCalcResult.set(null)
    });
  }

  onReceiptFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadingReceipt.set(true);
      this.requestError.set(null);

      this.billingService.uploadReceipt(file).subscribe({
        next: (url) => {
          this.uploadingReceipt.set(false);
          this.requestReceiptUrl.set(url);
        },
        error: (err) => {
          this.uploadingReceipt.set(false);
          this.requestError.set(err?.error?.message || 'Chekni yuklashda xatolik yuz berdi');
        }
      });
    }
  }

  submitSubscriptionRequest(): void {
    const plan = this.availablePlans().find(p => p.code === this.requestPlanCode()) || this.availablePlans()[0];
    if (!plan) {
      this.requestError.set('Iltimos, tarif rejasini tanlang!');
      return;
    }

    this.submittingRequest.set(true);
    this.requestError.set(null);
    this.requestSuccessMessage.set(null);

    this.billingService.createSubscriptionRequest({
      planId: plan.id,
      billingPeriod: this.requestMonths() === 12 ? 'ANNUAL' : (this.requestMonths() === 6 ? 'SEMI_ANNUAL' : (this.requestMonths() === 3 ? 'QUARTERLY' : 'MONTHLY')),
      durationMonths: this.requestMonths(),
      paymentMethod: this.requestPaymentMethod(),
      receiptUrl: this.requestReceiptUrl() || undefined,
      clientNotes: this.requestClientNotes ? this.requestClientNotes.trim() : undefined
    }).subscribe({
      next: (res) => {
        this.submittingRequest.set(false);
        this.requestSuccessMessage.set('✅ Arizangiz qabul qilindi va Super Adminga yuborildi. Tez orada ko\'rib chiqiladi!');
        this.latestRequest.set(res);
        this.loadSubscriptionRequests();
        setTimeout(() => {
          this.closeRequestModal();
        }, 1600);
      },
      error: (err) => {
        this.submittingRequest.set(false);
        this.requestError.set(err?.error?.message || 'Arizani yuborishda xatolik yuz berdi');
      }
    });
  }

  cancelCurrentRequest(requestId: string): void {
    if (!confirm('Haqiqatan ham ushbu obuna arizasini bekor qilmoqchimisiz?')) {
      return;
    }

    this.billingService.cancelSubscriptionRequest(requestId).subscribe({
      next: () => {
        this.loadSubscriptionRequests();
      },
      error: (err) => {
        alert(err?.error?.message || 'Arizani bekor qilishda xatolik yuz berdi');
      }
    });
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'BANK_TRANSFER': return '🏦 Bank (Perechislenie)';
      case 'CARD_TRANSFER': return '💳 Karta O\'tkazmasi';
      case 'CLICK_PAYME_MANUAL': return '📱 Click / Payme';
      case 'CASH': return '💵 Naqd Pul';
      default: return method || 'Boshqa';
    }
  }

  getRequestStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return '🟡 Kutilmoqda';
      case 'APPROVED': return '✅ Tasdiqlangan';
      case 'REJECTED': return '❌ Rad etilgan';
      case 'CANCELLED': return '⚪ Bekor qilingan';
      default: return status;
    }
  }

  getRequestStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return 'status-pending';
      case 'APPROVED': return 'status-active';
      case 'REJECTED': return 'status-expired';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  }
}

