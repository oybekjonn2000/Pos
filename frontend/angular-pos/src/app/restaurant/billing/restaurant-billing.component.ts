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
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-restaurant-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TranslatePipe],
  template: `
    <div class="billing-container">
      <!-- Page Header -->
      <div class="billing-header">
        <div>
          <h1 class="page-title">{{ 'billing.title' | translate }}</h1>
          <p class="page-subtitle">{{ 'billing.subtitle' | translate }}</p>
        </div>

        @if (currentSub()) {
          <div class="current-sub-pill" [class.active-pill]="currentSub()!.operating">
            <span class="dot"></span>
            <span>{{ 'billing.currentPlan' | translate }}: <strong>{{ currentSub()!.planName }}</strong></span>
            <span class="divider">|</span>
            <span>{{ currentSub()!.daysRemaining }} {{ 'billing.daysRemaining' | translate }}</span>
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
          <app-icon name="file-text" [size]="16"></app-icon> {{ 'billing.applySubscription' | translate }}
        </button>
        <button 
          type="button" 
          class="billing-tab-btn" 
          [class.active]="activeTab === 'history'"
          (click)="activeTab = 'history'; loadHistory()"
        >
          <app-icon name="clock" [size]="16"></app-icon> {{ 'billing.applicationHistory' | translate }}
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
                <span class="icon-pulse"><app-icon name="hourglass" [size]="22"></app-icon></span>
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
                  <h2 class="section-title">{{ 'billing.selectPlan' | translate }}</h2>
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
                  <h2 class="section-title">{{ 'billing.durationMonths' | translate }}</h2>
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
                  <h2 class="section-title">{{ 'billing.uploadReceipt' | translate }}</h2>
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
                    <span>{{ 'common.loading' | translate }}</span>
                  } @else {
                    <app-icon name="send" [size]="16"></app-icon> <span>{{ 'billing.submitApplication' | translate }} ({{ formatPrice(totalAmount()) }} UZS)</span>
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
                Alohida oynada ochish <app-icon name="arrow-up-right" [size]="14"></app-icon>
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
  styleUrls: ['./restaurant-billing.component.scss']
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
