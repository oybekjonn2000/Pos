import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService, RestaurantTable, TableZone } from '../../../core/services/table.service';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-move-table-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick()">
        <div class="move-modal-card" (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-title-group">
              <div class="title-icon-badge">
                <app-icon name="arrow-right" [size]="20"></app-icon>
              </div>
              <div>
                <h3 class="modal-title">Stolni ko‘chirish</h3>
                <p class="modal-subtitle">Aktiv buyurtmani boshqa zal yoki stolga ko‘chirish</p>
              </div>
            </div>
            <button type="button" class="btn-close-modal" (click)="onClose()" title="Yopish">
              <app-icon name="close" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            
            <!-- Step 1: Selection View -->
            @if (!showConfirmStep()) {
              <!-- Current Order Info Card -->
              <div class="current-info-card">
                <div class="current-info-row">
                  <div class="info-block">
                    <span class="info-label">Hozirgi joy:</span>
                    <strong class="info-value text-accent">
                      <app-icon name="hall" [size]="14"></app-icon>
                      {{ order?.zoneName || 'Aniqlanmagan zal' }}
                    </strong>
                  </div>
                  <div class="info-block">
                    <span class="info-label">Hozirgi stol:</span>
                    <strong class="info-value">
                      <app-icon name="table" [size]="14"></app-icon>
                      {{ order?.tableName || ('Stol ' + (order?.tableNumber || '?')) }}
                    </strong>
                  </div>
                </div>

                <div class="current-info-row info-row--sub">
                  <div class="info-block">
                    <span class="info-label">Buyurtma:</span>
                    <span class="order-badge">#{{ order?.orderNumber || 'ORD' }}</span>
                  </div>
                  <div class="info-block">
                    <span class="info-label">Jami summa:</span>
                    <strong class="order-total-sum">{{ formatPrice(getOrderTotal()) }}</strong>
                  </div>
                  @if (order?.waiterName) {
                    <div class="info-block">
                      <span class="info-label">Ofitsiant:</span>
                      <span class="waiter-name">{{ order?.waiterName }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Target Zone Selector -->
              <div class="form-section">
                <label class="section-label">
                  <app-icon name="map-pin" [size]="15"></app-icon>
                  Yangi joyni (zalni) tanlang:
                </label>
                <div class="zone-tabs-list">
                  @for (z of zones(); track z.id) {
                    <button
                      type="button"
                      class="zone-tab-btn"
                      [class.active]="selectedZoneId() === z.id"
                      (click)="selectZone(z.id)">
                      <span class="zone-tab-name">{{ z.name }}</span>
                      <span class="zone-free-count" title="Bo‘sh stollar soni">
                        {{ getFreeCountInZone(z.id) }} ta bo‘sh
                      </span>
                    </button>
                  }
                </div>
              </div>

              <!-- Target Tables Grid -->
              <div class="form-section">
                <div class="section-header-inline">
                  <label class="section-label">
                    <app-icon name="layout" [size]="15"></app-icon>
                    Yangi bo‘sh stolni tanlang:
                  </label>
                  <span class="tables-hint">Faqat <strong>BO‘SH</strong> stollar tanlanadi</span>
                </div>

                @if (loading()) {
                  <div class="loading-state">
                    <span class="spinner-sm"></span>
                    <span>Stollar yuklanmoqda...</span>
                  </div>
                } @else if (filteredTables().length === 0) {
                  <div class="empty-tables-alert">
                    <app-icon name="alert-triangle" [size]="18"></app-icon>
                    <span>Ushbu zalda stollar mavjud emas.</span>
                  </div>
                } @else {
                  <div class="target-tables-grid">
                    @for (t of filteredTables(); track t.id) {
                      @let isCurrent = t.id === order?.tableId;
                      @let isFree = t.status === 'FREE' && t.active && !isCurrent;
                      @let isSelected = selectedTableId() === t.id;

                      <div
                        class="target-table-card"
                        [class.table-card--free]="isFree"
                        [class.table-card--selected]="isSelected"
                        [class.table-card--occupied]="t.status === 'OCCUPIED'"
                        [class.table-card--reserved]="t.status === 'RESERVED'"
                        [class.table-card--current]="isCurrent"
                        [class.table-card--disabled]="!isFree"
                        (click)="selectTable(t)">
                        
                        <div class="t-card-header">
                          <span class="t-card-num">#{{ t.tableNumber }}</span>
                          
                          @if (isCurrent) {
                            <span class="status-chip chip--current">HOZIRGI</span>
                          } @else if (t.status === 'FREE') {
                            <span class="status-chip chip--free">BO‘SH</span>
                          } @else if (t.status === 'OCCUPIED') {
                            <span class="status-chip chip--occupied">BAND</span>
                          } @else if (t.status === 'RESERVED') {
                            <span class="status-chip chip--reserved">REZERV</span>
                          } @else {
                            <span class="status-chip chip--inactive">NOFAOL</span>
                          }
                        </div>

                        <div class="t-card-name">{{ t.name }}</div>

                        <div class="t-card-meta">
                          <span class="t-card-cap">
                            <app-icon name="user" [size]="11"></app-icon>
                            {{ t.capacity }} kishilik
                          </span>
                          @if (isSelected) {
                            <span class="t-card-check">
                              <app-icon name="check" [size]="14"></app-icon> Tanlandi
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Reason Input -->
              <div class="form-section">
                <label class="section-label">
                  <app-icon name="file-text" [size]="15"></app-icon>
                  Ko‘chirish sababi (Ixtiyoriy):
                </label>
                <div class="quick-reason-chips">
                  @for (r of quickReasons; track r) {
                    <button
                      type="button"
                      class="reason-chip"
                      [class.active]="reason === r"
                      (click)="reason = r">
                      {{ r }}
                    </button>
                  }
                </div>
                <input
                  type="text"
                  [(ngModel)]="reason"
                  class="pos-input reason-input"
                  placeholder="Masalan: Mijoz so‘rovi, xona sovuq, katta stol kerak..."
                />
              </div>
            }

            <!-- Step 2: Confirmation View -->
            @if (showConfirmStep()) {
              <div class="confirm-view-wrap">
                <div class="confirm-alert-header">
                  <app-icon name="alert-triangle" [size]="28" class="icon--warning"></app-icon>
                  <h4>Buyurtmani ko‘chirishni tasdiqlaysizmi?</h4>
                  <p>Mavjud barcha mahsulotlar va buyurtma summasi yangi stolga to‘liq o‘tkaziladi.</p>
                </div>

                <div class="move-visual-route">
                  <!-- From Box -->
                  <div class="route-box from-box">
                    <span class="route-tag">ESKI JOY</span>
                    <strong class="route-zone">{{ order?.zoneName || 'Eski zal' }}</strong>
                    <div class="route-table">
                      {{ order?.tableName || ('Stol ' + (order?.tableNumber || '?')) }}
                    </div>
                  </div>

                  <!-- Arrow -->
                  <div class="route-arrow">
                    <app-icon name="arrow-right" [size]="28"></app-icon>
                  </div>

                  <!-- To Box -->
                  <div class="route-box to-box">
                    <span class="route-tag">YANGI JOY</span>
                    <strong class="route-zone">{{ targetZone()?.name || 'Yangi zal' }}</strong>
                    <div class="route-table">
                      {{ targetTable()?.name || ('Stol ' + (targetTable()?.tableNumber || '?')) }}
                    </div>
                  </div>
                </div>

                <div class="confirm-summary-card">
                  <div class="summary-line">
                    <span>Buyurtma raqami:</span>
                    <strong>#{{ order?.orderNumber }}</strong>
                  </div>
                  <div class="summary-line">
                    <span>Jami summa:</span>
                    <strong class="text-success">{{ formatPrice(getOrderTotal()) }}</strong>
                  </div>
                  @if (order?.waiterName) {
                    <div class="summary-line">
                      <span>Biriktirilgan ofitsiant:</span>
                      <strong>{{ order?.waiterName }} (o‘zgarmaydi)</strong>
                    </div>
                  }
                  <div class="summary-line">
                    <span>Ko‘chirish sababi:</span>
                    <em>{{ reason || 'Mijoz so‘rovi' }}</em>
                  </div>
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            @if (!showConfirmStep()) {
              <button type="button" class="btn btn--secondary" (click)="onClose()" [disabled]="submitting()">
                Bekor qilish
              </button>
              <button
                type="button"
                class="btn btn--primary"
                [disabled]="!selectedTableId() || submitting()"
                (click)="proceedToConfirm()">
                <app-icon name="arrow-right" [size]="16"></app-icon>
                <span>Davom etish (Ko‘chirish)</span>
              </button>
            } @else {
              <button type="button" class="btn btn--secondary" (click)="showConfirmStep.set(false)" [disabled]="submitting()">
                <app-icon name="arrow-left" [size]="14"></app-icon>
                <span>Orqaga</span>
              </button>
              <button
                type="button"
                class="btn btn--success"
                [disabled]="submitting()"
                (click)="executeMove()">
                @if (submitting()) {
                  <span class="spinner-sm"></span>
                  <span>Ko‘chirilmoqda...</span>
                } @else {
                  <app-icon name="check" [size]="16"></app-icon>
                  <span>Tasdiqlash va Ko‘chirish</span>
                }
              </button>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 16px;
      animation: fadeIn 0.18s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }

    .move-modal-card {
      background: var(--bg-card, #ffffff);
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 16px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg, 0 20px 48px rgba(0, 0, 0, 0.16));
      color: var(--text-primary, #0f172a);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1.5px solid var(--border, #e2e8f0);
      background: var(--bg-tertiary, #f8fafc);
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--primary, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      color: var(--text-primary, #0f172a);
    }

    .modal-subtitle {
      font-size: 12.5px;
      color: var(--text-muted, #64748b);
      margin: 2px 0 0;
    }

    .btn-close-modal {
      background: transparent;
      border: none;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-primary, #0f172a);
      }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 18px;
      background: var(--bg-card, #ffffff);
    }

    /* Current Info Card */
    .current-info-card {
      background: rgba(99, 102, 241, 0.05);
      border: 1.5px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .current-info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      &.info-row--sub {
        padding-top: 8px;
        border-top: 1px solid rgba(99, 102, 241, 0.12);
      }
    }

    .info-block {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .info-label {
      color: var(--text-muted, #64748b);
      font-size: 12.5px;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      display: inline-flex;
      align-items: center;
      gap: 5px;

      &.text-accent {
        color: var(--primary, #4f46e5);
      }
    }

    .order-badge {
      background: var(--bg-hover, #e2e8f0);
      color: var(--text-primary, #0f172a);
      border: 1px solid var(--border-light, #cbd5e1);
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      font-family: monospace;
    }

    .order-total-sum {
      color: #059669;
      font-size: 15px;
      font-weight: 800;

      [data-theme="dark"] & {
        color: #10b981;
      }
    }

    .waiter-name {
      color: var(--text-primary, #0f172a);
      font-weight: 700;
    }

    /* Section Styles */
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-label {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-header-inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tables-hint {
      font-size: 11.5px;
      color: var(--text-muted, #64748b);
    }

    /* Zone Tabs */
    .zone-tabs-list {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .zone-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      background: var(--bg-tertiary, #f8fafc);
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 8px;
      padding: 8px 14px;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;

      &:hover {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-primary, #0f172a);
        border-color: #cbd5e1;
      }

      &.active {
        background: rgba(99, 102, 241, 0.1);
        border-color: var(--primary, #4f46e5);
        color: var(--primary, #4f46e5);

        .zone-tab-name {
          color: var(--primary, #4f46e5);
          font-weight: 700;
        }

        .zone-free-count {
          color: #059669;
          font-weight: 700;

          [data-theme="dark"] & {
            color: #10b981;
          }
        }
      }
    }

    .zone-tab-name {
      font-size: 13px;
      font-weight: 600;
    }

    .zone-free-count {
      font-size: 11px;
      color: var(--text-muted, #64748b);
    }

    /* Target Tables Grid */
    .target-tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      max-height: 220px;
      overflow-y: auto;
      padding: 4px 2px;
    }

    .target-table-card {
      background: var(--bg-card, #ffffff);
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.15s;
      position: relative;
      cursor: pointer;
      color: var(--text-primary, #0f172a);

      &.table-card--free {
        border-color: #86efac;
        background: #f0fdf4;
        color: #14532d;

        [data-theme="dark"] & {
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.08);
          color: #a7f3d0;
        }

        &:hover {
          border-color: #10b981;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.22);
        }
      }

      &.table-card--selected {
        border-color: #10b981 !important;
        background: #ecfdf5 !important;
        box-shadow: 0 0 0 2px #10b981 !important;

        [data-theme="dark"] & {
          background: rgba(16, 185, 129, 0.22) !important;
        }
      }

      &.table-card--occupied {
        background: #fef2f2;
        border-color: #fecaca;
        color: #991b1b;
        opacity: 0.72;
        cursor: not-allowed;
        border-style: dashed;

        [data-theme="dark"] & {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }

        &:hover { transform: none; }
      }

      &.table-card--reserved {
        background: #faf5ff;
        border-color: #e9d5ff;
        color: #6b21a8;
        opacity: 0.72;
        cursor: not-allowed;
        border-style: dashed;

        [data-theme="dark"] & {
          background: rgba(168, 85, 247, 0.08);
          border-color: rgba(168, 85, 247, 0.25);
          color: #d8b4fe;
        }

        &:hover { transform: none; }
      }

      &.table-card--current {
        background: rgba(99, 102, 241, 0.08);
        border-color: var(--primary, #6366f1);
        color: var(--primary, #4f46e5);
        opacity: 0.75;
        cursor: not-allowed;
        border-style: dashed;
        &:hover { transform: none; }
      }

      &.table-card--disabled {
        background: var(--bg-hover, #f1f5f9);
        border-color: var(--border, #cbd5e1);
        color: var(--text-muted, #64748b);
        opacity: 0.55;
        cursor: not-allowed;
        border-style: dashed;
        &:hover { transform: none; }
      }
    }

    .t-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    .t-card-num {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      font-family: monospace;
    }

    .status-chip {
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;

      &.chip--free {
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #86efac;

        [data-theme="dark"] & {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.4);
        }
      }

      &.chip--occupied {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;

        [data-theme="dark"] & {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.4);
        }
      }

      &.chip--reserved {
        background: #f3e8ff;
        color: #7e22ce;
        border: 1px solid #d8b4fe;

        [data-theme="dark"] & {
          background: rgba(168, 85, 247, 0.2);
          color: #c084fc;
          border-color: rgba(168, 85, 247, 0.4);
        }
      }

      &.chip--current {
        background: rgba(99, 102, 241, 0.15);
        color: var(--primary, #4f46e5);
        border: 1px solid rgba(99, 102, 241, 0.35);
      }

      &.chip--inactive {
        background: #e2e8f0;
        color: #475569;
        border: 1px solid #cbd5e1;
      }
    }

    .t-card-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #334155);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .t-card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted, #64748b);
      margin-top: 2px;
    }

    .t-card-check {
      color: #059669;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 2px;

      [data-theme="dark"] & {
        color: #10b981;
      }
    }

    /* Reasons */
    .quick-reason-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .reason-chip {
      background: var(--bg-tertiary, #f8fafc);
      border: 1px solid var(--border, #cbd5e1);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11.5px;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-primary, #0f172a);
        border-color: #94a3b8;
      }

      &.active {
        background: rgba(99, 102, 241, 0.12);
        border-color: var(--primary, #4f46e5);
        color: var(--primary, #4f46e5);
        font-weight: 700;
      }
    }

    .pos-input {
      background: var(--bg-secondary, #ffffff);
      border: 1.5px solid var(--border, #cbd5e1);
      border-radius: 8px;
      padding: 9px 12px;
      color: var(--text-primary, #0f172a);
      font-size: 13.5px;
      width: 100%;
      box-sizing: border-box;

      &:focus {
        border-color: var(--primary, #4f46e5);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        outline: none;
      }
    }

    /* Step 2: Confirm View */
    .confirm-view-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.2s ease-out;
    }

    .confirm-alert-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .icon--warning {
        color: #d97706;
      }

      h4 {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        color: var(--text-primary, #0f172a);
      }

      p {
        margin: 0;
        font-size: 12.5px;
        color: var(--text-secondary, #64748b);
      }
    }

    .move-visual-route {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 16px;
      background: var(--bg-tertiary, #f8fafc);
      border-radius: 12px;
      border: 1.5px solid var(--border, #e2e8f0);
    }

    .route-box {
      flex: 1;
      max-width: 200px;
      padding: 12px;
      border-radius: 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;

      &.from-box {
        background: #fef2f2;
        border: 1.5px solid #fca5a5;

        [data-theme="dark"] & {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
        }

        .route-tag {
          color: #dc2626;
        }
      }

      &.to-box {
        background: #ecfdf5;
        border: 1.5px solid #86efac;

        [data-theme="dark"] & {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
        }

        .route-tag {
          color: #059669;
        }
      }
    }

    .route-tag {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .route-zone {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-secondary, #475569);
    }

    .route-table {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
    }

    .route-arrow {
      color: var(--primary, #4f46e5);
      display: flex;
      align-items: center;
    }

    .confirm-summary-card {
      background: var(--bg-tertiary, #f8fafc);
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .summary-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-secondary, #475569);

      strong {
        color: var(--text-primary, #0f172a);
      }

      .text-success {
        color: #059669;
        font-weight: 800;
        font-size: 14px;

        [data-theme="dark"] & {
          color: #10b981;
        }
      }
    }

    /* Modal Footer */
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1.5px solid var(--border, #e2e8f0);
      background: var(--bg-tertiary, #f8fafc);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &--secondary {
        background: var(--bg-card, #ffffff);
        color: var(--text-primary, #0f172a);
        border: 1.5px solid var(--border, #cbd5e1);

        &:hover:not(:disabled) {
          background: var(--bg-hover, #f1f5f9);
          border-color: #94a3b8;
        }
      }

      &--primary {
        background: var(--primary, #4f46e5);
        color: #ffffff;

        &:hover:not(:disabled) {
          background: var(--primary-dark, #4338ca);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
      }

      &--success {
        background: #059669;
        color: #ffffff;

        &:hover:not(:disabled) {
          background: #047857;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }
      }
    }

    .loading-state,
    .empty-tables-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-radius: 8px;
      background: var(--bg-tertiary, #f8fafc);
      border: 1px solid var(--border, #e2e8f0);
      font-size: 13px;
      color: var(--text-secondary, #475569);
    }

    .empty-tables-alert {
      color: #b45309;
      background: #fffbeb;
      border-color: #fde68a;

      [data-theme="dark"] & {
        color: #fbbf24;
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
      }
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class MoveTableModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() order: any = null;

  @Output() closed = new EventEmitter<void>();
  @Output() moved = new EventEmitter<any>();

  private tableService = inject(TableService);
  private orderService = inject(OrderService);
  private notify = inject(NotificationService);

  readonly zones = signal<TableZone[]>([]);
  readonly tables = signal<RestaurantTable[]>([]);
  readonly selectedZoneId = signal<string>('');
  readonly selectedTableId = signal<string>('');
  readonly showConfirmStep = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  reason = 'Mijoz so‘rovi';
  readonly quickReasons = [
    'Mijoz so‘rovi',
    'Xona sovuq/issiq',
    'Katta stol kerak',
    'Tashqi zalga ko‘chish'
  ];

  readonly filteredTables = computed(() => {
    const zid = this.selectedZoneId();
    if (!zid) return this.tables();
    return this.tables().filter(t => t.zoneId === zid);
  });

  readonly targetTable = computed(() => {
    const tid = this.selectedTableId();
    return this.tables().find(t => t.id === tid) || null;
  });

  readonly targetZone = computed(() => {
    const zid = this.selectedZoneId();
    return this.zones().find(z => z.id === zid) || null;
  });

  ngOnInit(): void {
    if (this.isOpen) {
      this.initData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initData();
    }
  }

  private initData(): void {
    this.showConfirmStep.set(false);
    this.selectedTableId.set('');
    this.reason = 'Mijoz so‘rovi';
    this.loading.set(true);

    this.tableService.getZones().subscribe({
      next: (res) => {
        if (res.data) {
          this.zones.set(res.data);
          // Default zone to order's zone or first zone
          const initialZone = this.order?.zoneId && res.data.some(z => z.id === this.order.zoneId)
            ? this.order.zoneId
            : (res.data[0]?.id || '');
          this.selectedZoneId.set(initialZone);
        }
        this.loadTables();
      },
      error: (err) => {
        console.error('Failed to load zones:', err);
        this.loading.set(false);
      }
    });
  }

  loadTables(): void {
    this.tableService.getTables().subscribe({
      next: (res) => {
        if (res.data) {
          this.tables.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tables:', err);
        this.loading.set(false);
      }
    });
  }

  selectZone(zoneId: string): void {
    this.selectedZoneId.set(zoneId);
    this.selectedTableId.set('');
  }

  selectTable(table: RestaurantTable): void {
    // Only FREE tables that are not the current table can be selected
    if (table.id === this.order?.tableId) {
      this.notify.warning('Bu buyurtmaning hozirgi stoli!');
      return;
    }
    if (table.status !== 'FREE' || !table.active) {
      this.notify.warning(`№ ${table.tableNumber} stoli band yoki faol emas. Faqat BO‘SH stolni tanlang.`);
      return;
    }
    this.selectedTableId.set(table.id);
  }

  getFreeCountInZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId && t.status === 'FREE' && t.active && t.id !== this.order?.tableId).length;
  }

  getOrderTotal(): number {
    return this.order?.total || this.order?.totalAmount || this.order?.subtotal || 0;
  }

  formatPrice(val?: number): string {
    if (!val) return '0 so‘m';
    return val.toLocaleString('uz-UZ') + ' so‘m';
  }

  proceedToConfirm(): void {
    if (!this.selectedTableId()) {
      this.notify.warning('Iltimos, ko‘chirish uchun bo‘sh stolni tanlang!');
      return;
    }
    this.showConfirmStep.set(true);
  }

  executeMove(): void {
    if (!this.order?.id) {
      this.notify.error('Buyurtma ID topilmadi!');
      return;
    }
    const targetId = this.selectedTableId();
    if (!targetId) {
      this.notify.warning('Iltimos, yangi stolni tanlang!');
      return;
    }

    this.submitting.set(true);
    this.orderService.moveTable(this.order.id, {
      targetTableId: targetId,
      reason: this.reason?.trim() || 'Mijoz so‘rovi'
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        const tTable = this.targetTable();
        const tName = tTable?.name || ('Stol ' + (tTable?.tableNumber || ''));
        const zName = this.targetZone()?.name || '';
        this.notify.success(`№ ${this.order.orderNumber} buyurtma "${zName ? zName + ' — ' : ''}${tName}"ga muvaffaqiyatli ko‘chirildi!`);
        this.moved.emit(res.data);
        this.onClose();
      },
      error: (err) => {
        this.submitting.set(false);
        this.notify.error(err.error?.message || 'Stolni ko‘chirishda xatolik yuz berdi');
        this.showConfirmStep.set(false);
        this.loadTables();
      }
    });
  }

  onClose(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
