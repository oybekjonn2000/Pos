import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { KitchenService, KitchenStation, KitchenOrderBatch, KitchenOrderBatchItem } from '../core/services/kitchen.service';
import { WebsocketService } from '../core/services/websocket.service';

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
            <span class="pulse-indicator" *ngIf="countActive() > 0">
              <span class="pulse-dot"></span>
              {{ countActive() }} ta faol partiya
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
            Har bir buyurtma partiyasi (Kitchen Batch / Round) alohida chipta sifatida ko'rsatiladi
          </p>
        </div>

        <div class="kds-actions">
          <div class="kds-filters">
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'ALL'"
              (click)="setFilter('ALL')">
              Faol ({{ countActive() }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'NEW'"
              (click)="setFilter('NEW')">
              Yangi ({{ countByStatus('NEW') }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'COOKING'"
              (click)="setFilter('COOKING')">
              Tayyorlanmoqda ({{ countByStatus('COOKING') }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter === 'READY'"
              (click)="setFilter('READY')">
              Tayyor ({{ countByStatus('READY') }})
            </button>
            <button
              class="filter-tab filter-tab--served"
              [class.active]="currentFilter === 'SERVED'"
              (click)="setFilter('SERVED')">
              Tarqatilgan ({{ countByStatus('SERVED') }})
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
        <p>Partiyalar yuklanmoqda...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredBatches.length === 0" class="kds-empty">
        <div class="empty-icon">{{ currentFilter === 'SERVED' ? '✅' : getKitchenIcon(selectedKitchen?.code) }}</div>
        <h2>{{ currentFilter === 'SERVED' ? 'Tarqatilgan buyurtmalar tarixi hozircha bo‘sh' : (selectedKitchen?.name || 'Oshxona') + ' uchun faol buyurtma partiyalari yo‘q' }}</h2>
        <p>{{ currentFilter === 'SERVED' ? 'Buyurtmalar tarqatilgach, ular bu yerda arxiv va tarix sifatida saqlanib turadi.' : 'Ofitsiant yangi buyurtma yuborishi bilan bu stansiyaga tegishli partiya darhol REAL-TIME paydo bo‘ladi.' }}</p>
      </div>

      <!-- Batches Grid -->
      <div *ngIf="filteredBatches.length > 0" class="kds-grid">
        <div
          *ngFor="let batch of pagedBatches"
          class="kds-card"
          [class.kds-card--addon]="(batch.batchType === 'ADDON' || batch.batchNumber > 1) && batch.status !== 'SERVED' && batch.status !== 'DELIVERED'"
          [class.kds-card--served]="batch.status === 'SERVED' || batch.status === 'DELIVERED'"
          [class.kds-card--urgent]="isUrgent(batch)">
          
          <!-- Card Header -->
          <div class="kds-card-header">
            <div class="table-info">
              <span class="delivery-badge" *ngIf="batch.orderType === 'DELIVERY'">🚚 DELIVERY</span>
              <span class="table-badge" *ngIf="batch.orderType !== 'DELIVERY'">{{ batch.tableName || ('Stol ' + batch.tableNumber) || 'Stol ?' }}</span>
              <span class="order-num">#{{ batch.orderNumber }}</span>
              
              <!-- Batch Indicator Badge -->
              <span class="batch-badge"
                [class.batch-badge--served]="batch.status === 'SERVED' || batch.status === 'DELIVERED'"
                [class.batch-badge--addon]="(batch.batchType === 'ADDON' || batch.batchNumber > 1) && batch.status !== 'SERVED' && batch.status !== 'DELIVERED'"
                [class.batch-badge--initial]="batch.batchType !== 'ADDON' && batch.batchNumber <= 1 && batch.status !== 'SERVED' && batch.status !== 'DELIVERED'">
                {{ (batch.status === 'SERVED' || batch.status === 'DELIVERED') ? '✅ TARQATILDI' : ((batch.batchType === 'ADDON' || batch.batchNumber > 1) ? '🔔 Partiya #' + batch.batchNumber : 'Partiya #1') }}
              </span>
            </div>
            <div class="timer-badge" [class.urgent]="isUrgent(batch)" [class.served-time-badge]="batch.status === 'SERVED' || batch.status === 'DELIVERED'">
              {{ (batch.status === 'SERVED' || batch.status === 'DELIVERED') ? '🕒 ' + formatTime(batch.servedAt || batch.sentAt) : '⏱️ ' + getElapsedTime(batch) }}
            </div>
          </div>

          <!-- Highlight Banner for Additional Rounds -->
          <div class="addon-banner" *ngIf="batch.batchType === 'ADDON' || batch.batchNumber > 1">
            🔔 QO‘SHIMCHA BUYURTMA — Partiya #{{ batch.batchNumber }}
          </div>

          <!-- Delivery Customer Meta -->
          <div class="delivery-kds-meta" *ngIf="batch.orderType === 'DELIVERY'">
            <span>👤 Mijoz: <strong>{{ batch.customerName || 'Yetkazib berish' }}</strong> <span *ngIf="batch.customerPhone">({{ batch.customerPhone }})</span></span>
            <span *ngIf="batch.deliveryAddress" class="delivery-addr">📍 {{ batch.deliveryAddress }}</span>
          </div>

          <div class="waiter-meta" *ngIf="batch.orderType !== 'DELIVERY'">
            <span>👤 Ofitsiant: <strong>{{ batch.waiterName || 'Xodim' }}</strong></span>
            <span *ngIf="batch.kitchenName" class="kitchen-name-pill">🏷️ {{ batch.kitchenName }}</span>
            <span *ngIf="batch.sentAt || batch.createdAt">
              🕒 {{ formatTime(batch.sentAt || batch.createdAt) }}
            </span>
          </div>

          <!-- Notes -->
          <div *ngIf="batch.notes" class="kds-order-note">
            💬 {{ batch.notes }}
          </div>

          <!-- Items List: Strictly contains the snapshot quantities for THIS batch -->
          <div class="kds-items-list">
            <div
              *ngFor="let item of batch.items"
              class="kds-item-row"
              [class.item-ready]="item.status === 'READY'"
              [class.item-cooking]="item.status === 'COOKING' || item.status === 'PREPARING'"
              [class.item-cancelled]="item.status === 'CANCELLED'">
              
              <div class="item-details">
                <span class="item-qty" [class.strikethrough]="item.status === 'CANCELLED'">{{ item.quantity }}x</span>
                <span class="item-name" [class.strikethrough]="item.status === 'CANCELLED'">{{ item.productName }}</span>
                <span class="item-status-pill" [class]="'pill--' + (item.status || 'NEW').toLowerCase()">
                  {{ item.status === 'CANCELLED' ? '🚫 BEKOR QILINDI' : getStatusText(item.status) }}
                </span>
              </div>

              <div *ngIf="item.notes" class="item-note">
                ⚠️ {{ item.notes }}
              </div>

              <!-- Item Actions: only visible for active items -->
              <div class="item-actions" *ngIf="item.status !== 'CANCELLED'">
                <button
                  *ngIf="item.status === 'NEW' || item.status === 'ACCEPTED' || !item.status"
                  class="action-btn action-btn--cook"
                  (click)="setItemStatus(item, 'COOKING')">
                  🔥 Tayyorlash
                </button>

                <button
                  *ngIf="item.status === 'COOKING' || item.status === 'PREPARING'"
                  class="action-btn action-btn--ready"
                  (click)="setItemStatus(item, 'READY')">
                  ✅ Tayyor bo'ldi
                </button>

                <button
                  *ngIf="item.status === 'READY'"
                  class="action-btn action-btn--served"
                  (click)="setItemStatus(item, 'SERVED')">
                  🍽️ Tarqatildi
                </button>

                <span *ngIf="item.status === 'SERVED' || item.status === 'DELIVERED'" class="badge-served">
                  ✓ Yetkazildi
                </span>
              </div>
            </div>
          </div>

          <!-- Batch Bulk Actions -->
          <div class="kds-card-footer">
            <ng-container *ngIf="batch.status !== 'SERVED' && batch.status !== 'DELIVERED'">
              <button
                class="pos-btn pos-btn--secondary pos-btn--sm"
                (click)="setBatchStatus(batch, 'COOKING')"
                [disabled]="allInBatchStatus(batch, 'COOKING') || batch.status === 'READY'">
                🔥 Barchasi olovda
              </button>
              <button
                class="pos-btn pos-btn--success pos-btn--sm"
                (click)="setBatchStatus(batch, 'READY')"
                [disabled]="batch.status === 'READY'">
                ✅ Barchasi tayyor!
              </button>
              <button
                *ngIf="batch.status === 'READY'"
                class="pos-btn pos-btn--primary pos-btn--sm"
                (click)="setBatchStatus(batch, 'SERVED')">
                🍽️ Tarqatildi
              </button>
            </ng-container>
            <ng-container *ngIf="batch.status === 'SERVED' || batch.status === 'DELIVERED'">
              <div class="served-status-text">
                ✅ Tarqatilgan: {{ formatTime(batch.servedAt || batch.sentAt) }}
              </div>
              <button
                class="pos-btn pos-btn--secondary pos-btn--sm btn-revert"
                (click)="setBatchStatus(batch, 'READY')"
                title="Tayyor holatiga qaytarish">
                ↩️ Qaytarish
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Material Paginator -->
      <mat-paginator
        *ngIf="filteredBatches.length > 0"
        [length]="filteredBatches.length"
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
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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

      /* Addon Batch Highlight */
      &--addon {
        border: 2px solid #f59e0b;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
      }

      /* Served Batch Highlight */
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
      font-weight: 700;
      font-size: 14px;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }

    .delivery-badge {
      background: rgba(245, 158, 11, 0.25);
      color: #fbbf24;
      border: 1px solid #f59e0b;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.5px;
    }

    .batch-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &--initial {
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.4);
      }

      &--addon {
        background: rgba(245, 158, 11, 0.25);
        color: #fbbf24;
        border: 1px solid #f59e0b;
        animation: pulseBatch 2s infinite;
      }

      &--served {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.5);
      }
    }

    @keyframes pulseBatch {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
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
    }

    .delivery-kds-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 12px;
      background: rgba(245, 158, 11, 0.08);
      border-left: 3px solid #f59e0b;
      font-size: 12px;
      color: var(--text-secondary);

      strong { color: var(--text-primary); }
      .delivery-addr { font-size: 11px; color: var(--text-muted); }
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
      padding: 8px 0;
      display: flex;
      flex-direction: column;
    }

    .kds-item-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      transition: background var(--transition);

      &:last-child {
        border-bottom: none;
      }

      &.item-cooking {
        background: rgba(245, 158, 11, 0.08);
      }

      &.item-ready {
        background: rgba(16, 185, 129, 0.08);
      }
    }

    .item-details {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .item-qty {
      font-size: 16px;
      font-weight: 800;
      color: var(--accent-light, #38bdf8);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 4px;
      min-width: 34px;
      text-align: center;
    }

    .item-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .item-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.2;
      white-space: nowrap;

      &.pill--new, &.pill--open {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      &.pill--sent, &.pill--sent_to_kitchen {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      &.pill--accepted {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.3);
      }

      &.pill--cooking, &.pill--preparing {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      &.pill--ready {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.pill--served, &.pill--delivered {
        background: rgba(100, 116, 139, 0.15);
        color: #94a3b8;
        border: 1px solid rgba(100, 116, 139, 0.3);
      }

      &.pill--cancelled {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
    }

    .item-note {
      font-size: 12px;
      color: #fbbf24;
      padding-left: 44px;
    }

    .item-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all var(--transition);

      &--cook {
        background: #d97706;
        color: white;
        &:hover { background: #b45309; }
      }

      &--ready {
        background: #10b981;
        color: white;
        &:hover { background: #059669; }
      }

      &--served {
        background: #3b82f6;
        color: white;
        &:hover { background: #2563eb; }
      }
    }

    .badge-served {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      padding: 4px 8px;
    }

    .kds-card-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: var(--bg-tertiary);
      border-top: 1px solid var(--border);

      button {
        flex: 1;
      }
    }

    .pos-btn--sm {
      min-height: 34px;
      padding: 6px 12px;
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

    .kds-item-row.item-cancelled {
      background: rgba(239, 68, 68, 0.08);
      border-left: 4px solid #ef4444;
      opacity: 0.85;
    }

    .strikethrough {
      text-decoration: line-through;
      color: #9ca3af !important;
    }

    .item-status-pill.pill--cancelled {
      background: rgba(239, 68, 68, 0.25);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.5);
    }
  `]
})
export class KitchenComponent implements OnInit, OnDestroy {
  kitchens: KitchenStation[] = [];
  selectedKitchen: KitchenStation | null = null;
  batches: KitchenOrderBatch[] = [];
  loading = false;
  currentFilter: 'ALL' | 'NEW' | 'COOKING' | 'READY' | 'SERVED' = 'ALL';

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
    private cdr: ChangeDetectorRef
  ) {}

  setFilter(filter: 'ALL' | 'NEW' | 'COOKING' | 'READY' | 'SERVED'): void {
    this.currentFilter = filter;
    this.pageIndex = 0;
    sessionStorage.setItem('kds_current_filter', filter);
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    const savedFilter = sessionStorage.getItem('kds_current_filter') as any;
    if (savedFilter && ['ALL', 'NEW', 'COOKING', 'READY', 'SERVED'].includes(savedFilter)) {
      this.currentFilter = savedFilter;
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

  countActive(): number {
    return this.batches.filter(b => b.status !== 'SERVED' && b.status !== 'DELIVERED' && b.status !== 'CANCELLED').length;
  }

  get activeBatches(): KitchenOrderBatch[] {
    return this.batches.filter(b => b.status !== 'SERVED' && b.status !== 'DELIVERED' && b.status !== 'CANCELLED');
  }

  get filteredBatches(): KitchenOrderBatch[] {
    if (this.currentFilter === 'ALL') {
      return this.batches.filter(b => b.status !== 'SERVED' && b.status !== 'DELIVERED' && b.status !== 'CANCELLED');
    }
    if (this.currentFilter === 'SERVED') {
      return this.batches.filter(b => b.status === 'SERVED' || b.status === 'DELIVERED');
    }
    if (this.currentFilter === 'NEW') {
      return this.batches.filter(b => b.status === 'NEW' || b.status === 'ACCEPTED');
    }
    if (this.currentFilter === 'COOKING') {
      return this.batches.filter(b => b.status === 'COOKING' || b.status === 'PREPARING');
    }
    if (this.currentFilter === 'READY') {
      return this.batches.filter(b => b.status === 'READY');
    }
    return this.batches;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get pagedBatches(): KitchenOrderBatch[] {
    const list = this.filteredBatches;
    if (this.pageIndex * this.pageSize >= list.length && list.length > 0) {
      this.pageIndex = Math.max(0, Math.ceil(list.length / this.pageSize) - 1);
    }
    const start = this.pageIndex * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  countByStatus(status: string): number {
    return this.batches.filter(batch => {
      const st = batch.status || 'NEW';
      if (status === 'NEW') return st === 'NEW' || st === 'ACCEPTED';
      if (status === 'COOKING') return st === 'COOKING' || st === 'PREPARING';
      if (status === 'READY') return st === 'READY';
      if (status === 'SERVED') return st === 'SERVED' || st === 'DELIVERED';
      return st === status;
    }).length;
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
      case 'COOKING': return '🟠 TAYYORLANMOQDA';
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

  isUrgent(batch: KitchenOrderBatch): boolean {
    const timeStr = batch.sentAt || batch.createdAt;
    if (!timeStr) return false;
    const diffMins = (Date.now() - new Date(timeStr).getTime()) / 60000;
    return diffMins > 20;
  }

  getElapsedTime(batch: KitchenOrderBatch): string {
    const timeStr = batch.sentAt || batch.createdAt;
    if (!timeStr) return 'Yangi';
    const diffSecs = Math.floor((Date.now() - new Date(timeStr).getTime()) / 1000);
    if (diffSecs < 60) return `${diffSecs} sek`;
    const mins = Math.floor(diffSecs / 60);
    return `${mins} daq`;
  }

  setItemStatus(item: KitchenOrderBatchItem, status: 'NEW' | 'ACCEPTED' | 'COOKING' | 'PREPARING' | 'READY' | 'SERVED' | 'DELIVERED'): void {
    if (!item.id) return;
    this.kitchenService.updateBatchItemStatus(item.id, status).subscribe({
      next: (res) => {
        if (res.data) {
          item.status = res.data.status;
        } else {
          item.status = status;
        }
        this.batches = [...this.batches];
      },
      error: (err) => alert('Statusni yangilab bo‘lmadi: ' + (err.error?.message || err.message))
    });
  }

  setBatchStatus(batch: KitchenOrderBatch, status: string): void {
    if (!batch.id) return;
    this.kitchenService.updateBatchStatus(batch.id, status).subscribe({
      next: (res) => {
        if (status === 'CANCELLED') {
          this.batches = this.batches.filter(b => b.id !== batch.id);
        } else if (res.data) {
          const idx = this.batches.findIndex(b => b.id === batch.id);
          if (idx >= 0) {
            this.batches[idx] = res.data;
          }
        } else {
          batch.status = status as any;
          if (status === 'SERVED' || status === 'DELIVERED') {
            batch.servedAt = new Date().toISOString();
          }
          if (batch.items) {
            batch.items.forEach(i => i.status = status as any);
          }
        }
        this.batches = [...this.batches];
        this.cdr.markForCheck();
      },
      error: (err) => alert('Partiya statusini yangilab bo‘lmadi: ' + (err.error?.message || err.message))
    });
  }

  allInBatchStatus(batch: KitchenOrderBatch, status: string): boolean {
    if (!batch.items || batch.items.length === 0) return true;
    return batch.items.every(i => i.status === status || i.status === 'SERVED');
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
