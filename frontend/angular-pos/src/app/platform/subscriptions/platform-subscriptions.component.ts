import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  BillingService,
  SubscriptionRequestResponse,
  PaymentCardSettings
} from '../../core/services/billing.service';

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="platform-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">B2B Obunalar va To'lovlar Boshqaruvi</h1>
          <p class="page-subtitle">Restoranlardan kelib tushgan arizalar va to'lov qabul qilish karta rekvizitlari</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-refresh" (click)="refreshAll()" [disabled]="loading()">
            <app-icon name="refresh" [size]="14"></app-icon> Yangilash
          </button>
        </div>
      </div>

      <!-- MAIN TABS NAVIGATION -->
      <div class="tabs-nav-bar">
        <button 
          type="button" 
          class="tab-nav-item" 
          [class.active]="activeTab === 'requests'" 
          (click)="activeTab = 'requests'"
        >
          <app-icon name="inbox" [size]="16"></app-icon> Kelib Tushgan Arizalar
          @if (pendingCount() > 0) {
            <span class="tab-badge-pulse">{{ pendingCount() }}</span>
          }
        </button>

        <button 
          type="button" 
          class="tab-nav-item" 
          [class.active]="activeTab === 'card'" 
          (click)="activeTab = 'card'"
        >
          <app-icon name="credit-card" [size]="16"></app-icon> Karta Rekvizitlari Sozlamasi
        </button>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: SUBSCRIPTION REQUESTS TABLE -->
      <!-- ======================================================== -->
      @if (activeTab === 'requests') {
        <div class="card content-card">
          <!-- FILTER BAR -->
          <div class="table-toolbar">
            <div class="filter-pills">
              <button 
                type="button" 
                class="filter-pill" 
                [class.active]="statusFilter === 'ALL'" 
                (click)="setStatusFilter('ALL')"
              >
                Barchasi ({{ requests().length }})
              </button>
              <button 
                type="button" 
                class="filter-pill pill-pending" 
                [class.active]="statusFilter === 'PENDING_APPROVAL'" 
                (click)="setStatusFilter('PENDING_APPROVAL')"
              >
                Kutilayotgan ({{ pendingCount() }})
              </button>
              <button 
                type="button" 
                class="filter-pill pill-approved" 
                [class.active]="statusFilter === 'APPROVED'" 
                (click)="setStatusFilter('APPROVED')"
              >
                Faollashtirilgan
              </button>
              <button 
                type="button" 
                class="filter-pill pill-rejected" 
                [class.active]="statusFilter === 'REJECTED'" 
                (click)="setStatusFilter('REJECTED')"
              >
                Rad etilgan
              </button>
            </div>

            <div class="search-box">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Restoran nomi yoki kodi bo'yicha..." 
                class="form-control-sm"
              />
            </div>
          </div>

          <!-- TABLE -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Arizalar yuklanmoqda...</p>
            </div>
          } @else if (filteredRequests().length === 0) {
            <div class="empty-state">
              <span class="empty-icon"><app-icon name="inbox" [size]="48"></app-icon></span>
              <p>Hozircha hech qanday ariza mavjud emas.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="styled-table">
                <thead>
                  <tr>
                    <th>Restoran</th>
                    <th>Tanlangan Tarif</th>
                    <th>Muddat</th>
                    <th>Summa</th>
                    <th>To'lov Cheki</th>
                    <th>Yuborilgan Vaqti</th>
                    <th>Holati</th>
                    <th class="text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of filteredRequests(); track req.id) {
                    <tr [class.highlight-row]="req.status === 'PENDING_APPROVAL'">
                      <td>
                        <div class="restaurant-cell">
                          <strong class="rest-name">{{ req.tenantName }}</strong>
                          <span class="rest-code">{{ req.tenantCode }}</span>
                        </div>
                        @if (req.clientNotes) {
                          <div class="client-notes-tip" [title]="req.clientNotes">
                            <app-icon name="message-square" [size]="14"></app-icon> "{{ req.clientNotes }}"
                          </div>
                        }
                      </td>
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
                          <span class="no-receipt">Chek yo'q</span>
                        }
                      </td>
                      <td>
                        <span class="date-text">{{ formatDate(req.createdAt) }}</span>
                      </td>
                      <td>
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(req.status)">
                          {{ getStatusLabel(req.status) }}
                        </span>
                        @if (req.status === 'REJECTED' && req.rejectionReason) {
                          <div class="reject-reason-sub">Sabab: {{ req.rejectionReason }}</div>
                        }
                      </td>
                      <td class="text-right">
                        @if (req.status === 'PENDING_APPROVAL') {
                          <div class="actions-group">
                            <button 
                              type="button" 
                              class="btn-action btn-approve"
                              [disabled]="actionLoading() === req.id"
                              (click)="approveRequest(req)"
                              title="Obunani darhol faollashtirish"
                            >
                              @if (actionLoading() === req.id) {
                                <span class="btn-spinner"></span>
                              } @else {
                                <span><app-icon name="check" [size]="14"></app-icon> Faollashtirish</span>
                              }
                            </button>

                            <button 
                              type="button" 
                              class="btn-action btn-reject"
                              [disabled]="actionLoading() === req.id"
                              (click)="openRejectModal(req)"
                              title="Arizani rad etish"
                            >
                              <app-icon name="x" [size]="14"></app-icon> Rad etish
                            </button>
                          </div>
                        } @else if (req.status === 'APPROVED') {
                          <span class="approved-check"><app-icon name="check" [size]="14"></app-icon> Faollashtirilgan</span>
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
      <!-- TAB 2: PAYMENT CARD SETTINGS -->
      <!-- ======================================================== -->
      @if (activeTab === 'card') {
        <div class="card-settings-layout">
          <!-- LEFT: FORM -->
          <div class="card form-card">
            <div class="card-header-simple">
              <h2 class="form-title">To'lov Qabul Qilish Kartasi Sozlamalari</h2>
              <p class="form-subtitle">
                Ushbu rekvizitlar barcha restoranlarning obuna to'lov sahifasida darhol ko'rinadi
              </p>
            </div>

            <form (ngSubmit)="saveCardSettings()">
              <div class="form-group">
                <label class="field-label" for="cardNumber">
                  Karta Raqami: <span class="required">*</span>
                </label>
                <div class="input-with-icon">
                  <span class="input-icon"><app-icon name="credit-card" [size]="16"></app-icon></span>
                  <input 
                    id="cardNumber"
                    type="text" 
                    [(ngModel)]="cardForm.cardNumber" 
                    name="cardNumber"
                    placeholder="8600 0000 0000 0000" 
                    class="form-control field-input"
                    maxlength="24"
                    required
                  />
                </div>
                <small class="field-hint">Humo, Uzcard yoki xalqaro karta raqamini kiriting</small>
              </div>

              <div class="form-group">
                <label class="field-label" for="cardHolder">
                  Karta Egasining To'liq Ismi: <span class="required">*</span>
                </label>
                <div class="input-with-icon">
                  <span class="input-icon"><app-icon name="user" [size]="16"></app-icon></span>
                  <input 
                    id="cardHolder"
                    type="text" 
                    [(ngModel)]="cardForm.cardHolder" 
                    name="cardHolder"
                    placeholder="Masalan: ALIYEV VALI" 
                    class="form-control field-input"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="field-label" for="bankName">
                  Bank Nomi: <span class="required">*</span>
                </label>
                <div class="input-with-icon">
                  <span class="input-icon"><app-icon name="building" [size]="16"></app-icon></span>
                  <input 
                    id="bankName"
                    type="text" 
                    [(ngModel)]="cardForm.bankName" 
                    name="bankName"
                    placeholder="Masalan: Kapitalbank / Ipoteka Bank" 
                    class="form-control field-input"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="field-label" for="instructions">
                  Qo'shimcha Ko'rsatma / To'lov Izohi:
                </label>
                <textarea 
                  id="instructions"
                  [(ngModel)]="cardForm.instructions" 
                  name="instructions"
                  rows="3" 
                  placeholder="Masalan: Iltimos, to'lov izohiga restoraningiz nomini yozing va chekni yuklang." 
                  class="form-control field-textarea"
                ></textarea>
                <small class="field-hint">Restoran adminlari to'lov qilishda ushbu eslatmani ko'radi</small>
              </div>

              <div class="form-action-row">
                <button 
                  type="submit" 
                  class="btn btn-save" 
                  [disabled]="savingCard() || !cardForm.cardNumber || !cardForm.cardHolder"
                >
                  @if (savingCard()) {
                    <span class="btn-spinner"></span>
                    <span>Saqlanmoqda...</span>
                  } @else {
                    <span><app-icon name="save" [size]="14"></app-icon> Rekvizitlarni Saqlash</span>
                  }
                </button>

                @if (cardSavedSuccess()) {
                  <span class="save-success-msg"><app-icon name="check" [size]="14"></app-icon> Rekvizitlar muvaffaqiyatli saqlandi!</span>
                }
              </div>
            </form>
          </div>

          <!-- RIGHT: LIVE CARD PREVIEW -->
          <div class="preview-card-col">
            <div class="preview-header">
              <span class="preview-badge">JONLI KO'RINISH (PREVIEW)</span>
              <p class="preview-hint">Restoranlar ekranda ushbu kartani ko'radi</p>
            </div>

            <!-- MOCKUP -->
            <div class="credit-card-mockup">
              <div class="card-bg-glow"></div>
              
              <div class="card-top-row">
                <div class="bank-brand-title">{{ cardForm.bankName || 'BANK NOMI' }}</div>
                <div class="contactless-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>

              <div class="card-chip">
                <div class="chip-line"></div>
                <div class="chip-line"></div>
              </div>

              <div class="card-number-wrapper">
                <div class="card-number">{{ formatCardNumber(cardForm.cardNumber) }}</div>
                <button type="button" class="btn-copy-dummy" title="Nusxalash namunasi">
                  <app-icon name="clipboard" [size]="14"></app-icon> Nusxa olish
                </button>
              </div>

              <div class="card-bottom-row">
                <div class="card-holder-col">
                  <span class="holder-label">KARTA EGASI</span>
                  <span class="holder-name">{{ cardForm.cardHolder || 'FAMILIYA ISM' }}</span>
                </div>
                <div class="payment-system-tag">
                  <span class="sys-text">HUMO / UZCARD</span>
                </div>
              </div>
            </div>

            <!-- INSTRUCTIONS PREVIEW -->
            <div class="inst-preview-box">
              <div class="inst-icon"><app-icon name="info" [size]="20"></app-icon></div>
              <div class="inst-text">
                <strong>Ko'rinadigan izoh:</strong>
                {{ cardForm.instructions || 'To‘lov qilgach, chek skrinshotini biriktiring.' }}
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- MODAL 1: RECEIPT IMAGE LIGHTBOX -->
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

      <!-- ======================================================== -->
      <!-- MODAL 2: REJECT REASON MODAL -->
      <!-- ======================================================== -->
      @if (rejectModalTarget()) {
        <div class="modal-backdrop">
          <div class="modal-card reject-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Arizani Rad Etish</h3>
              <button type="button" class="btn-close-modal" (click)="closeRejectModal()"><app-icon name="x" [size]="18"></app-icon></button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">
                Restoran: <strong>{{ rejectModalTarget()!.tenantName }}</strong><br>
                Tarif: <strong>{{ rejectModalTarget()!.planName }}</strong> ({{ formatPrice(rejectModalTarget()!.amount) }} UZS)
              </p>
              <div class="form-group">
                <label class="field-label">Rad etish sababi:</label>
                <textarea 
                  [(ngModel)]="rejectReason" 
                  rows="3" 
                  placeholder="Masalan: To'lov cheki aniq emas yoki mablag' hisobga tushmadi" 
                  class="form-control"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeRejectModal()">
                Bekor qilish
              </button>
              <button 
                type="button" 
                class="btn btn-danger" 
                [disabled]="!rejectReason.trim()" 
                (click)="confirmReject()"
              >
                <app-icon name="x" [size]="14"></app-icon> Rad etishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .platform-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem 1rem;
      color: var(--text-color, #1f2937);
      font-family: inherit;
    }

    .page-header {
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

    .btn-refresh {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    /* TABS NAV */
    .tabs-nav-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }

    .tab-nav-item {
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

    .tab-nav-item:hover {
      color: #1e293b;
    }

    .tab-nav-item.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .tab-badge-pulse {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 9999px;
      padding: 0.15rem 0.5rem;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .card {
      background: #ffffff;
      border-radius: 1.25rem;
      border: 1px solid rgba(229, 231, 235, 0.8);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      padding: 1.5rem;
    }

    /* TABLE TOOLBAR */
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .filter-pills {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.825rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-pill:hover {
      background: #e2e8f0;
    }

    .filter-pill.active {
      background: #4f46e5;
      color: white;
      border-color: #4f46e5;
    }

    .form-control-sm {
      border: 1.5px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
      outline: none;
      min-width: 250px;
    }

    .form-control-sm:focus {
      border-color: #4f46e5;
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

    .restaurant-cell {
      display: flex;
      flex-direction: column;
    }

    .rest-name {
      font-weight: 700;
      color: #0f172a;
    }

    .rest-code {
      font-size: 0.75rem;
      color: #64748b;
    }

    .client-notes-tip {
      font-size: 0.75rem;
      color: #0284c7;
      font-style: italic;
      margin-top: 0.2rem;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .no-receipt {
      color: #94a3b8;
      font-size: 0.8rem;
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

    .reject-reason-sub {
      font-size: 0.7rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .actions-group {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .btn-action {
      border: none;
      border-radius: 6px;
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s;
    }

    .btn-approve {
      background: #10b981;
      color: white;
    }

    .btn-approve:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }

    .btn-reject {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-reject:hover:not(:disabled) {
      background: #fecaca;
    }

    .approved-check {
      color: #059669;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .text-right {
      text-align: right;
    }

    /* CARD SETTINGS LAYOUT */
    .card-settings-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .card-settings-layout {
        grid-template-columns: 1fr;
      }
    }

    .form-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .form-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 1.25rem 0;
    }

    .form-group {
      margin-bottom: 1.15rem;
    }

    .field-label {
      display: block;
      font-size: 0.825rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.35rem;
    }

    .required {
      color: #ef4444;
    }

    .input-with-icon {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
      pointer-events: none;
    }

    .field-input {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.65rem;
      padding: 0.65rem 0.85rem 0.65rem 2.4rem;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }

    .field-input:focus, .field-textarea:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }

    .field-textarea {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.65rem;
      padding: 0.65rem 0.85rem;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }

    .field-hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    .form-action-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-save {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 0.65rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      transition: all 0.2s;
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
    }

    .save-success-msg {
      color: #059669;
      font-weight: 700;
      font-size: 0.875rem;
    }

    /* PREVIEW CARD COL */
    .preview-card-col {
      padding: 0.5rem;
    }

    .preview-header {
      margin-bottom: 1rem;
    }

    .preview-badge {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      background: #e0e7ff;
      color: #4338ca;
    }

    .preview-hint {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0.35rem 0 0 0;
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

    .btn-copy-dummy {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      pointer-events: none;
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

    .inst-preview-box {
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

    .modal-body {
      padding: 1.25rem;
    }

    .modal-desc {
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
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

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-outline-primary {
      background: transparent;
      border: 1px solid #4f46e5;
      color: #4f46e5;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PlatformSubscriptionsComponent implements OnInit {
  private billingService = inject(BillingService);

  activeTab: 'requests' | 'card' = 'requests';
  statusFilter: string = 'ALL';
  searchQuery: string = '';

  requests = signal<SubscriptionRequestResponse[]>([]);
  loading = signal<boolean>(false);
  actionLoading = signal<string | null>(null);

  // Card settings
  cardForm: PaymentCardSettings = {
    cardNumber: '8600 0000 0000 0000',
    cardHolder: 'Platform Administrator',
    bankName: 'Kapitalbank',
    instructions: 'Iltimos, to\'lov izohiga restoraningiz nomini yozing.'
  };
  savingCard = signal<boolean>(false);
  cardSavedSuccess = signal<boolean>(false);

  // Modals
  activeReceiptModal = signal<string | null>(null);
  rejectModalTarget = signal<SubscriptionRequestResponse | null>(null);
  rejectReason: string = '';

  pendingCount = computed(() => {
    return this.requests().filter(r => r.status === 'PENDING_APPROVAL').length;
  });

  filteredRequests = computed(() => {
    let list = this.requests();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(r => r.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.tenantName && r.tenantName.toLowerCase().includes(q)) ||
        (r.tenantCode && r.tenantCode.toLowerCase().includes(q)) ||
        (r.planName && r.planName.toLowerCase().includes(q))
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadRequests();
    this.loadCardSettings();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.billingService.getAllSubscriptionRequests().subscribe({
      next: (data) => {
        this.requests.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadCardSettings(): void {
    this.billingService.getPlatformPaymentCard().subscribe({
      next: (card) => {
        if (card) {
          this.cardForm = {
            cardNumber: card.cardNumber || '',
            cardHolder: card.cardHolder || '',
            bankName: card.bankName || '',
            instructions: card.instructions || ''
          };
        }
      },
      error: () => {}
    });
  }

  saveCardSettings(): void {
    if (!this.cardForm.cardNumber || !this.cardForm.cardHolder) return;
    this.savingCard.set(true);
    this.cardSavedSuccess.set(false);

    this.billingService.updatePlatformPaymentCard(this.cardForm).subscribe({
      next: (updated) => {
        this.savingCard.set(false);
        this.cardSavedSuccess.set(true);
        setTimeout(() => this.cardSavedSuccess.set(false), 3000);
      },
      error: () => {
        this.savingCard.set(false);
        alert('Sozlamalarni saqlashda xatolik!');
      }
    });
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
  }

  approveRequest(req: SubscriptionRequestResponse): void {
    if (!confirm(`${req.tenantName} restoranining ${req.planName} obunasini (${req.durationMonths} oy) faollashtirishni tasdiqlaysizmi?`)) {
      return;
    }

    this.actionLoading.set(req.id);
    this.billingService.approveSubscriptionRequest(req.id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.loadRequests();
      },
      error: (err) => {
        this.actionLoading.set(null);
        alert(err?.error?.message || 'Faollashtirishda xatolik yuz berdi!');
      }
    });
  }

  openRejectModal(req: SubscriptionRequestResponse): void {
    this.rejectModalTarget.set(req);
    this.rejectReason = 'To\'lov cheki tasdiqlanmadi';
  }

  closeRejectModal(): void {
    this.rejectModalTarget.set(null);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const target = this.rejectModalTarget();
    if (!target) return;

    this.actionLoading.set(target.id);
    this.billingService.rejectSubscriptionRequest(target.id, { reason: this.rejectReason.trim() }).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.closeRejectModal();
        this.loadRequests();
      },
      error: (err) => {
        this.actionLoading.set(null);
        alert(err?.error?.message || 'Rad etishda xatolik yuz berdi!');
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
}
