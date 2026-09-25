import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  BillingService,
  CurrentSubscriptionResponse,
  PlanResponse,
  SubscriptionRequestResponse,
  PaymentCardSettings
} from '../../core/services/billing.service';

@Component({
  selector: 'app-restaurant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="billing-container">
      <!-- Page Header -->
      <div class="billing-header">
        <div>
          <h1 class="page-title">Obuna va To'lov</h1>
          <p class="page-subtitle">Restoraningiz uchun qulay tarif va muddatni tanlab, to'g'ridan-to'g'ri to'lov qiling</p>
        </div>

        @if (currentSub()) {
          <div class="current-sub-pill" [class.active-pill]="currentSub()!.operating">
            <span class="dot"></span>
            <span>Joriy tarif: <strong>{{ currentSub()!.planName }}</strong></span>
            <span class="divider">|</span>
            <span>{{ currentSub()!.daysRemaining }} kun qoldi</span>
          </div>
        }
      </div>

      <!-- TABS NAVIGATION: NEW REQUEST vs HISTORY -->
      <div class="billing-tabs-nav">
        <button 
          type="button" 
          class="billing-tab-btn" 
          [class.active]="activeTab === 'form'"
          (click)="activeTab = 'form'"
        >
          <app-icon name="file-text" [size]="16"></app-icon> Obunaga Ariza Berish
        </button>
        <button 
          type="button" 
          class="billing-tab-btn" 
          [class.active]="activeTab === 'history'"
          (click)="activeTab = 'history'; loadHistory()"
        >
          <app-icon name="clock" [size]="16"></app-icon> Arizalar Tarixi
          @if (requestHistory().length > 0) {
            <span class="tab-badge">{{ requestHistory().length }}</span>
          }
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: NEW REQUEST FORM -->
      <!-- ======================================================== -->
      @if (activeTab === 'form') {
        <!-- STATUS BANNER: PENDING APPROVAL -->
        @if (latestRequest() && latestRequest()!.status === 'PENDING_APPROVAL') {
          <div class="status-banner banner-pending">
            <div class="banner-icon-col">
              <div class="pulse-ring">
                <span class="icon-pulse">⏳</span>
              </div>
            </div>
            <div class="banner-body">
              <div class="banner-badge">ARIZA KUTILMOQDA</div>
              <h3 class="banner-title">Sizning arizangiz ko'rib chiqilmoqda</h3>
              <p class="banner-desc">
                Super admin to'lovni tasdiqlashi bilan tizim avtomatik ishga tushadi va obunangiz faollashadi.
              </p>
              <div class="pending-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Tanlangan tarif:</span>
                  <span class="meta-val">{{ latestRequest()!.planName }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Muddat:</span>
                  <span class="meta-val">{{ latestRequest()!.durationMonths }} oy</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">To'lov summasi:</span>
                  <span class="meta-val highlight">{{ formatPrice(latestRequest()!.amount) }} {{ latestRequest()!.currency }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Yuborilgan vaqti:</span>
                  <span class="meta-val">{{ formatDate(latestRequest()!.createdAt) }}</span>
                </div>
              </div>
              @if (latestRequest()!.receiptUrl) {
                <div class="receipt-link-row">
                  <a [href]="resolveReceiptUrl(latestRequest()!.receiptUrl)" target="_blank" class="receipt-preview-btn">
                    <app-icon name="file-text" [size]="16"></app-icon> Yuklangan to'lov chekini ko'rish
                  </a>
                </div>
              }
            </div>
            <div class="banner-actions">
              <button class="btn btn-outline-danger" (click)="cancelRequest()" [disabled]="cancelling()">
                {{ cancelling() ? 'Bekor qilinmoqda...' : 'Arizani bekor qilish' }}
              </button>
            </div>
          </div>
        }

        <!-- STATUS BANNER: REJECTED -->
        @if (latestRequest() && latestRequest()!.status === 'REJECTED') {
          <div class="status-banner banner-rejected">
            <div class="banner-icon-col">
              <span class="icon-static"><app-icon name="x" [size]="16"></app-icon></span>
            </div>
            <div class="banner-body">
              <div class="banner-badge red">RAD ETILDI</div>
              <h3 class="banner-title">Oldingi obuna arizangiz rad etilgan</h3>
              <p class="banner-desc">
                Sababi: <strong>{{ latestRequest()!.rejectionReason || 'To‘lov cheki tasdiqlanmadi' }}</strong>
              </p>
              <p class="banner-subtext">Quyidagi formadan to'lov rekvizitlarini qayta tekshirib, yangi ariza yuborishingiz mumkin.</p>
            </div>
          </div>
        }

        <!-- MAIN SUBSCRIPTION FORM -->
        <div class="order-form-grid">
          <!-- LEFT: PLAN SELECTION & DURATION -->
          <div class="form-col left-col">
            <!-- STEP 1: SELECT PLAN -->
            <div class="card form-section-card">
              <div class="section-title-row">
                <span class="step-num">1</span>
                <div>
                  <h2 class="section-title">Tarifni tanlang</h2>
                  <p class="section-hint">Restoraningiz miqyosiga mos tarifni tanlang</p>
                </div>
              </div>

              <div class="plans-grid">
                @for (plan of availablePlans(); track plan.id) {
                  <div 
                    class="plan-card"
                    [class.selected]="selectedPlan()?.id === plan.id"
                    (click)="selectPlan(plan)"
                  >
                    <div class="plan-card-top">
                      <span class="plan-tag" [class.tag-pro]="plan.code === 'PRO'">
                        {{ plan.code === 'PRO' ? 'TAVSIYA ETILADI' : 'BAZAVIY' }}
                      </span>
                      <div class="radio-circle" [class.checked]="selectedPlan()?.id === plan.id"></div>
                    </div>

                    <h3 class="plan-name">{{ plan.name }}</h3>
                    <p class="plan-desc">{{ plan.description || 'Restoran uchun toliq avtomatlashtirish' }}</p>

                    <div class="plan-price-block">
                      <span class="plan-amount">{{ formatPrice(plan.price) }}</span>
                      <span class="plan-period">UZS / oy</span>
                    </div>

                    <div class="plan-features-mini">
                      <div class="feat-item"><app-icon name="check" [size]="14"></app-icon> Cheksiz buyurtmalar</div>
                      <div class="feat-item"><app-icon name="check" [size]="14"></app-icon> KDS Oshxona tizimi</div>
                      <div class="feat-item"><app-icon name="check" [size]="14"></app-icon> Hisobotlar & Statistika</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- STEP 2: SELECT DURATION -->
            <div class="card form-section-card">
              <div class="section-title-row">
                <span class="step-num">2</span>
                <div>
                  <h2 class="section-title">Obuna muddatini tanlang</h2>
                  <p class="section-hint">Muddat qancha uzoq bo'lsa, xizmat uzluksiz ishlaydi</p>
                </div>
              </div>

              <div class="duration-pills">
                @for (m of durationOptions; track m.months) {
                  <button 
                    type="button" 
                    class="duration-pill"
                    [class.active]="selectedMonths() === m.months"
                    (click)="selectedMonths.set(m.months)"
                  >
                    <span class="pill-months">{{ m.label }}</span>
                    @if (m.badge) {
                      <span class="pill-badge">{{ m.badge }}</span>
                    }
                  </button>
                }
              </div>

              <!-- TOTAL SUMMARY DISPLAY -->
              <div class="total-calc-box">
                <div class="calc-row">
                  <span class="calc-label">Tanlangan tarif:</span>
                  <span class="calc-value">{{ selectedPlan()?.name || 'Tarif tanlanmagan' }}</span>
                </div>
                <div class="calc-row">
                  <span class="calc-label">Muddat:</span>
                  <span class="calc-value">{{ selectedMonths() }} oy</span>
                </div>
                <div class="calc-divider"></div>
                <div class="calc-row total-row">
                  <span class="total-label">Jami to'lov summasi:</span>
                  <span class="total-amount">{{ formatPrice(totalAmount()) }} <small>UZS</small></span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: PAYMENT REQUISITES & RECEIPT UPLOAD -->
          <div class="form-col right-col">
            <!-- STEP 3: PAYMENT CARD REQUISITES -->
            <div class="card form-section-card">
              <div class="section-title-row">
                <span class="step-num">3</span>
                <div>
                  <h2 class="section-title">To'lov rekvizitlari</h2>
                  <p class="section-hint">Quyidagi karta raqamiga to'lov qiling</p>
                </div>
              </div>

              <!-- CREDIT CARD MOCKUP -->
              <div class="credit-card-mockup">
                <div class="card-bg-glow"></div>
                
                <div class="card-top-row">
                  <div class="bank-brand-title">{{ paymentCard()?.bankName || 'O‘zbekiston Banki' }}</div>
                  <div class="contactless-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                      <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>

                <!-- CHIP ICON -->
                <div class="card-chip">
                  <div class="chip-line"></div>
                  <div class="chip-line"></div>
                </div>

                <!-- CARD NUMBER WITH COPY BUTTON -->
                <div class="card-number-wrapper">
                  <div class="card-number">{{ formatCardNumber(paymentCard()?.cardNumber) }}</div>
                  <button 
                    type="button" 
                    class="btn-copy-card" 
                    (click)="copyCardNumber(paymentCard()?.cardNumber)"
                    [title]="'Karta raqamini nusxalash'"
                  >
                    @if (copied()) {
                      <span class="copied-indicator"><app-icon name="check" [size]="14"></app-icon> Nusxalandi!</span>
                    } @else {
                      <span class="copy-text"><app-icon name="clipboard" [size]="14"></app-icon> Nusxa olish</span>
                    }
                  </button>
                </div>

                <!-- CARD BOTTOM INFO -->
                <div class="card-bottom-row">
                  <div class="card-holder-col">
                    <span class="holder-label">KARTA EGASI</span>
                    <span class="holder-name">{{ paymentCard()?.cardHolder || 'Platform Administrator' }}</span>
                  </div>
                  <div class="payment-system-tag">
                    <span class="sys-text">HUMO / UZCARD</span>
                  </div>
                </div>
              </div>

              <!-- INSTRUCTIONS BOX -->
              <div class="instructions-box">
                <div class="inst-icon"><app-icon name="info" [size]="20"></app-icon></div>
                <div class="inst-text">
                  <strong>To'lov izohi:</strong>
                  {{ paymentCard()?.instructions || 'To‘lov qilgach, chek skrinshotini quyida biriktiring va ariza yuboring.' }}
                </div>
              </div>
            </div>

            <!-- STEP 4: RECEIPT UPLOAD & SUBMIT -->
            <div class="card form-section-card">
              <div class="section-title-row">
                <span class="step-num">4</span>
                <div>
                  <h2 class="section-title">To'lov chekini yuklash</h2>
                  <p class="section-hint">To'lov qilinganligini tasdiqlovchi chek rasmi yoki PDF fayli</p>
                </div>
              </div>

              <!-- DROPZONE -->
              <div 
                class="receipt-dropzone"
                [class.has-file]="!!selectedFile"
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (drop)="onFileDrop($event)"
              >
                <input 
                  #fileInput 
                  type="file" 
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  class="hidden-file-input" 
                  (change)="onFileSelected($event)" 
                />

                @if (!selectedFile) {
                  <div class="dropzone-empty">
                    <div class="upload-icon-circle"><app-icon name="upload" [size]="24"></app-icon></div>
                    <div class="dropzone-text">
                      <strong>Chek faylini tanlash</strong> yoki shu yerga tashlang
                    </div>
                    <span class="dropzone-sub">PNG, JPG, WEBP yoki PDF (Maksimal 10 MB)</span>
                  </div>
                } @else {
                  <div class="dropzone-filled" (click)="$event.stopPropagation()">
                    <div class="file-preview-row">
                      @if (previewUrl) {
                        <img [src]="previewUrl" alt="Chek preview" class="preview-thumbnail" />
                      } @else {
                        <div class="pdf-icon-box"><app-icon name="file-text" [size]="20"></app-icon></div>
                      }
                      <div class="file-details">
                        <span class="file-name">{{ selectedFile.name }}</span>
                        <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                      </div>
                      <button type="button" class="btn-remove-file" (click)="removeFile($event)"><app-icon name="x" [size]="14"></app-icon></button>
                    </div>
                  </div>
                }
              </div>

              <!-- CLIENT NOTES (OPTIONAL) -->
              <div class="form-group notes-group">
                <label for="clientNotes" class="form-label">Qo'shimcha izoh (ixtiyoriy):</label>
                <input 
                  id="clientNotes"
                  type="text" 
                  [(ngModel)]="clientNotes" 
                  placeholder="Masalan: Paymedan to'landi, Tel: +998 90 123 45 67" 
                  class="form-control" 
                />
              </div>

              <!-- SUBMIT BUTTON -->
              <div class="submit-action-box">
                <button 
                  type="button" 
                  class="btn-submit-request" 
                  [disabled]="submitting() || !selectedPlan() || !selectedFile"
                  (click)="submitSubscriptionRequest()"
                >
                  @if (submitting()) {
                    <span class="spinner-sm"></span>
                    <span>Ariza yuborilmoqda...</span>
                  } @else {
                    <app-icon name="send" [size]="16"></app-icon> <span>Ariza Yuborish ({{ formatPrice(totalAmount()) }} UZS)</span>
                  }
                </button>

                @if (!selectedFile) {
                  <p class="submit-warning"><app-icon name="alert-triangle" [size]="14"></app-icon> Iltimos, arizani yuborish uchun to'lov chekini biriktiring</p>
                }
              </div>

              @if (errorMessage()) {
                <div class="alert alert-danger mt-3">
                  {{ errorMessage() }}
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- TAB 2: REQUESTS HISTORY TABLE -->
      <!-- ======================================================== -->
      @if (activeTab === 'history') {
        <div class="card content-card history-card">
          <div class="card-header-clean">
            <div>
              <h2 class="history-title">Arizalar Tarixi</h2>
              <p class="history-subtitle">Restoraningiz tomonidan yuborilgan barcha obuna so'rovlari va ularning holati</p>
            </div>
            <button class="btn btn-sm btn-outline-refresh" (click)="loadHistory()" [disabled]="loadingHistory()">
              <app-icon name="refresh" [size]="14"></app-icon> Yangilash
            </button>
          </div>

          @if (loadingHistory()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Tarix yuklanmoqda...</p>
            </div>
          } @else if (requestHistory().length === 0) {
            <div class="empty-state">
              <span class="empty-icon"><app-icon name="inbox" [size]="48"></app-icon></span>
              <p>Hozircha hech qanday ariza topshirilmagan.</p>
              <button class="btn btn-primary-sm mt-3" (click)="activeTab = 'form'">
                + Yangi Ariza Berish
              </button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="styled-table">
                <thead>
                  <tr>
                    <th>Tarif</th>
                    <th>Muddat</th>
                    <th>To'lov Summasi</th>
                    <th>To'lov Cheki</th>
                    <th>Yuborilgan Sana</th>
                    <th>Holati</th>
                    <th>Izoh / Ko'rib chiqish</th>
                    <th class="text-right">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of requestHistory(); track req.id) {
                    <tr [class.highlight-row]="req.status === 'PENDING_APPROVAL'">
                      <td>
                        <span class="plan-badge" [class.badge-pro]="req.planCode === 'PRO'">
                          {{ req.planName }}
                        </span>
                      </td>
                      <td>
                        <span class="duration-text">{{ req.durationMonths }} oy</span>
                      </td>
                      <td>
                        <strong class="amount-text">{{ formatPrice(req.amount) }}</strong>
                        <small class="currency-text">{{ req.currency }}</small>
                      </td>
                      <td>
                        @if (req.receiptUrl) {
                          @if (isImage(req.receiptUrl)) {
                            <div class="receipt-thumb-wrapper" (click)="openReceiptModal(resolveReceiptUrl(req.receiptUrl))">
                              <img [src]="resolveReceiptUrl(req.receiptUrl)" alt="Chek" class="receipt-thumb" />
                              <span class="thumb-hover-overlay"><app-icon name="search" [size]="20"></app-icon></span>
                            </div>
                          } @else {
                            <a [href]="resolveReceiptUrl(req.receiptUrl)" target="_blank" class="receipt-pdf-link">
                              <app-icon name="file-text" [size]="16"></app-icon> PDF Chek
                            </a>
                          }
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        <span class="date-text">{{ formatDate(req.createdAt) }}</span>
                      </td>
                      <td>
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(req.status)">
                          {{ getStatusLabel(req.status) }}
                        </span>
                      </td>
                      <td>
                        @if (req.status === 'REJECTED' && req.rejectionReason) {
                          <span class="reject-reason-text">Sabab: {{ req.rejectionReason }}</span>
                        } @else if (req.status === 'APPROVED' && req.reviewedAt) {
                          <span class="approved-date-text">Tasdiqlandi: {{ formatDate(req.reviewedAt) }}</span>
                        } @else if (req.clientNotes) {
                          <span class="client-notes-text">"{{ req.clientNotes }}"</span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td class="text-right">
                        @if (req.status === 'PENDING_APPROVAL') {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-outline-danger" 
                            (click)="cancelSpecificRequest(req.id)"
                            [disabled]="cancelling()"
                          >
                            Bekor qilish
                          </button>
                        } @else {
                          <span class="text-muted">—</span>
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

      <!-- ======================================================== -->
      <!-- MODAL: RECEIPT IMAGE LIGHTBOX -->
      <!-- ======================================================== -->
      @if (activeReceiptModal()) {
        <div class="modal-backdrop" (click)="activeReceiptModal.set(null)">
          <div class="modal-card receipt-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">To'lov Cheki Skrinshoti</h3>
              <button type="button" class="btn-close-modal" (click)="activeReceiptModal.set(null)"><app-icon name="x" [size]="18"></app-icon></button>
            </div>
            <div class="modal-body-img">
              <img [src]="resolveReceiptUrl(activeReceiptModal())" alt="Chek to'liq rasm" class="full-receipt-img" />
            </div>
            <div class="modal-footer">
              <a [href]="resolveReceiptUrl(activeReceiptModal())" target="_blank" class="btn btn-outline-primary">
                Alohida oynada ochish ↗
              </a>
              <button type="button" class="btn btn-secondary" (click)="activeReceiptModal.set(null)">
                Yopish
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem 1rem;
      color: var(--text-color, #1f2937);
      font-family: inherit;
    }

    .billing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.025em;
    }

    .page-subtitle {
      font-size: 0.95rem;
      color: var(--text-muted, #6b7280);
      margin: 0;
    }

    .current-sub-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #065f46;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    }

    .divider {
      color: rgba(6, 95, 70, 0.4);
    }

    /* TABS NAV */
    .billing-tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }

    .billing-tab-btn {
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      margin-bottom: -2px;
    }

    .billing-tab-btn:hover {
      color: #1e293b;
    }

    .billing-tab-btn.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .tab-badge {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 9999px;
      padding: 0.15rem 0.5rem;
    }

    /* STATUS BANNERS */
    .status-banner {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .banner-pending {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1.5px solid #f59e0b;
      color: #78350f;
    }

    .banner-rejected {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1.5px solid #ef4444;
      color: #7f1d1d;
    }

    .banner-icon-col {
      flex-shrink: 0;
    }

    .pulse-ring {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #fde68a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      position: relative;
    }

    .icon-static {
      font-size: 2rem;
      display: block;
    }

    .banner-body {
      flex: 1;
    }

    .banner-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      background: #d97706;
      color: white;
      margin-bottom: 0.35rem;
    }

    .banner-badge.red {
      background: #dc2626;
    }

    .banner-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
    }

    .banner-desc {
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
      line-height: 1.45;
    }

    .pending-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.6);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-top: 0.5rem;
    }

    .meta-item {
      font-size: 0.875rem;
    }

    .meta-label {
      color: #92400e;
      margin-right: 0.4rem;
    }

    .meta-val {
      font-weight: 700;
      color: #78350f;
    }

    .meta-val.highlight {
      color: #b45309;
      font-size: 0.95rem;
    }

    .receipt-link-row {
      margin-top: 0.75rem;
    }

    .receipt-preview-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2563eb;
      text-decoration: underline;
    }

    .banner-actions {
      flex-shrink: 0;
      align-self: center;
    }

    /* GRID FORM */
    .order-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 992px) {
      .order-form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card {
      background: #ffffff;
      border-radius: 1.25rem;
      border: 1px solid rgba(229, 231, 235, 0.8);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      padding: 1.5rem;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.25rem;
    }

    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      font-weight: 800;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .section-hint {
      font-size: 0.825rem;
      color: #6b7280;
      margin: 0.15rem 0 0 0;
    }

    /* PLANS */
    .plans-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }

    .plan-card {
      border: 2px solid #e5e7eb;
      border-radius: 1rem;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      background: #fafafa;
    }

    .plan-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
    }

    .plan-card.selected {
      border-color: #6366f1;
      background: linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
    }

    .plan-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .plan-tag {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: #e2e8f0;
      color: #475569;
      letter-spacing: 0.05em;
    }

    .plan-tag.tag-pro {
      background: #fef08a;
      color: #854d0e;
    }

    .radio-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      position: relative;
      transition: all 0.2s;
    }

    .radio-circle.checked {
      border-color: #6366f1;
      background: #6366f1;
    }

    .radio-circle.checked::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .plan-name {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .plan-desc {
      font-size: 0.785rem;
      color: #64748b;
      margin: 0 0 0.85rem 0;
      line-height: 1.35;
      min-height: 2rem;
    }

    .plan-price-block {
      margin-bottom: 0.85rem;
    }

    .plan-amount {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e1b4b;
    }

    .plan-period {
      font-size: 0.75rem;
      color: #64748b;
      margin-left: 0.25rem;
    }

    .plan-features-mini {
      border-top: 1px dashed #e2e8f0;
      padding-top: 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .feat-item {
      font-size: 0.75rem;
      color: #475569;
      font-weight: 500;
    }

    /* DURATION PILLS */
    .duration-pills {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
      margin-bottom: 1.25rem;
    }

    @media (max-width: 500px) {
      .duration-pills {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .duration-pill {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.75rem 0.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }

    .duration-pill:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }

    .duration-pill.active {
      border-color: #6366f1;
      background: #eef2ff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    }

    .pill-months {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .duration-pill.active .pill-months {
      color: #4338ca;
    }

    .pill-badge {
      font-size: 0.65rem;
      font-weight: 800;
      color: #059669;
      background: #d1fae5;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    /* CALC BOX */
    .total-calc-box {
      background: #f8fafc;
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
      font-size: 0.875rem;
    }

    .calc-label {
      color: #64748b;
    }

    .calc-value {
      font-weight: 600;
      color: #1e293b;
    }

    .calc-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.6rem 0;
    }

    .total-row {
      margin-bottom: 0;
    }

    .total-label {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .total-amount {
      font-size: 1.4rem;
      font-weight: 900;
      color: #4338ca;
    }

    /* CREDIT CARD MOCKUP */
    .credit-card-mockup {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%);
      color: white;
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 12px 30px rgba(49, 46, 129, 0.35);
      position: relative;
      overflow: hidden;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .card-bg-glow {
      position: absolute;
      top: -30%;
      right: -30%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .bank-brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #e0e7ff;
    }

    .card-chip {
      width: 44px;
      height: 32px;
      border-radius: 6px;
      background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      padding: 4px;
      box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
    }

    .chip-line {
      height: 1px;
      background: rgba(0, 0, 0, 0.3);
      width: 100%;
    }

    .card-number-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .card-number {
      font-size: 1.35rem;
      font-family: monospace;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    }

    .btn-copy-card {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    }

    .btn-copy-card:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .copied-indicator {
      color: #4ade80;
      font-weight: 700;
    }

    .card-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .holder-label {
      display: block;
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 0.2rem;
    }

    .holder-name {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #f8fafc;
    }

    .payment-system-tag {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #cbd5e1;
    }

    /* INSTRUCTIONS */
    .instructions-box {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: #f1f5f9;
      border-left: 4px solid #6366f1;
      padding: 0.85rem 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      font-size: 0.85rem;
      line-height: 1.45;
      color: #334155;
    }

    .inst-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    /* RECEIPT DROPZONE */
    .receipt-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 1rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
      text-align: center;
      margin-bottom: 1.25rem;
    }

    .receipt-dropzone:hover {
      border-color: #6366f1;
      background: #f5f3ff;
    }

    .receipt-dropzone.has-file {
      border-color: #10b981;
      background: #f0fdf4;
      border-style: solid;
    }

    .hidden-file-input {
      display: none;
    }

    .upload-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin: 0 auto 0.75rem auto;
    }

    .dropzone-text {
      font-size: 0.95rem;
      color: #334155;
      margin-bottom: 0.25rem;
    }

    .dropzone-sub {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .file-preview-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: left;
    }

    .preview-thumbnail {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .pdf-icon-box {
      width: 52px;
      height: 52px;
      background: #fee2e2;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .file-details {
      flex: 1;
      overflow: hidden;
    }

    .file-name {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.75rem;
      color: #64748b;
    }

    .btn-remove-file {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
    }

    .notes-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.825rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.35rem;
    }

    .form-control {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.65rem;
      padding: 0.65rem 0.85rem;
      font-size: 0.875rem;
      transition: all 0.2s;
      outline: none;
    }

    .form-control:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    /* SUBMIT BUTTON */
    .submit-action-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-submit-request {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 0.85rem;
      padding: 1rem;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-submit-request:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
    }

    .btn-submit-request:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .submit-warning {
      font-size: 0.775rem;
      color: #92400e;
      text-align: center;
      margin: 0;
    }

    .spinner-sm {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background: #ef4444;
      color: white;
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .alert-danger {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }

    /* HISTORY TAB STYLES */
    .history-card {
      margin-top: 0.5rem;
    }

    .card-header-clean {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .history-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .history-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .btn-outline-refresh {
      background: transparent;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.4rem 0.85rem;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      color: #475569;
      transition: all 0.2s;
    }

    .btn-outline-refresh:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    /* TABLE */
    .table-responsive {
      overflow-x: auto;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .styled-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    .styled-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .highlight-row {
      background: #fffbeb;
    }

    .plan-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      background: #e2e8f0;
      color: #334155;
    }

    .plan-badge.badge-pro {
      background: #fef08a;
      color: #854d0e;
    }

    .duration-text {
      font-weight: 600;
      color: #334155;
    }

    .amount-text {
      font-weight: 800;
      color: #1e1b4b;
    }

    .currency-text {
      font-size: 0.75rem;
      color: #64748b;
      margin-left: 0.25rem;
    }

    .receipt-thumb-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid #cbd5e1;
    }

    .receipt-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .receipt-thumb-wrapper:hover .thumb-hover-overlay {
      opacity: 1;
    }

    .receipt-pdf-link {
      font-weight: 600;
      color: #2563eb;
      text-decoration: underline;
    }

    .date-text {
      color: #475569;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    .badge-approved {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }

    .badge-rejected {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .reject-reason-text {
      font-size: 0.75rem;
      color: #dc2626;
      font-weight: 500;
    }

    .approved-date-text {
      font-size: 0.75rem;
      color: #059669;
      font-weight: 500;
    }

    .client-notes-text {
      font-size: 0.75rem;
      color: #0284c7;
      font-style: italic;
    }

    .text-muted {
      color: #94a3b8;
    }

    .text-right {
      text-align: right;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.785rem;
    }

    .btn-primary-sm {
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      font-weight: 600;
      cursor: pointer;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.75rem auto;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 600px;
      overflow: hidden;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
    }

    .btn-close-modal {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #64748b;
    }

    .modal-body-img {
      max-height: 70vh;
      overflow: auto;
      text-align: center;
      background: #0f172a;
      padding: 1rem;
    }

    .full-receipt-img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }

    .btn-outline-primary {
      background: transparent;
      border: 1px solid #4f46e5;
      color: #4f46e5;
    }
  `]
})
export class RestaurantBillingComponent implements OnInit {
  private billingService = inject(BillingService);

  // Active Tab
  activeTab: 'form' | 'history' = 'form';

  // SIGNALS
  currentSub = signal<CurrentSubscriptionResponse | null>(null);
  availablePlans = signal<PlanResponse[]>([]);
  latestRequest = signal<SubscriptionRequestResponse | null>(null);
  requestHistory = signal<SubscriptionRequestResponse[]>([]);
  paymentCard = signal<PaymentCardSettings | null>(null);

  selectedPlan = signal<PlanResponse | null>(null);
  selectedMonths = signal<number>(1);
  submitting = signal<boolean>(false);
  cancelling = signal<boolean>(false);
  loadingHistory = signal<boolean>(false);
  copied = signal<boolean>(false);
  errorMessage = signal<string>('');
  activeReceiptModal = signal<string | null>(null);

  durationOptions = [
    { months: 1, label: '1 oy', badge: '' },
    { months: 3, label: '3 oy', badge: '' },
    { months: 6, label: '6 oy', badge: 'Tavsiya' },
    { months: 12, label: '1 yil', badge: 'Foydali' }
  ];

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  clientNotes: string = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    // 1. Current Subscription
    this.billingService.getCurrentSubscription().subscribe({
      next: (sub) => this.currentSub.set(sub),
      error: () => {}
    });

    // 2. Available Plans
    this.billingService.getPublicPlans().subscribe({
      next: (plans) => {
        const active = (plans || []).filter(p => p.active && !p.archived && p.code !== 'TRIAL');
        this.availablePlans.set(active);
        if (active.length > 0 && !this.selectedPlan()) {
          const pro = active.find(p => p.code === 'PRO') || active[0];
          this.selectedPlan.set(pro);
        }
      },
      error: () => {}
    });

    // 3. Payment Card Settings
    this.billingService.getClientPaymentCard().subscribe({
      next: (card) => this.paymentCard.set(card),
      error: () => {}
    });

    // 4. Latest Subscription Request
    this.billingService.getLatestSubscriptionRequest().subscribe({
      next: (req) => this.latestRequest.set(req),
      error: () => {}
    });

    // 5. Request History
    this.loadHistory();
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.billingService.getSubscriptionRequestHistory().subscribe({
      next: (history) => {
        this.requestHistory.set(history || []);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  selectPlan(plan: PlanResponse): void {
    this.selectedPlan.set(plan);
  }

  totalAmount(): number {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return (plan.price || 0) * (this.selectedMonths() || 1);
  }

  formatPrice(val?: number): string {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('uz-UZ');
  }

  formatCardNumber(card?: string): string {
    if (!card) return '8600 0000 0000 0000';
    const clean = card.replace(/\s+/g, '');
    const parts = clean.match(/.{1,4}/g);
    return parts ? parts.join(' ') : card;
  }

  copyCardNumber(card?: string): void {
    if (!card) return;
    const clean = card.replace(/\s+/g, '');
    navigator.clipboard.writeText(clean).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    this.errorMessage.set('');
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('Fayl hajmi 10 MB dan oshmasligi kerak!');
      return;
    }
    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  submitSubscriptionRequest(): void {
    const plan = this.selectedPlan();
    if (!plan) {
      this.errorMessage.set('Iltimos, tarifni tanlang!');
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage.set('Iltimos, to‘lov chekini yuklang!');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    // Step 1: Upload receipt file
    this.billingService.uploadReceipt(this.selectedFile).subscribe({
      next: (receiptUrl) => {
        // Step 2: Create subscription request
        this.billingService.createSubscriptionRequest({
          planId: plan.id,
          billingPeriod: 'MONTHLY',
          durationMonths: this.selectedMonths(),
          paymentMethod: 'CARD_TRANSFER',
          receiptUrl: receiptUrl,
          clientNotes: this.clientNotes.trim()
        }).subscribe({
          next: (req) => {
            this.submitting.set(false);
            this.latestRequest.set(req);
            this.loadHistory();
            this.selectedFile = null;
            this.previewUrl = null;
            this.clientNotes = '';
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set(err?.error?.message || 'Ariza yuborishda xatolik yuz berdi!');
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Chek faylini yuklashda xatolik yuz berdi!');
      }
    });
  }

  cancelRequest(): void {
    const req = this.latestRequest();
    if (!req) return;
    this.cancelSpecificRequest(req.id);
  }

  cancelSpecificRequest(requestId: string): void {
    if (!confirm('Haqiqatan ham ushbu arizani bekor qilmoqchimisiz?')) {
      return;
    }

    this.cancelling.set(true);
    this.billingService.cancelSubscriptionRequest(requestId).subscribe({
      next: (updated) => {
        this.cancelling.set(false);
        this.latestRequest.set(updated);
        this.loadHistory();
      },
      error: (err) => {
        this.cancelling.set(false);
        alert(err?.error?.message || 'Bekor qilishda xatolik!');
      }
    });
  }

  openReceiptModal(url: string): void {
    this.activeReceiptModal.set(url);
  }

  isImage(url?: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
  }

  resolveReceiptUrl(url?: string | null): string {
    if (!url || !url.trim()) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    const base = environment.apiUrl ? environment.apiUrl.replace(/\/api\/?$/, '') : 'http://localhost:8080';
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${cleanPath}`;
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return 'Kutilmoqda';
      case 'APPROVED': return 'Faollashtirilgan';
      case 'REJECTED': return 'Rad etilgan';
      case 'CANCELLED': return 'Bekor qilingan';
      default: return status || '';
    }
  }
}
