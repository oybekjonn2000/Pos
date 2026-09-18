import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { KitchenService, KitchenStation, KitchenOrderBatch, KitchenOrderBatchItem } from '../core/services/kitchen.service';
import { WebsocketService } from '../core/services/websocket.service';
import { NotificationService } from '../core/services/notification.service';

export interface KitchenTableItemSubDetail {
  id: string;
  batchId: string;
  orderId: string;
  orderNumber: string;
  batchNumber: number;
  quantity: number;
  status: 'NEW' | 'ACCEPTED' | 'COOKING' | 'PREPARING' | 'READY' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
  sentAt?: string;
  notes?: string;
}

export interface KitchenAggregatedProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  hasDistinctStatuses: boolean;
  subItems: KitchenTableItemSubDetail[];
  status: string;
  notes?: string;
}

export interface KitchenTableCard {
  cardKey: string;
  tableId?: string;
  tableName: string;
  orderId: string;
  orderNumber: string;
  waiterName?: string;
  kitchenName?: string;
  firstSentAt?: string;
  latestSentAt?: string;
  servedAt?: string;
  notes?: string;
  batches: KitchenOrderBatch[];
  products: KitchenAggregatedProduct[];
  hasNewItems: boolean;
  hasAcceptedItems: boolean;
  hasReadyItems: boolean;
  isAllServed: boolean;
  overallStatus: 'NEW' | 'ACCEPTED' | 'READY' | 'SERVED' | 'CANCELLED';
  activeAction: 'ACCEPT' | 'READY' | 'SERVE' | 'NONE';
}

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  template: `
    <div class="kds-container fade-in">
      <!-- Top Bar -->
      <div class="kds-header">
        <div class="kds-title-area">
          <div class="title-with-badge">
            <h1 class="kds-title">👨‍🍳 Oshxona Ekrani (KDS)</h1>
            <span class="pulse-indicator" *ngIf="countActiveCards() > 0">
              <span class="pulse-dot"></span>
              {{ countActiveCards() }} ta faol stol / joy
            </span>

            <!-- Real-time Connection Status Indicator -->
            <div
              class="realtime-status-pill"
              [class.connected]="wsService.connected()"
              [class.disconnected]="!wsService.connected()">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ wsService.connected() ? '● REAL-TIME ULANGAN' : '○ REAL-TIME UZILGAN' }}
              </span>
            </div>
          </div>
          <p class="kds-subtitle">
            <span *ngIf="selectedKitchen">Stansiya: <strong>{{ selectedKitchen.name }} ({{ selectedKitchen.code }})</strong> • </span>
            Har bir stol buyurtmalari yagona kartochka ichida jamlanadi va yangi qo'shilgan buyurtmalar avtomatik qo'shiladi
          </p>
        </div>

        <div class="kds-actions">
          <div class="kds-filters">
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'ALL'"
              (click)="setFilter('ALL')">
              Faol ({{ countActiveCards() }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'NEW'"
              (click)="setFilter('NEW')">
              Yangi ({{ countCardsByStatus('NEW') }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'ACCEPTED'"
              (click)="setFilter('ACCEPTED')">
              Qabul qilingan ({{ countCardsByStatus('ACCEPTED') }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'READY'"
              (click)="setFilter('READY')">
              Tayyor ({{ countCardsByStatus('READY') }})
            </button>
            <button
              class="filter-tab filter-tab--served"
              [class.active]="currentFilter === 'SERVED'"
              (click)="setFilter('SERVED')">
              Tarqatilgan ({{ countCardsByStatus('SERVED') }})
            </button>
          </div>
        </div>
      </div>

      <!-- KITCHEN STATIONS SELECTOR BAR -->
      <div class="stations-bar">
        <span class="stations-label">Oshxona Stansiyasi:</span>
        <div class="stations-strip">
          <button
            *ngIf="kitchens.length > 1"
            class="station-tab"
            [class.active]="selectedKitchen === null"
            (click)="selectKitchen(null)">
            <span class="station-icon">🍽️</span>
            <span class="station-name">Barchasi</span>
            <span class="station-code">BARCHA BIRIKTIRILGANLAR</span>
          </button>
          <button
            *ngFor="let k of kitchens"
            class="station-tab"
            [class.active]="selectedKitchen?.id === k.id"
            (click)="selectKitchen(k)">
            <span class="station-icon">{{ getKitchenIcon(k.code) }}</span>
            <span class="station-name">{{ k.name }}</span>
            <span class="station-code">{{ k.code }}</span>
          </button>
        </div>
      </div>

      <!-- TIME & DATE FILTER BAR -->
      <div class="time-filter-bar">
        <div class="time-filter-left">
          <span class="time-filter-label">🕒 Vaqt / Sana:</span>
          <div class="time-presets-strip">
            <button
              class="time-tab"
              [class.active]="timePreset === 'TODAY'"
              (click)="setTimePreset('TODAY')">
              Bugun
            </button>
            <button
              class="time-tab"
              [class.active]="timePreset === 'YESTERDAY'"
              (click)="setTimePreset('YESTERDAY')">
              Kecha
            </button>
            <button
              class="time-tab"
              [class.active]="timePreset === 'THIS_WEEK'"
              (click)="setTimePreset('THIS_WEEK')">
              Shu hafta
            </button>
            <button
              class="time-tab"
              [class.active]="timePreset === 'THIS_MONTH'"
              (click)="setTimePreset('THIS_MONTH')">
              Shu oy
            </button>
            <button
              class="time-tab"
              [class.active]="timePreset === 'ALL'"
              (click)="setTimePreset('ALL')">
              Barchasi
            </button>
            <button
              class="time-tab time-tab--custom"
              [class.active]="timePreset === 'CUSTOM'"
              (click)="setTimePreset('CUSTOM')">
              📅 Boshqa sana
            </button>
          </div>

          <!-- Custom Date Range Inputs -->
          <div class="custom-date-picker-wrap" *ngIf="timePreset === 'CUSTOM'">
            <input
              type="date"
              class="kds-date-input"
              [(ngModel)]="customDateFrom"
              (change)="onCustomDateChange()"
            />
            <span class="range-sep">—</span>
            <input
              type="date"
              class="kds-date-input"
              [(ngModel)]="customDateTo"
              (change)="onCustomDateChange()"
            />
          </div>
        </div>

        <!-- Shift / Hours quick filter (available when TODAY is selected) -->
        <div class="time-filter-right" *ngIf="timePreset === 'TODAY'">
          <span class="shift-label">Oraliq:</span>
          <div class="shift-pills">
            <button
              class="shift-pill"
              [class.active]="hourFilter === 'ALL'"
              (click)="setHourFilter('ALL')">
              Kun bo'yi
            </button>
            <button
              class="shift-pill"
              [class.active]="hourFilter === '1H'"
              (click)="setHourFilter('1H')">
              Oxirgi 1 soat
            </button>
            <button
              class="shift-pill"
              [class.active]="hourFilter === '3H'"
              (click)="setHourFilter('3H')">
              Oxirgi 3 soat
            </button>
            <button
              class="shift-pill"
              [class.active]="hourFilter === '6H'"
              (click)="setHourFilter('6H')">
              Oxirgi 6 soat
            </button>
          </div>
        </div>
      </div>

      <!-- REAL-TIME CANCELLATION NOTIFICATION BANNER -->
      <div class="kds-cancel-alert-banner" *ngIf="cancellationAlert">
        <div class="alert-content">
          <span class="alert-icon-anim">⚠️</span>
          <div class="alert-text">
            <div class="alert-headline">
              <strong>DIQQAT: BUYURTMA O'ZGARTIRILDI / BEKOR QILINDI!</strong>
              <span class="alert-time">{{ formatTime(cancellationAlert.timestamp.toISOString()) }}</span>
            </div>
            <div class="alert-body">
              Stol: <strong>{{ cancellationAlert.tableName }}</strong> • Buyurtma: <strong>#{{ cancellationAlert.orderNumber }}</strong>
              • Mahsulot: <span class="alert-highlight">{{ cancellationAlert.itemName }}</span>
              <span *ngIf="cancellationAlert.quantity"> ({{ cancellationAlert.quantity }} ta)</span>
              — <strong>BEKOR QILINDI</strong> • Sabab: <em>{{ cancellationAlert.reason }}</em>
              <span *ngIf="cancellationAlert.cancelledByName"> (Bekor qilgan: <strong>{{ cancellationAlert.cancelledByName }}</strong>)</span>
            </div>
          </div>
        </div>
        <button class="alert-dismiss-btn" (click)="cancellationAlert = null">✕</button>
      </div>

      <!-- Station Banner -->
      <div class="current-station-banner" *ngIf="selectedKitchen">
        <div class="banner-content">
          <span class="station-badge">{{ getKitchenIcon(selectedKitchen.code) }} {{ selectedKitchen.name }}</span>
          <span class="banner-desc">{{ selectedKitchen.description || 'Stansiya faol' }}</span>
        </div>
        <div class="banner-meta">
          <span>Kanal: <code>/topic/kitchen/{{ selectedKitchen.id }}</code></span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading && batches.length === 0" class="kds-loading">
        <div class="spinner"></div>
        <p>Buyurtmalar yuklanmoqda...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredCards.length === 0" class="kds-empty">
        <div class="empty-icon">{{ currentFilter === 'SERVED' ? '✅' : getKitchenIcon(selectedKitchen?.code) }}</div>
        <h2>{{ currentFilter === 'SERVED' ? ('Tarqatilgan buyurtmalar (' + getTimePresetLabel() + ') mavjud emas') : ((selectedKitchen?.name || 'Oshxona') + ' uchun buyurtmalar yo‘q (' + getTimePresetLabel() + ')') }}</h2>
        <p>{{ currentFilter === 'SERVED' ? 'Ushbu vaqt oralig‘ida tarqatilgan buyurtmalar tarixi mavjud emas.' : 'Belgilangan vaqt oralig‘ida faol buyurtmalar mavjud emas.' }}</p>
        <button *ngIf="timePreset !== 'ALL'" class="btn-show-all-dates" (click)="setTimePreset('ALL')">
          🌐 Barcha davr buyurtmalarini ko‘rsatish
        </button>
      </div>

      <!-- Table Cards Grid -->
      <div *ngIf="filteredCards.length > 0" class="kds-grid">
        <div
          *ngFor="let card of pagedCards"
          class="kds-card"
          [class.kds-card--addon]="card.hasNewItems && card.batches.length > 1"
          [class.kds-card--served]="card.overallStatus === 'SERVED'"
          [class.kds-card--urgent]="isUrgent(card)">
          
          <!-- Card Header -->
          <div class="kds-card-header">
            <div class="table-info">
              <span class="table-badge">{{ card.tableName }}</span>
              <span class="order-num">#{{ card.orderNumber }}</span>
              <span *ngIf="card.batches.length > 1" class="batch-count-pill" title="Ushbu stolda bir nechta partiya buyurtmalar mavjud">
                {{ card.batches.length }} ta partiya
              </span>
            </div>
            <div class="timer-badge" [class.urgent]="isUrgent(card)" [class.served-time-badge]="card.overallStatus === 'SERVED'">
              {{ card.overallStatus === 'SERVED' ? '🕒 ' + formatTime(card.servedAt || card.latestSentAt) : '⏱️ ' + getElapsedTime(card) }}
            </div>
          </div>

          <!-- Addon Alert Banner inside Card if new item arrived for existing table -->
          <div class="addon-banner" *ngIf="card.hasNewItems && card.batches.length > 1">
            🔔 YANGI BUYURTMA QO‘SHILDI
          </div>

          <div class="waiter-meta">
            <span>👤 Ofitsiant: <strong>{{ card.waiterName || 'Xodim' }}</strong></span>
            <span *ngIf="card.kitchenName" class="kitchen-name-pill">🏷️ {{ card.kitchenName }}</span>
            <span *ngIf="card.latestSentAt">
              🕒 {{ formatTime(card.latestSentAt) }}
            </span>
          </div>

          <!-- Notes -->
          <div *ngIf="card.notes" class="kds-order-note">
            💬 {{ card.notes }}
          </div>

          <!-- Items List: Grouped by Product with historical/addon details preserved -->
          <div class="kds-items-list">
            <div
              *ngFor="let prod of card.products"
              class="kds-product-block"
              [class.status-ready]="prod.status === 'READY'"
              [class.status-new]="prod.status === 'NEW'"
              [class.status-mixed]="prod.hasDistinctStatuses">

              <div class="product-main-row">
                <div class="product-left">
                  <span class="product-qty">{{ prod.totalQuantity }}x</span>
                  <span class="product-name">{{ prod.productName }}</span>
                </div>

                <!-- Product status tag -->
                <span
                  class="product-status-chip"
                  [class]="'chip--' + (prod.hasDistinctStatuses ? 'mixed' : (prod.status || 'new').toLowerCase())"
                  [title]="'Statusni o‘zgartirish uchun bosing'"
                  (click)="advanceProduct(card, prod)">
                  {{ prod.hasDistinctStatuses ? '⚡ Qisman yangi' : getStatusText(prod.status) }}
                </span>
              </div>

              <!-- Sub-items breakdown if items arrived at different rounds with different statuses -->
              <div class="product-sub-items" *ngIf="prod.hasDistinctStatuses">
                <div
                  *ngFor="let sub of prod.subItems"
                  class="sub-item-row"
                  [class.sub-new]="sub.status === 'NEW'">
                  <span class="sub-qty">{{ sub.quantity }}x</span>
                  <span class="sub-tag" [class]="'tag-' + (sub.status || 'new').toLowerCase()">
                    <ng-container [ngSwitch]="sub.status">
                      <span *ngSwitchCase="'NEW'">🔔 Yangi (Partiya #{{ sub.batchNumber }})</span>
                      <span *ngSwitchCase="'ACCEPTED'">✓ Qabul qilingan</span>
                      <span *ngSwitchCase="'READY'">✅ Tayyor</span>
                      <span *ngSwitchCase="'SERVED'">🍽️ Tarqatildi</span>
                      <span *ngSwitchDefault>{{ getStatusText(sub.status) }}</span>
                    </ng-container>
                  </span>
                  <span class="sub-time" *ngIf="sub.sentAt">{{ formatTime(sub.sentAt) }}</span>
                </div>
              </div>

              <div *ngIf="prod.notes && !prod.hasDistinctStatuses" class="product-item-notes">
                ⚠️ {{ prod.notes }}
              </div>
            </div>
          </div>

          <!-- Card Footer: Strict 3-state action workflow -->
          <div class="kds-card-footer">
            <!-- State 1: New orders awaiting acceptance -->
            <button
              *ngIf="card.activeAction === 'ACCEPT'"
              class="kds-main-action-btn btn-accept"
              (click)="acceptTable(card)">
              📥 QABUL QILISH
            </button>

            <!-- State 2: Accepted orders awaiting preparation completion -->
            <!-- CRITICAL RULE 11: [ TARQATILDI ] is strictly NOT visible here! -->
            <button
              *ngIf="card.activeAction === 'READY'"
              class="kds-main-action-btn btn-ready"
              (click)="markTableReady(card)">
              ✅ TAYYOR
            </button>

            <!-- State 3: Ready orders ready to be distributed to waiter/customer -->
            <button
              *ngIf="card.activeAction === 'SERVE'"
              class="kds-main-action-btn btn-serve"
              (click)="markTableServed(card)">
              🍽️ TARQATILDI
            </button>

            <!-- State 4: Completed / Served -->
            <ng-container *ngIf="card.overallStatus === 'SERVED'">
              <div class="served-status-text">
                ✅ Tarqatildi: {{ formatTime(card.servedAt || card.latestSentAt) }}
              </div>
              <button
                class="pos-btn pos-btn--secondary pos-btn--sm btn-revert"
                (click)="revertTableReady(card)"
                title="Tayyor holatiga qaytarish">
                ↩️ Qaytarish
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Material Paginator -->
      <mat-paginator
        *ngIf="filteredCards.length > 0"
        [length]="filteredCards.length"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [pageSizeOptions]="pageSizeOptions"
        [showFirstLastButtons]="true"
        (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .kds-container {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .kds-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
    }

    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .kds-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .pulse-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.5; }
      100% { transform: scale(0.9); opacity: 1; }
    }

    /* Real-time Status Badge */
    .realtime-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;

      &.connected {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 2s infinite;
        }
      }

      &.disconnected {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);

        .status-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }
      }
    }

    .kds-subtitle {
      color: var(--text-muted);
      font-size: 13px;
      margin: 6px 0 0 0;
    }

    .kds-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .kds-filters {
      display: flex;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
    }

    .filter-tab {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary);
        color: white;
      }

      &--served {
        border: 1px solid rgba(16, 185, 129, 0.3);
        &.active {
          background: #10b981 !important;
          color: white !important;
        }
      }
    }

    /* STATIONS SELECTOR BAR */
    .stations-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 10px 16px;
      overflow-x: auto;
    }

    .stations-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stations-strip {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .station-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        border-color: var(--primary);
        color: var(--text-primary);
        transform: translateY(-1px);
      }

      &.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);

        .station-code {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }
      }
    }

    .station-icon {
      font-size: 16px;
    }

    .station-code {
      font-size: 11px;
      font-weight: 700;
      background: var(--bg-card);
      color: var(--text-muted);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* TIME & DATE FILTER BAR */
    .time-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 10px 16px;
      flex-wrap: wrap;
    }

    .time-filter-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .time-filter-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .time-presets-strip {
      display: flex;
      gap: 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      padding: 3px;
      flex-wrap: wrap;
    }

    .time-tab {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary);
        color: white;
        box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
      }

      &--custom.active {
        background: #0ea5e9;
      }
    }

    .custom-date-picker-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .kds-date-input {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;

      &:focus {
        border-color: var(--primary);
      }
    }

    .range-sep {
      color: var(--text-muted);
      font-weight: 700;
    }

    .time-filter-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .shift-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .shift-pills {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .shift-pill {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        color: var(--text-primary);
        border-color: var(--border-light);
      }

      &.active {
        background: rgba(14, 165, 233, 0.15);
        color: #0284c7;
        border-color: #0284c7;
        font-weight: 700;
      }
    }

    .btn-show-all-dates {
      margin-top: 14px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--primary);
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
    }

    /* Station banner */
    .current-station-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.02) 100%);
      border-left: 4px solid var(--primary);
      border-radius: var(--radius-sm);
      font-size: 13px;
    }

    .station-badge {
      font-weight: 700;
      color: var(--primary-light, #818cf8);
      margin-right: 12px;
      font-size: 14px;
    }

    .banner-desc {
      color: var(--text-secondary);
    }

    .banner-meta {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      code {
        color: var(--accent-light, #38bdf8);
        background: rgba(0, 0, 0, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    /* Loading & Empty */
    .kds-loading, .kds-empty {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 60px 20px;
      text-align: center;
      color: var(--text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px auto;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 56px;
      margin-bottom: 12px;
    }

    /* Grid */
    .kds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .kds-card {
      background: var(--bg-card);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all var(--transition);
      box-shadow: var(--shadow-sm);
      animation: slideDown 0.3s ease;

      &:hover {
        border-color: var(--border-light);
        box-shadow: var(--shadow-md);
      }

      &--urgent {
        border-color: #ef4444;
        box-shadow: 0 0 14px rgba(239, 68, 68, 0.3);
      }

      &--addon {
        border: 2px solid #f59e0b;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
      }

      &--served {
        opacity: 0.85;
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(16, 185, 129, 0.02);

        &:hover {
          opacity: 1;
          border-color: #10b981;
        }
      }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .kds-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-tertiary);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }

    .table-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .table-badge {
      background: var(--primary);
      color: white;
      font-weight: 800;
      font-size: 15px;
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.3px;
    }

    .batch-count-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .addon-banner {
      background: linear-gradient(90deg, #d97706, #f59e0b);
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
      animation: pulseAddon 2s infinite;
    }

    @keyframes pulseAddon {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    }

    .order-num {
      color: var(--text-muted);
      font-size: 13px;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    .timer-badge {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-card);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);

      &.urgent {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border-color: #ef4444;
        font-weight: 700;
      }
    }

    .waiter-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      font-size: 12px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      flex-wrap: wrap;
      gap: 6px;
    }

    .kitchen-name-pill {
      font-size: 11px;
      background: var(--bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .kds-order-note {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      padding: 8px 16px;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
    }

    .kds-items-list {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 380px;
      overflow-y: auto;
    }

    .kds-product-block {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.2s ease;

      &.status-ready {
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(16, 185, 129, 0.04);
      }

      &.status-new {
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(99, 102, 241, 0.03);
      }

      &.status-mixed {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.03);
      }
    }

    .product-main-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .product-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .product-qty {
      font-size: 16px;
      font-weight: 800;
      color: var(--accent-light, #38bdf8);
      background: var(--bg-tertiary);
      padding: 3px 10px;
      border-radius: 6px;
      min-width: 38px;
      text-align: center;
      border: 1px solid var(--border);
    }

    .product-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .product-status-chip {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.85;
      }

      &.chip--new, &.chip--open {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      &.chip--accepted {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.3);
      }

      &.chip--ready {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.chip--served, &.chip--delivered {
        background: rgba(100, 116, 139, 0.15);
        color: #94a3b8;
        border: 1px solid rgba(100, 116, 139, 0.3);
      }

      &.chip--mixed {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
    }

    /* Sub-items breakdown */
    .product-sub-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-left: 12px;
      margin-top: 4px;
      border-left: 2px dashed var(--border);
    }

    .sub-item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary);

      &.sub-new {
        color: #fbbf24;
        font-weight: 600;
      }

      .sub-qty {
        font-weight: 700;
        min-width: 24px;
      }

      .sub-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;

        &.tag-new {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        &.tag-accepted {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
        }

        &.tag-ready {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        &.tag-served {
          background: rgba(100, 116, 139, 0.15);
          color: #94a3b8;
        }
      }

      .sub-time {
        margin-left: auto;
        font-size: 11px;
        color: var(--text-muted);
      }
    }

    .product-item-notes {
      font-size: 12px;
      color: #fbbf24;
      padding-left: 48px;
    }

    /* Card Footer: Large, clean, single action button */
    .kds-card-footer {
      display: flex;
      padding: 12px 14px;
      background: var(--bg-tertiary);
      border-top: 1px solid var(--border);
      align-items: center;
      min-height: 60px;
    }

    .kds-main-action-btn {
      width: 100%;
      min-height: 44px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-transform: uppercase;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }

      &:active {
        transform: translateY(0);
      }

      &.btn-accept {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);

        &:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        }
      }

      &.btn-ready {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);

        &:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
      }

      &.btn-serve {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);

        &:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
      }
    }

    .pos-btn--sm {
      min-height: 34px;
      padding: 6px 8px;
      font-size: 12px;
    }

    .served-time-badge {
      background: rgba(16, 185, 129, 0.15) !important;
      color: #10b981 !important;
      border: 1px solid rgba(16, 185, 129, 0.4) !important;
      font-weight: 700;
    }

    .served-status-text {
      font-size: 13px;
      font-weight: 700;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .btn-revert {
      font-size: 11px;
      padding: 4px 10px;
      min-height: 30px;
      color: var(--text-primary);
      border: 1px solid var(--border);
      background: var(--bg-card);
      &:hover {
        background: var(--bg-tertiary);
        border-color: var(--primary);
      }
    }

    /* Cancellation Notification Banner */
    .kds-cancel-alert-banner {
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95));
      color: white;
      border: 2px solid #f87171;
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
      animation: alertPulse 1.5s infinite;
    }

    @keyframes alertPulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4); }
      50% { box-shadow: 0 4px 28px rgba(239, 68, 68, 0.7); }
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }

    .alert-icon-anim {
      font-size: 28px;
      animation: bounce 0.6s infinite alternate;
    }

    @keyframes bounce {
      from { transform: translateY(0); }
      to { transform: translateY(-4px); }
    }

    .alert-headline {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 3px;
      font-size: 15px;
      letter-spacing: 0.5px;
    }

    .alert-time {
      font-size: 12px;
      background: rgba(0, 0, 0, 0.25);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .alert-body {
      font-size: 13px;
      line-height: 1.4;
    }

    .alert-highlight {
      background: rgba(0, 0, 0, 0.3);
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
    }

    .alert-dismiss-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition);

      &:hover {
        background: rgba(255, 255, 255, 0.4);
      }
    }
  `]
})
export class KitchenComponent implements OnInit, OnDestroy {
  kitchens: KitchenStation[] = [];
  selectedKitchen: KitchenStation | null = null;
  batches: KitchenOrderBatch[] = [];
  loading = false;
  currentFilter: 'ALL' | 'NEW' | 'ACCEPTED' | 'READY' | 'SERVED' = 'ALL';

  // Time & Date Filter
  timePreset: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' | 'CUSTOM' = 'TODAY';
  hourFilter: 'ALL' | '1H' | '3H' | '6H' = 'ALL';
  customDateFrom: string = '';
  customDateTo: string = '';

  // Pagination
  pageIndex = 0;
  pageSize = 12;
  pageSizeOptions = [12, 24, 48, 96];

  cancellationAlert: {
    orderNumber: string;
    tableName: string;
    itemName?: string;
    quantity?: number;
    reason: string;
    cancelledByName?: string;
    timestamp: Date;
  } | null = null;

  private wsUnsubs: (() => void)[] = [];
  private timerTick?: any;

  constructor(
    private kitchenService: KitchenService,
    public wsService: WebsocketService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  setFilter(filter: 'ALL' | 'NEW' | 'ACCEPTED' | 'READY' | 'SERVED'): void {
    this.currentFilter = filter;
    this.pageIndex = 0;
    sessionStorage.setItem('kds_current_filter', filter);
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    const savedFilter = sessionStorage.getItem('kds_current_filter') as any;
    if (savedFilter && ['ALL', 'NEW', 'ACCEPTED', 'READY', 'SERVED'].includes(savedFilter)) {
      this.currentFilter = savedFilter;
    }

    const savedTime = sessionStorage.getItem('kds_time_preset') as any;
    if (savedTime && ['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'ALL', 'CUSTOM'].includes(savedTime)) {
      this.timePreset = savedTime;
    }

    this.loadKitchenStations();

    // Timer tick to update relative elapsed time without polling backend
    this.timerTick = setInterval(() => {
      this.batches = [...this.batches];
      this.cdr.markForCheck();
    }, 15000);
  }

  ngOnDestroy(): void {
    this.unsubscribeAllStations();
    if (this.timerTick) {
      clearInterval(this.timerTick);
    }
  }

  loadKitchenStations(): void {
    this.kitchenService.getKitchens().subscribe({
      next: (res) => {
        this.kitchens = res.data || [];
        this.subscribeToAllKitchenStations();
        if (this.kitchens.length > 0 && !this.selectedKitchen) {
          const savedKitchenId = sessionStorage.getItem('kds_selected_kitchen_id');
          if (savedKitchenId === 'ALL') {
            this.selectKitchen(null);
          } else if (savedKitchenId) {
            const found = this.kitchens.find(k => k.id === savedKitchenId);
            this.selectKitchen(found || (this.kitchens.length > 1 ? null : this.kitchens[0]));
          } else {
            this.selectKitchen(this.kitchens.length > 1 ? null : this.kitchens[0]);
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load kitchen stations', err);
        this.cdr.markForCheck();
      }
    });
  }

  selectKitchen(k: KitchenStation | null): void {
    this.selectedKitchen = k;
    this.pageIndex = 0;
    sessionStorage.setItem('kds_selected_kitchen_id', k ? k.id : 'ALL');
    this.loadBatches();
    this.cdr.markForCheck();
  }

  private unsubscribeAllStations(): void {
    this.wsUnsubs.forEach(unsub => unsub());
    this.wsUnsubs = [];
  }

  private subscribeToAllKitchenStations(): void {
    this.unsubscribeAllStations();
    for (const k of this.kitchens) {
      console.log(`[KDS] Real-time kanalga obuna bo'linmoqda: /topic/kitchen/${k.id}`);
      const unsub = this.wsService.subscribeToKitchen(k.id, (event) => {
        console.log(`[KDS Event /topic/kitchen/${k.id}]:`, event);
        this.handleRealtimeMessage(event);
      });
      this.wsUnsubs.push(unsub);
    }
  }

  private handleRealtimeMessage(event: any): void {
    if (!event) return;

    if (event.type === 'KITCHEN_ORDER_BATCH_CREATED') {
      const incomingBatch: KitchenOrderBatch = event.payload;
      if (!incomingBatch || !incomingBatch.id) return;

      // Filter if specific kitchen station is selected
      if (this.selectedKitchen && incomingBatch.kitchenId && incomingBatch.kitchenId !== this.selectedKitchen.id) {
        return;
      }

      const idx = this.batches.findIndex(b => b.id === incomingBatch.id);
      if (idx >= 0) {
        this.batches[idx] = incomingBatch;
        this.batches = [...this.batches];
      } else {
        this.batches = [incomingBatch, ...this.batches];
        this.playChime();
      }
      this.cdr.markForCheck();
    } else if (event.type === 'KITCHEN_ORDER_BATCH_UPDATED') {
      const updatedBatch: KitchenOrderBatch = event.payload;
      if (!updatedBatch || !updatedBatch.id) return;

      if (updatedBatch.status === 'CANCELLED') {
        this.batches = this.batches.filter(b => b.id !== updatedBatch.id);
      } else {
        const idx = this.batches.findIndex(b => b.id === updatedBatch.id);
        if (idx >= 0) {
          this.batches[idx] = updatedBatch;
        } else {
          if (!this.selectedKitchen || !updatedBatch.kitchenId || updatedBatch.kitchenId === this.selectedKitchen.id) {
            this.batches = [updatedBatch, ...this.batches];
          }
        }
      }
      this.batches = [...this.batches];
      this.cdr.markForCheck();
    } else if (event.type === 'KITCHEN_ITEM_STATUS') {
      const { itemId, status } = event.payload;
      for (const batch of this.batches) {
        if (batch.items) {
          const it = batch.items.find(i => i.id === itemId);
          if (it) {
            it.status = status;
            break;
          }
        }
      }
      this.batches = [...this.batches];
      this.cdr.markForCheck();
    } else if (event.type === 'ORDER_ITEM_CANCELLED') {
      const payload = event.payload;
      if (!payload) return;

      console.warn('[KDS] Mahsulot bekor qilindi:', payload);

      this.cancellationAlert = {
        orderNumber: payload.orderNumber,
        tableName: payload.tableName || `Stol ${payload.tableNumber || '?'}`,
        itemName: payload.productName,
        quantity: payload.cancelledQuantity,
        reason: payload.reason,
        cancelledByName: payload.cancelledByName,
        timestamp: new Date()
      };

      this.playCancelAlertSound();
      this.loadBatches(true);

      setTimeout(() => {
        if (this.cancellationAlert?.orderNumber === payload.orderNumber) {
          this.cancellationAlert = null;
          this.cdr.markForCheck();
        }
      }, 15000);
    } else if (event.type === 'ORDER_CANCELLED') {
      const payload = event.payload;
      if (!payload) return;

      console.warn('[KDS] Butun buyurtma bekor qilindi:', payload);

      this.cancellationAlert = {
        orderNumber: payload.orderNumber,
        tableName: payload.tableName || `Stol ${payload.tableNumber || '?'}`,
        itemName: 'BUTUN BUYURTMA',
        reason: payload.reason,
        cancelledByName: payload.cancelledByName,
        timestamp: new Date()
      };

      this.playCancelAlertSound();
      this.batches = this.batches.filter(b => b.orderId !== payload.orderId);
      this.cdr.markForCheck();

      setTimeout(() => {
        if (this.cancellationAlert?.orderNumber === payload.orderNumber) {
          this.cancellationAlert = null;
          this.cdr.markForCheck();
        }
      }, 15000);
    }
  }

  loadBatches(silent: boolean = false): void {
    if (!silent) this.loading = true;
    this.cdr.markForCheck();

    const kitchenId = this.selectedKitchen?.id;
    this.kitchenService.getKitchenBatches(kitchenId, true).subscribe({
      next: (res) => {
        if (res.data) {
          this.batches = res.data;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load kitchen batches', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Core TableCard builder:
   * Groups batches strictly by tableId (or place/order for takeaway).
   * Aggregates products, retains distinct item batches, and calculates active 3-state action.
   */
  get tableCards(): KitchenTableCard[] {
    const activeBatches = this.batches.filter(b => b.status !== 'SERVED' && b.status !== 'DELIVERED' && b.status !== 'CANCELLED');
    const servedBatches = this.batches.filter(b => b.status === 'SERVED' || b.status === 'DELIVERED');

    const cards: KitchenTableCard[] = [];

    // 1. Group active batches strictly by tableId (or orderId if takeaway)
    const activeMap = new Map<string, KitchenOrderBatch[]>();
    for (const b of activeBatches) {
      const key = b.tableId ? `table_${b.tableId}` : `order_${b.orderId}`;
      const list = activeMap.get(key) || [];
      list.push(b);
      activeMap.set(key, list);
    }

    for (const [cardKey, batchList] of activeMap.entries()) {
      cards.push(this.buildCardFromBatches(cardKey, batchList, false));
    }

    // 2. Group served batches by orderId (historical finished orders)
    const servedMap = new Map<string, KitchenOrderBatch[]>();
    for (const b of servedBatches) {
      const key = `served_order_${b.orderId}`;
      const list = servedMap.get(key) || [];
      list.push(b);
      servedMap.set(key, list);
    }

    for (const [cardKey, batchList] of servedMap.entries()) {
      cards.push(this.buildCardFromBatches(cardKey, batchList, true));
    }

    // Sort cards: active cards first (FIFO oldest to newest), served cards at the end (newest first)
    return cards.sort((a, b) => {
      if (a.overallStatus === 'SERVED' && b.overallStatus !== 'SERVED') return 1;
      if (a.overallStatus !== 'SERVED' && b.overallStatus === 'SERVED') return -1;
      if (a.overallStatus === 'SERVED') {
        const ta = new Date(a.servedAt || a.latestSentAt || 0).getTime();
        const tb = new Date(b.servedAt || b.latestSentAt || 0).getTime();
        return tb - ta;
      }
      const ta = new Date(a.firstSentAt || 0).getTime();
      const tb = new Date(b.firstSentAt || 0).getTime();
      return ta - tb;
    });
  }

  private buildCardFromBatches(cardKey: string, batchList: KitchenOrderBatch[], forceServed: boolean): KitchenTableCard {
    batchList.sort((a, b) => {
      const ta = new Date(a.sentAt || a.createdAt || 0).getTime();
      const tb = new Date(b.sentAt || b.createdAt || 0).getTime();
      return ta - tb;
    });

    const first = batchList[0];
    const latest = batchList[batchList.length - 1];

    const tableId = first.tableId;
    const tableName = first.tableName || (first.tableNumber ? `Stol ${first.tableNumber}` : 'Olib ketish');
    const orderId = first.orderId;
    const orderNumber = first.orderNumber;
    const waiterName = first.waiterName || latest.waiterName;
    const kitchenName = first.kitchenName;
    const firstSentAt = first.sentAt || first.createdAt;
    const latestSentAt = latest.sentAt || latest.createdAt;
    const servedAt = latest.servedAt || first.servedAt;

    // Deduplicated notes
    const noteList = batchList.map(b => b.notes).filter((n): n is string => !!n && n.trim().length > 0);
    const uniqueNotes = Array.from(new Set(noteList)).join(' • ');

    // Aggregate products across batches for this card
    const prodMap = new Map<string, KitchenAggregatedProduct>();

    for (const b of batchList) {
      if (!b.items) continue;
      for (const it of b.items) {
        if (it.status === 'CANCELLED') continue;
        const pKey = it.productId || it.productName;
        let prod = prodMap.get(pKey);
        if (!prod) {
          prod = {
            productId: it.productId,
            productName: it.productName,
            totalQuantity: 0,
            hasDistinctStatuses: false,
            subItems: [],
            status: it.status,
            notes: it.notes
          };
          prodMap.set(pKey, prod);
        }

        prod.totalQuantity += it.quantity;
        prod.subItems.push({
          id: it.id,
          batchId: b.id,
          orderId: b.orderId,
          orderNumber: b.orderNumber,
          batchNumber: b.batchNumber,
          quantity: it.quantity,
          status: it.status,
          sentAt: b.sentAt || b.createdAt,
          notes: it.notes
        });
      }
    }

    const products = Array.from(prodMap.values());

    // Determine distinct status breakdown per product
    for (const prod of products) {
      const normalizedSet = new Set(prod.subItems.map(s => {
        if (s.status === 'PREPARING' || s.status === 'COOKING') return 'ACCEPTED';
        return s.status;
      }));

      prod.hasDistinctStatuses = prod.subItems.length > 1 && normalizedSet.size > 1;
      if (normalizedSet.size === 1) {
        prod.status = Array.from(normalizedSet)[0];
      } else {
        prod.status = 'MIXED';
      }
    }

    const allActiveItems = products.flatMap(p => p.subItems);

    const hasNewItems = !forceServed && allActiveItems.some(i => i.status === 'NEW' || (i.status as any) === 'SENT_TO_KITCHEN');
    const hasAcceptedItems = !forceServed && allActiveItems.some(i => i.status === 'ACCEPTED' || (i.status as any) === 'COOKING' || (i.status as any) === 'PREPARING');
    const hasReadyItems = !forceServed && allActiveItems.some(i => i.status === 'READY');
    const isAllServed = forceServed || (allActiveItems.length > 0 && allActiveItems.every(i => i.status === 'SERVED' || (i.status as any) === 'DELIVERED'));

    let overallStatus: 'NEW' | 'ACCEPTED' | 'READY' | 'SERVED' | 'CANCELLED';
    let activeAction: 'ACCEPT' | 'READY' | 'SERVE' | 'NONE';

    if (isAllServed) {
      overallStatus = 'SERVED';
      activeAction = 'NONE';
    } else if (hasNewItems) {
      overallStatus = 'NEW';
      activeAction = 'ACCEPT';
    } else if (hasAcceptedItems) {
      overallStatus = 'ACCEPTED';
      activeAction = 'READY'; // CRITICAL RULE 11: NEVER SERVE while anything is accepted
    } else if (hasReadyItems) {
      overallStatus = 'READY';
      activeAction = 'SERVE';
    } else {
      overallStatus = 'NEW';
      activeAction = 'ACCEPT';
    }

    return {
      cardKey,
      tableId,
      tableName,
      orderId,
      orderNumber,
      waiterName,
      kitchenName,
      firstSentAt,
      latestSentAt,
      servedAt,
      notes: uniqueNotes,
      batches: batchList,
      products,
      hasNewItems,
      hasAcceptedItems,
      hasReadyItems,
      isAllServed,
      overallStatus,
      activeAction
    };
  }

  setTimePreset(preset: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'): void {
    this.timePreset = preset;
    this.pageIndex = 0;
    if (preset === 'CUSTOM') {
      if (!this.customDateFrom) this.customDateFrom = this.getTodayDateString();
      if (!this.customDateTo) this.customDateTo = this.getTodayDateString();
    }
    sessionStorage.setItem('kds_time_preset', preset);
    this.cdr.markForCheck();
  }

  setHourFilter(hour: 'ALL' | '1H' | '3H' | '6H'): void {
    this.hourFilter = hour;
    this.pageIndex = 0;
    this.cdr.markForCheck();
  }

  onCustomDateChange(): void {
    this.pageIndex = 0;
    this.cdr.markForCheck();
  }

  private getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTimePresetLabel(): string {
    switch (this.timePreset) {
      case 'TODAY':
        if (this.hourFilter === '1H') return "Bugun (oxirgi 1 soat)";
        if (this.hourFilter === '3H') return "Bugun (oxirgi 3 soat)";
        if (this.hourFilter === '6H') return "Bugun (oxirgi 6 soat)";
        return "Bugun";
      case 'YESTERDAY': return "Kecha";
      case 'THIS_WEEK': return "Shu hafta";
      case 'THIS_MONTH': return "Shu oy";
      case 'CUSTOM': return `${this.customDateFrom || '...'} — ${this.customDateTo || '...'}`;
      case 'ALL': return "Barcha davr";
      default: return "";
    }
  }

  isCardInTimeRange(card: KitchenTableCard): boolean {
    if (this.timePreset === 'ALL') {
      return true;
    }

    const timeStr = (card.overallStatus === 'SERVED')
      ? (card.servedAt || card.latestSentAt || card.firstSentAt)
      : (card.latestSentAt || card.firstSentAt);

    if (!timeStr) return true;
    const cardDate = new Date(timeStr);
    const cardTime = cardDate.getTime();
    if (isNaN(cardTime)) return true;

    const now = new Date();

    if (this.timePreset === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

      // If card is active, also keep it visible
      const matchesDay = (cardTime >= startOfToday && cardTime <= endOfToday) || card.overallStatus !== 'SERVED';
      if (!matchesDay) return false;

      // Check hour filter if set
      if (this.hourFilter === '1H') {
        return cardTime >= (now.getTime() - 60 * 60 * 1000) || card.overallStatus !== 'SERVED';
      }
      if (this.hourFilter === '3H') {
        return cardTime >= (now.getTime() - 3 * 60 * 60 * 1000) || card.overallStatus !== 'SERVED';
      }
      if (this.hourFilter === '6H') {
        return cardTime >= (now.getTime() - 6 * 60 * 60 * 1000) || card.overallStatus !== 'SERVED';
      }
      return true;
    }

    if (this.timePreset === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0).getTime();
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).getTime();
      return cardTime >= startOfYesterday && cardTime <= endOfYesterday;
    }

    if (this.timePreset === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      return cardTime >= startOfWeek.getTime();
    }

    if (this.timePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return cardTime >= startOfMonth;
    }

    if (this.timePreset === 'CUSTOM') {
      let matchFrom = true;
      let matchTo = true;
      if (this.customDateFrom) {
        const fromTime = new Date(`${this.customDateFrom}T00:00:00`).getTime();
        matchFrom = cardTime >= fromTime;
      }
      if (this.customDateTo) {
        const toTime = new Date(`${this.customDateTo}T23:59:59.999`).getTime();
        matchTo = cardTime <= toTime;
      }
      return matchFrom && matchTo;
    }

    return true;
  }

  get timeFilteredCards(): KitchenTableCard[] {
    return this.tableCards.filter(c => this.isCardInTimeRange(c));
  }

  countActiveCards(): number {
    return this.timeFilteredCards.filter(c => c.overallStatus !== 'SERVED').length;
  }

  countCardsByStatus(status: 'NEW' | 'ACCEPTED' | 'READY' | 'SERVED'): number {
    const cards = this.timeFilteredCards;
    if (status === 'NEW') return cards.filter(c => c.hasNewItems && c.overallStatus !== 'SERVED').length;
    if (status === 'ACCEPTED') return cards.filter(c => !c.hasNewItems && c.hasAcceptedItems && c.overallStatus !== 'SERVED').length;
    if (status === 'READY') return cards.filter(c => !c.hasNewItems && !c.hasAcceptedItems && c.hasReadyItems && c.overallStatus !== 'SERVED').length;
    if (status === 'SERVED') return cards.filter(c => c.overallStatus === 'SERVED').length;
    return 0;
  }

  get filteredCards(): KitchenTableCard[] {
    const cards = this.timeFilteredCards;
    if (this.currentFilter === 'ALL') {
      return cards.filter(c => c.overallStatus !== 'SERVED');
    }
    if (this.currentFilter === 'NEW') {
      return cards.filter(c => c.hasNewItems && c.overallStatus !== 'SERVED');
    }
    if (this.currentFilter === 'ACCEPTED') {
      return cards.filter(c => !c.hasNewItems && c.hasAcceptedItems && c.overallStatus !== 'SERVED');
    }
    if (this.currentFilter === 'READY') {
      return cards.filter(c => !c.hasNewItems && !c.hasAcceptedItems && c.hasReadyItems && c.overallStatus !== 'SERVED');
    }
    if (this.currentFilter === 'SERVED') {
      return cards.filter(c => c.overallStatus === 'SERVED');
    }
    return cards;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get pagedCards(): KitchenTableCard[] {
    const list = this.filteredCards;
    if (this.pageIndex * this.pageSize >= list.length && list.length > 0) {
      this.pageIndex = Math.max(0, Math.ceil(list.length / this.pageSize) - 1);
    }
    const start = this.pageIndex * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  // Action 1: QABUL QILISH (NEW -> ACCEPTED)
  acceptTable(card: KitchenTableCard): void {
    const kitchenId = this.selectedKitchen?.id;
    const obs = card.tableId
      ? this.kitchenService.updateTableStatus(card.tableId, 'ACCEPTED', kitchenId)
      : this.kitchenService.updateOrderBatchesStatus(card.orderId, 'ACCEPTED', kitchenId);

    obs.subscribe({
      next: () => {
        for (const batch of card.batches) {
          if (batch.status === 'NEW' || (batch.status as any) === 'SENT_TO_KITCHEN') {
            batch.status = 'ACCEPTED';
          }
          if (batch.items) {
            batch.items.forEach(i => {
              if (i.status === 'NEW' || (i.status as any) === 'SENT_TO_KITCHEN') {
                i.status = 'ACCEPTED';
              }
            });
          }
        }
        this.batches = [...this.batches];
        this.cdr.markForCheck();
        this.notify.success(`${card.tableName} buyurtmalari qabul qilindi`);
      },
      error: (err) => this.notify.error('Xatolik: ' + (err.error?.message || err.message))
    });
  }

  // Action 2: TAYYOR (ACCEPTED -> READY)
  markTableReady(card: KitchenTableCard): void {
    const kitchenId = this.selectedKitchen?.id;
    const obs = card.tableId
      ? this.kitchenService.updateTableStatus(card.tableId, 'READY', kitchenId)
      : this.kitchenService.updateOrderBatchesStatus(card.orderId, 'READY', kitchenId);

    obs.subscribe({
      next: () => {
        const now = new Date().toISOString();
        for (const batch of card.batches) {
          if (batch.status !== 'SERVED' && batch.status !== 'DELIVERED' && batch.status !== 'CANCELLED') {
            batch.status = 'READY';
            batch.readyAt = now;
          }
          if (batch.items) {
            batch.items.forEach(i => {
              if (i.status !== 'SERVED' && i.status !== 'DELIVERED' && i.status !== 'CANCELLED') {
                i.status = 'READY';
                i.readyAt = now;
              }
            });
          }
        }
        this.batches = [...this.batches];
        this.cdr.markForCheck();
        this.notify.success(`${card.tableName} tayyor deb belgilandi!`);
      },
      error: (err) => this.notify.error('Xatolik: ' + (err.error?.message || err.message))
    });
  }

  // Action 3: TARQATILDI (READY -> SERVED)
  markTableServed(card: KitchenTableCard): void {
    const kitchenId = this.selectedKitchen?.id;
    const obs = card.tableId
      ? this.kitchenService.updateTableStatus(card.tableId, 'SERVED', kitchenId)
      : this.kitchenService.updateOrderBatchesStatus(card.orderId, 'SERVED', kitchenId);

    obs.subscribe({
      next: () => {
        const now = new Date().toISOString();
        for (const batch of card.batches) {
          if (batch.status !== 'CANCELLED') {
            batch.status = 'SERVED';
            batch.servedAt = now;
          }
          if (batch.items) {
            batch.items.forEach(i => {
              if (i.status !== 'CANCELLED') {
                i.status = 'SERVED';
              }
            });
          }
        }
        this.batches = [...this.batches];
        this.cdr.markForCheck();
        this.notify.success(`${card.tableName} tarqatildi deb belgilandi!`);
      },
      error: (err) => this.notify.error('Xatolik: ' + (err.error?.message || err.message))
    });
  }

  // Revert action (from served back to ready)
  revertTableReady(card: KitchenTableCard): void {
    const kitchenId = this.selectedKitchen?.id;
    const obs = card.tableId
      ? this.kitchenService.updateTableStatus(card.tableId, 'READY', kitchenId)
      : this.kitchenService.updateOrderBatchesStatus(card.orderId, 'READY', kitchenId);

    obs.subscribe({
      next: () => {
        for (const batch of card.batches) {
          batch.status = 'READY';
          if (batch.items) {
            batch.items.forEach(i => i.status = 'READY');
          }
        }
        this.batches = [...this.batches];
        this.cdr.markForCheck();
        this.notify.info(`${card.tableName} qayta tayyor holatiga o'tkazildi`);
      },
      error: (err) => this.notify.error('Xatolik: ' + (err.error?.message || err.message))
    });
  }

  // Individual product item advancement
  advanceProduct(card: KitchenTableCard, prod: KitchenAggregatedProduct): void {
    let nextStatus: 'ACCEPTED' | 'READY' | 'SERVED';
    const hasNew = prod.subItems.some(s => s.status === 'NEW' || (s.status as any) === 'SENT_TO_KITCHEN');
    const hasAccepted = prod.subItems.some(s => s.status === 'ACCEPTED' || s.status === 'COOKING' || s.status === 'PREPARING');
    const hasReady = prod.subItems.some(s => s.status === 'READY');

    if (hasNew) {
      nextStatus = 'ACCEPTED';
    } else if (hasAccepted) {
      nextStatus = 'READY';
    } else if (hasReady) {
      nextStatus = 'SERVED';
    } else {
      return;
    }

    const targetItems = prod.subItems.filter(s => {
      if (nextStatus === 'ACCEPTED') return s.status === 'NEW' || (s.status as any) === 'SENT_TO_KITCHEN';
      if (nextStatus === 'READY') return s.status === 'ACCEPTED' || s.status === 'COOKING' || s.status === 'PREPARING';
      if (nextStatus === 'SERVED') return s.status === 'READY';
      return false;
    });

    targetItems.forEach(sub => {
      this.kitchenService.updateBatchItemStatus(sub.id, nextStatus).subscribe({
        next: () => {
          sub.status = nextStatus;
          for (const b of this.batches) {
            const found = b.items?.find(i => i.id === sub.id);
            if (found) {
              found.status = nextStatus;
              break;
            }
          }
          this.batches = [...this.batches];
          this.cdr.markForCheck();
        }
      });
    });
  }

  getKitchenIcon(code?: string): string {
    switch (code?.toUpperCase()) {
      case 'PLOV': return '🍚';
      case 'SOMSA': return '🥟';
      case 'PIZZA': return '🍕';
      case 'BAR': return '🍹';
      case 'MAIN': return '🍲';
      default: return '👨‍🍳';
    }
  }

  getStatusText(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'NEW': return '🟡 YANGI';
      case 'SENT_TO_KITCHEN': return '🔵 OSHXONADA';
      case 'ACCEPTED': return '🟣 QABUL QILINDI';
      case 'PREPARING':
      case 'COOKING': return '🟣 QABUL QILINDI';
      case 'READY': return '🟢 TAYYOR';
      case 'DELIVERED':
      case 'SERVED': return '✅ TARQATILDI';
      case 'CANCELLED': return '🔴 BEKOR QILINDI';
      default: return status || 'YANGI';
    }
  }

  formatTime(isoDate?: string): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  isUrgent(card: KitchenTableCard): boolean {
    if (card.overallStatus === 'SERVED') return false;
    const timeStr = card.firstSentAt;
    if (!timeStr) return false;
    const diffMins = (Date.now() - new Date(timeStr).getTime()) / 60000;
    return diffMins > 20;
  }

  getElapsedTime(card: KitchenTableCard): string {
    const timeStr = card.firstSentAt;
    if (!timeStr) return 'Yangi';
    const diffSecs = Math.floor((Date.now() - new Date(timeStr).getTime()) / 1000);
    if (diffSecs < 60) return `${diffSecs} sek`;
    const mins = Math.floor(diffSecs / 60);
    return `${mins} daq`;
  }

  private playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio might be blocked by browser autoplay policy before user interaction
    }
  }

  private playCancelAlertSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playBeep = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      playBeep(650, 0, 0.2);
      playBeep(450, 0.25, 0.35);
    } catch {
      // Audio might be blocked by browser policy
    }
  }
}
