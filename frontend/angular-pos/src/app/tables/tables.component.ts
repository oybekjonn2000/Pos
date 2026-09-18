import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableService, RestaurantTable, TableZone, CreateTableRequest } from '../core/services/table.service';
import { NotificationService } from '../core/services/notification.service';
import { AuthService } from '../core/services/auth.service';
import { WebsocketService } from '../core/services/websocket.service';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tables-page fade-in">
      @if (!isWaiter()) {
        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Stollar Xaritasi</h1>
            <p class="page-subtitle">Restoran stollari va ularning real holati (Band / Bo'sh)</p>
          </div>
          <div class="header-actions">
            <button class="btn btn--secondary" (click)="loadAll()">
              <span>🔄</span> Yangilash
            </button>
            @if (canManageTables()) {
              <button class="btn btn--secondary" (click)="openAddZoneModal()">
                <span>🏛️</span> + Yangi Joy
              </button>
              <button class="btn btn--primary" (click)="openAddModal()">
                <span>➕</span> Stol Qo'shish
              </button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="tables-stats">
          <div class="stat-pill stat-pill--total">
            <span class="stat-label">Jami Stollar:</span>
            <span class="stat-value">{{ tables().length }}</span>
          </div>
          <div class="stat-pill stat-pill--free">
            <span class="stat-indicator"></span>
            <span class="stat-label">Bo'sh (FREE):</span>
            <span class="stat-value">{{ freeCount() }}</span>
          </div>
          <div class="stat-pill stat-pill--occupied">
            <span class="stat-indicator"></span>
            <span class="stat-label">Band (OCCUPIED):</span>
            <span class="stat-value">{{ occupiedCount() }}</span>
          </div>
        </div>
      }

      <!-- Zone Filter Tabs & Actions -->
      <div class="zone-filter-bar">
        <div class="zone-tabs-wrap">
          <div class="zone-filter-header">
            <span class="zone-filter-icon">📍</span>
            <span class="zone-filter-title">Joylashuv (Zona):</span>
          </div>
          <div class="zone-tabs">
            <button class="zone-tab" [class.active]="selectedZoneId() === null" (click)="selectZone(null)">
              <span class="zone-tab-icon">🌐</span>
              <span class="zone-tab-name">Barchasi</span>
              <span class="zone-tab-count">{{ tables().length }}</span>
            </button>
            @for (zone of zones(); track zone.id) {
              <button class="zone-tab" [class.active]="selectedZoneId() === zone.id" (click)="selectZone(zone.id)">
                <span class="zone-tab-icon">{{ getZoneIcon(zone.name) }}</span>
                <span class="zone-tab-name">{{ zone.name }}</span>
                @if (zone.percentage && zone.percentage > 0) {
                  <span class="zone-tab-pct">+{{ zone.percentage }}%</span>
                } @else {
                  <span class="zone-tab-pct zone-tab-pct--zero">0%</span>
                }
                <span class="zone-tab-count">{{ countByZone(zone.id) }}</span>
              </button>
            }
          </div>
        </div>

        @if (canManageTables() && selectedZone()) {
          <div class="zone-action-buttons">
            <button class="btn-zone-action" (click)="openEditZoneModal(selectedZone()!)" title="Joyni tahrirlash">
              ✏️ Tahrirlash
            </button>
            <button class="btn-zone-action btn-zone-action--danger" (click)="deleteCurrentZone(selectedZone()!)" title="Joyni o'chirish">
              🗑️ O'chirish
            </button>
          </div>
        }
      </div>

      <!-- Tables Grid -->
      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Stollar yuklanmoqda...</p>
        </div>
      } @else if (filteredTables().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🪑</div>
          <h3>Stollar topilmadi</h3>
          <p>Ushbu zonada hozircha stollar mavjud emas.</p>
          @if (canManageTables()) {
            <button class="btn btn--primary mt-4" (click)="openAddModal()">
              <span>➕</span> Shu zonaga stol qo'shish
            </button>
          }
        </div>
      } @else {
        <div class="tables-grid">
          @for (table of filteredTables(); track table.id) {
            <div class="table-card" 
                 [class.table-card--free]="table.status === 'FREE'"
                 [class.table-card--occupied]="table.status === 'OCCUPIED' && table.myTable !== false"
                 [class.table-card--other-waiter]="table.status === 'OCCUPIED' && table.myTable === false"
                 (click)="onSelectTable(table)">
              
              <div class="table-card__header">
                <span class="table-card__number">#{{ table.tableNumber }}</span>
                @if (table.status === 'FREE') {
                  <span class="table-status-badge badge--free">BOʻSH</span>
                } @else if (table.myTable === false) {
                  <span class="table-status-badge badge--other-waiter">🔒 BAND (Boshqa ofitsiant)</span>
                } @else {
                  <span class="table-status-badge badge--occupied">BAND (Mening stolim)</span>
                }
              </div>

              <!-- Zone Badge -->
              @if (table.zoneName) {
                <div class="table-card__zone-badge">
                  <span>{{ getZoneIcon(table.zoneName) }} {{ table.zoneName }}</span>
                </div>
              }

              <div class="table-card__body">
                <div class="table-card__icon">
                  {{ table.status === 'FREE' ? '🟢' : (table.myTable === false ? '🔒' : '🔴') }}
                </div>
                <div class="table-card__name">{{ table.name }}</div>

                @if (table.status === 'FREE') {
                  <div class="table-card__capacity">
                    <span>👥 {{ table.capacity }} kishilik</span>
                  </div>
                } @else if (table.myTable === false) {
                  <div class="table-card__other-waiter-info">
                    <span class="other-waiter-badge">👤 Boshqa ofitsiant</span>
                    <p class="other-waiter-hint">Bu stol boshqa ofitsantga biriktirilgan</p>
                  </div>
                } @else {
                  <div class="table-card__active-order">
                    <div class="table-card__item-count">
                      🍽️ {{ table.itemCount || 0 }} ta mahsulot
                    </div>
                    <div class="table-card__amount">
                      {{ formatPrice(table.totalAmount || 0) }}
                    </div>
                  </div>
                }
              </div>

              <div class="table-card__footer">
                @if (table.status === 'FREE') {
                  <button class="btn-action btn-action--order">
                    ➕ Buyurtma ochish
                  </button>
                } @else if (table.myTable === false) {
                  <button class="btn-action btn-action--blocked" disabled title="Bu stol boshqa ofitsantga biriktirilgan">
                    🚫 Biriktirilgan
                  </button>
                } @else {
                  <div class="table-card__btn-group">
                    <button class="btn-action btn-action--view">
                      👀 OCHISH
                    </button>
                    @if (!table.itemCount || table.itemCount === 0) {
                      <button class="btn-action btn-action--release" (click)="onReleaseTable($event, table)" title="Bo'sh stolni bo'shatish">
                        🔓 Bo'shatish
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Add Table Modal -->
      @if (showAddModal() && canManageTables()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Yangi Stol Qo'shish</h3>
                <p class="modal-sub">Stol ma'lumotlari va uning joylashuvini belgilang</p>
              </div>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <!-- Location / Zone Selection (MANDATORY) -->
              <div class="form-group">
                <label class="required-label">
                  Stol Joylashuvi (Zona) *
                  <span class="label-hint">(Zal, Ko'cha, Ayvon, Podval...)</span>
                </label>
                <div class="zone-select-row">
                  <select [(ngModel)]="newTable.zoneId" class="pos-input pos-select">
                    <option value="" disabled>-- Joylashuvni tanlang --</option>
                    @for (zone of zones(); track zone.id) {
                      <option [value]="zone.id">{{ getZoneIcon(zone.name) }} {{ zone.name }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-zone" (click)="toggleCustomZone()" [title]="showCustomZone() ? 'Yopish' : 'Yangi zona kiritish'">
                    {{ showCustomZone() ? '✕' : '+ Yangi joy' }}
                  </button>
                </div>
                
                @if (showCustomZone()) {
                  <div class="custom-zone-input-wrap">
                    <input type="text" [(ngModel)]="customZoneName" placeholder="Masalan: Ayvon, Podval, Bog'..." class="pos-input" />
                    <button type="button" class="btn btn--primary btn-sm" (click)="addNewZone()" [disabled]="!customZoneName.trim()">
                      Qo'shish
                    </button>
                  </div>
                }

                @if (!newTable.zoneId && !newTable.zoneName) {
                  <span class="field-validation-error">⚠️ Stol joylashuvini (zal, ko'cha, ayvon, podval...) tanlash shart!</span>
                }
              </div>

              <!-- Table Number -->
              <div class="form-group">
                <label class="required-label">Stol Raqami *</label>
                <input type="text" [(ngModel)]="newTable.tableNumber" placeholder="Masalan: 11 yoki K-1, AY-1" class="pos-input" />
              </div>

              <!-- Table Name -->
              <div class="form-group">
                <label>Stol Nomi</label>
                <input type="text" [(ngModel)]="newTable.name" placeholder="Masalan: Stol 11 yoki Ayvon 1" class="pos-input" />
              </div>

              <!-- Capacity -->
              <div class="form-group">
                <label>Sig'imi (Odamlar soni)</label>
                <input type="number" [(ngModel)]="newTable.capacity" min="1" max="50" class="pos-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn--secondary" (click)="closeModal()">Bekor qilish</button>
              <button class="btn btn--primary" 
                      (click)="saveNewTable()" 
                      [disabled]="!newTable.tableNumber || (!newTable.zoneId && !newTable.zoneName)">
                <span>💾</span> Saqlash
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Zone Add/Edit Modal -->
      @if (showZoneModal() && canManageTables()) {
        <div class="modal-backdrop" (click)="closeZoneModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">{{ editingZoneId ? 'Joyni Tahrirlash' : 'Yangi Joy Qo\'shish' }}</h3>
                <p class="modal-sub">Joy nomi va ushbu joy uchun foizni belgilang</p>
              </div>
              <button class="modal-close" (click)="closeZoneModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="required-label">Joy Nomi *</label>
                <input type="text" [(ngModel)]="zoneForm.name" placeholder="Masalan: Zal, Premium, Olib ketish, VIP..." class="pos-input" />
              </div>

              <div class="form-group">
                <label class="required-label">
                  Stol / Joy Foizi (%) *
                  <span class="label-hint">(Buyurtma hisobiga avtomatik qo'shiladi)</span>
                </label>
                <div class="percentage-input-wrap">
                  <input type="number" [(ngModel)]="zoneForm.percentage" min="0" max="100" step="0.5" placeholder="0" class="pos-input" />
                  <span class="percentage-symbol">%</span>
                </div>
              </div>

              <div class="form-group">
                <label>Tavsif (ixtiyoriy)</label>
                <input type="text" [(ngModel)]="zoneForm.description" placeholder="Qo'shimcha izoh..." class="pos-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn--secondary" (click)="closeZoneModal()">Bekor qilish</button>
              <button class="btn btn--primary" (click)="saveZone()" [disabled]="!zoneForm.name.trim() || zoneForm.percentage === null || zoneForm.percentage < 0">
                <span>💾</span> Saqlash
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tables-page {
      padding: 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 4px;
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 14px;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .tables-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 600;
    }
    .stat-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .stat-pill--free .stat-indicator { background: var(--success); }
    .stat-pill--occupied .stat-indicator { background: var(--danger); }
    .stat-value {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    /* Zone Filter Tabs - Classic, Prominent & High Contrast */
    .zone-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      background: var(--bg-card);
      padding: 16px 20px;
      border-radius: var(--radius-lg, 12px);
      border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
    }

    .zone-tabs-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      flex: 1;
    }

    .zone-filter-header {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .zone-filter-icon {
      font-size: 16px;
    }

    .zone-filter-title {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .zone-tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .zone-tab {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 9px 18px;
      min-height: 44px;
      border-radius: 10px;
      border: 1.5px solid var(--border);
      background: var(--bg-main, #f8fafc);
      color: var(--text-primary, #1e293b);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      .zone-tab-icon {
        font-size: 17px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
      }

      .zone-tab-name {
        font-weight: 700;
        letter-spacing: -0.2px;
      }

      .zone-tab-pct {
        font-size: 11.5px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.3);
        line-height: 1.2;

        &--zero {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-muted, #64748b);
          border-color: rgba(148, 163, 184, 0.25);
          font-weight: 600;
        }
      }

      .zone-tab-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 800;
        background: rgba(0, 0, 0, 0.06);
        color: var(--text-primary);
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      &:hover {
        border-color: var(--primary);
        background: var(--bg-card);
        color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);

        .zone-tab-count {
          border-color: var(--primary);
          color: var(--primary);
        }
      }

      &.active {
        background: var(--primary);
        color: #ffffff;
        border-color: var(--primary);
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        transform: translateY(-1px);

        .zone-tab-icon {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        .zone-tab-pct {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.4);

          &--zero {
            background: rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.85);
            border-color: rgba(255, 255, 255, 0.25);
          }
        }

        .zone-tab-count {
          background: #ffffff;
          color: var(--primary);
          border-color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      }
    }

    .zone-action-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-zone-action {
      padding: 8px 14px;
      min-height: 40px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);

      &:hover {
        background: rgba(99, 102, 241, 0.1);
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-1px);
      }
      &--danger {
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.08);
        color: #ef4444;
        &:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }
      }
    }

    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .table-card {
      background: var(--bg-card);
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all var(--transition);
      position: relative;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      &--free {
        border-color: rgba(16, 185, 129, 0.4);
        &:hover { border-color: var(--success); }
      }

      &--occupied {
        border-color: rgba(239, 68, 68, 0.4);
        background: rgba(239, 68, 68, 0.05);
        &:hover { border-color: var(--danger); }
      }

      &--other-waiter {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.04);
        cursor: not-allowed;
        opacity: 0.9;
        &:hover {
          transform: none;
          box-shadow: none;
          border-color: rgba(239, 68, 68, 0.6);
        }
      }

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      &__number {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-primary);
      }

      &__zone-badge {
        margin-bottom: 8px;
        span {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
      }

      &__body {
        text-align: center;
        padding: 8px 0;
      }

      &__icon {
        font-size: 30px;
        margin-bottom: 6px;
      }

      &__name {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      &__capacity {
        font-size: 13px;
        color: var(--text-muted);
      }

      &__active-order {
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px dashed rgba(239, 68, 68, 0.4);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
      }

      &__item-count {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
      }

      &__amount {
        font-size: 16px;
        font-weight: 800;
        color: #ef4444;
        letter-spacing: 0.3px;
      }

      &__other-waiter-info {
        margin-top: 8px;
        padding: 8px;
        background: rgba(245, 158, 11, 0.08);
        border: 1px dashed rgba(245, 158, 11, 0.3);
        border-radius: var(--radius-md);
        text-align: center;
      }
      .other-waiter-badge {
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        color: #f59e0b;
        margin-bottom: 2px;
      }
      .other-waiter-hint {
        font-size: 11px;
        color: var(--text-muted);
        margin: 0;
      }

      &__footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
    }

    .table-status-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 100px;
      text-transform: uppercase;
    }
    .badge--free {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .badge--occupied {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    .badge--other-waiter {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .btn-action {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background var(--transition);

      &--order {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        &:hover { background: #10b981; color: white; }
      }

      &--view {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        &:hover { background: #ef4444; color: white; }
      }

      &--blocked {
        background: rgba(148, 163, 184, 0.15);
        color: var(--text-muted);
        cursor: not-allowed;
      }

      &--release {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        &:hover { background: #f59e0b; color: white; }
      }
    }

    .table-card__btn-group {
      display: flex;
      gap: 6px;
      width: 100%;
    }

    .btn {
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;

      &--primary {
        background: var(--primary);
        color: white;
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      &--secondary {
        background: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border);
      }
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      padding: 24px;
      box-shadow: var(--shadow-xl);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .modal-title {
      margin: 0 0 4px;
      color: var(--text-primary);
      font-size: 20px;
    }
    .modal-sub {
      margin: 0;
      color: var(--text-muted);
      font-size: 13px;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--text-muted);
      &:hover { color: var(--text-primary); }
    }
    .form-group {
      margin-bottom: 16px;
      label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
      }
    }
    .required-label {
      color: var(--text-primary) !important;
    }
    .label-hint {
      font-weight: normal;
      font-size: 12px;
      color: var(--text-muted);
    }
    .zone-select-row {
      display: flex;
      gap: 8px;
    }
    .pos-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-main);
      color: var(--text-primary);
      box-sizing: border-box;
      font-size: 14px;
    }
    .pos-select {
      cursor: pointer;
    }
    .btn-add-zone {
      white-space: nowrap;
      padding: 0 14px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--primary);
      border-radius: var(--radius-md);
      color: var(--primary);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: var(--primary);
        color: white;
      }
    }
    .custom-zone-input-wrap {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      padding: 8px;
      background: var(--bg-main);
      border-radius: var(--radius-md);
      border: 1px dashed var(--primary);
    }

    .percentage-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .percentage-symbol {
      position: absolute;
      right: 14px;
      font-weight: 700;
      color: var(--primary);
      pointer-events: none;
    }
    .field-validation-error {
      display: block;
      color: #ef4444;
      font-size: 12px;
      font-weight: 600;
      margin-top: 6px;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .loading-container, .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    .mt-4 { margin-top: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ============================================================
     * RESPONSIVE BREAKPOINTS (Mobile & Tablet)
     * ============================================================ */
    @media (max-width: 1023px) {
      .tables-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
    }

    @media (max-width: 767px) {
      .tables-page {
        gap: 10px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .header-actions {
          width: 100%;
          justify-content: flex-start;
          flex-wrap: wrap;

          .btn {
            flex: 1;
            min-height: 44px;
            justify-content: center;
          }
        }
      }

      .tables-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .stat-pill {
          padding: 8px 6px;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;

          .stat-label {
            font-size: 10.5px;
          }

          .stat-value {
            font-size: 14px;
          }
        }
      }

      .zone-filter-bar {
        padding: 8px 10px;
        margin-bottom: 8px;
      }

      .zone-tabs-wrap {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
      }

      .zone-filter-header {
        display: none;
      }

      .zone-tabs {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        gap: 8px;
        width: 100%;
        padding-bottom: 6px;

        &::-webkit-scrollbar {
          height: 3px;
        }
      }

      .zone-tab {
        padding: 7px 12px;
        min-height: 42px;
        font-size: 13px;
        white-space: nowrap;
        flex-shrink: 0;
        gap: 6px;

        .zone-tab-icon {
          font-size: 15px;
        }

        .zone-tab-name {
          font-size: 12.5px;
        }

        .zone-tab-pct {
          font-size: 10.5px;
          padding: 1px 5px;
        }

        .zone-tab-count {
          min-width: 20px;
          height: 20px;
          font-size: 11px;
        }
      }

      .zone-action-buttons {
        width: 100%;
        display: flex;
        gap: 8px;

        .btn-zone-action {
          flex: 1;
          justify-content: center;
          min-height: 40px;
        }
      }

      /* 2 COLUMNS ON MOBILE (Section 4 requirement) */
      .tables-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .table-card {
        padding: 10px 8px;
        border-radius: 12px;

        &__header {
          margin-bottom: 4px;
        }

        &__number {
          font-size: 15px;
        }

        .table-status-badge {
          font-size: 9.5px;
          padding: 2px 5px;
        }

        &__zone-badge {
          margin-bottom: 4px;
          span {
            font-size: 9.5px;
            padding: 1px 5px;
          }
        }

        &__body {
          padding: 4px 0;
        }

        &__icon {
          font-size: 22px;
          margin-bottom: 2px;
        }

        &__name {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &__capacity {
          font-size: 11px;
        }

        &__other-waiter-info {
          .other-waiter-badge {
            font-size: 10px;
          }
          .other-waiter-hint {
            display: none;
          }
        }

        &__active-order {
          .table-card__item-count {
            font-size: 11px;
          }
          .table-card__amount {
            font-size: 12.5px;
          }
        }

        &__footer {
          margin-top: 6px;
        }

        .btn-action {
          min-height: 42px;
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 8px;
          width: 100%;
        }

        .table-card__btn-group {
          display: flex;
          gap: 4px;

          .btn-action--view {
            flex: 2;
          }

          .btn-action--release {
            flex: 1;
            padding: 6px 4px;
            font-size: 11px;
          }
        }
      }
    }

    /* Small screens <= 359px */
    @media (max-width: 359px) {
      .tables-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }

      .table-card {
        padding: 8px 6px;

        &__number {
          font-size: 13.5px;
        }

        &__name {
          font-size: 12px;
        }

        .btn-action {
          min-height: 38px;
          font-size: 11px;
          padding: 4px;
        }
      }
    }
  `]
})
export class TablesComponent implements OnInit, OnDestroy {
  tables = signal<RestaurantTable[]>([]);
  zones = signal<TableZone[]>([]);
  selectedZoneId = signal<string | null>(null);
  loading = signal(true);
  showAddModal = signal(false);
  showCustomZone = signal(false);
  customZoneName = '';
  showZoneModal = signal(false);
  editingZoneId: string | null = null;
  zoneForm = {
    name: '',
    percentage: 5,
    description: ''
  };
  private wsUnsub?: () => void;

  newTable: CreateTableRequest = {
    zoneId: '',
    tableNumber: '',
    name: '',
    capacity: 4
  };

  freeCount = () => this.tables().filter(t => t.status === 'FREE').length;
  occupiedCount = () => this.tables().filter(t => t.status === 'OCCUPIED').length;

  isWaiter = computed(() => this.auth.isWaiter());

  selectedZone = computed(() => {
    const id = this.selectedZoneId();
    if (!id) return null;
    return this.zones().find(z => z.id === id) || null;
  });

  filteredTables = computed(() => {
    const zoneId = this.selectedZoneId();
    if (!zoneId) return this.tables();
    return this.tables().filter(t => t.zoneId === zoneId);
  });

  constructor(
    private tableService: TableService,
    private router: Router,
    private notify: NotificationService,
    public auth: AuthService,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    if (this.wsUnsub) {
      this.wsUnsub();
    }
  }

  private setupWebSocket(): void {
    const user = this.auth.user();
    if (user?.tenantId) {
      this.wsUnsub = this.wsService.subscribe<RestaurantTable>(
        `/topic/tables/${user.tenantId}`,
        (updatedTable) => {
          if (updatedTable && updatedTable.id) {
            this.tables.update(list => {
              const idx = list.findIndex(t => t.id === updatedTable.id);
              if (idx >= 0) {
                const next = [...list];
                next[idx] = { ...next[idx], ...updatedTable };
                return next;
              }
              return list;
            });
          }
        }
      );
    }
  }

  formatPrice(val?: number): string {
    if (!val) return '0 so‘m';
    return val.toLocaleString('uz-UZ') + ' so‘m';
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadZones();
    this.loadTables();
  }

  loadZones(): void {
    this.tableService.getZones().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.zones.set(res.data);
        }
      },
      error: () => {}
    });
  }

  loadTables(): void {
    this.tableService.getTables().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.tables.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Stollarni yuklashda xatolik yuz berdi');
      }
    });
  }

  selectZone(zoneId: string | null): void {
    this.selectedZoneId.set(zoneId);
  }

  countByZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId).length;
  }

  getZoneIcon(name?: string): string {
    if (!name) return '📍';
    const n = name.toLowerCase();
    if (n.includes('zal')) return '🏛️';
    if (n.includes('ko\'cha') || n.includes('kocha') || n.includes('tashqari')) return '🌳';
    if (n.includes('ayvon') || n.includes('terrasa')) return '⛱️';
    if (n.includes('podval') || n.includes('padval') || n.includes('lounge')) return '🍷';
    if (n.includes('vip')) return '⭐';
    return '📍';
  }

  canManageTables(): boolean {
    return !this.isWaiter() && this.auth.hasPermission('MANAGE_TABLES');
  }

  onSelectTable(table: RestaurantTable): void {
    if (table.status === 'OCCUPIED' && table.myTable === false) {
      this.notify.warning("Bu stol boshqa ofitsantga biriktirilgan.");
      return;
    }

    if (table.status === 'FREE') {
      // Yangi buyurtma: stolda mahsulot tanlanmasdan oldin bazada bo'sh buyurtma yaratilmaydi.
      // Mahsulot tanlanib "Oshxonaga yuborish" bosilgandagina buyurtma yaratiladi va stol band qilinadi.
      this.router.navigate(['/pos'], {
        queryParams: {
          tableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.name
        }
      });
      return;
    }

    this.router.navigate(['/pos'], {
      queryParams: {
        tableId: table.id,
        tableNumber: table.tableNumber,
        tableName: table.name,
        orderId: table.currentOrderId
      }
    });
  }

  onReleaseTable(event: Event, table: RestaurantTable): void {
    event.stopPropagation();
    this.tableService.releaseTable(table.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success(`Stol #${table.tableNumber} muvaffaqiyatli bo'shatildi`);
          this.loadTables();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Stolni bo'shatishda xatolik yuz berdi");
      }
    });
  }

  openAddModal(): void {
    if (this.isWaiter()) return;
    const defaultZone = this.selectedZoneId() || (this.zones().length > 0 ? this.zones()[0].id : '');
    this.newTable = {
      zoneId: defaultZone,
      tableNumber: '',
      name: '',
      capacity: 4
    };
    this.showCustomZone.set(false);
    this.customZoneName = '';
    this.showAddModal.set(true);
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.showCustomZone.set(false);
    this.customZoneName = '';
  }

  toggleCustomZone(): void {
    this.showCustomZone.update(v => !v);
  }

  addNewZone(): void {
    const name = this.customZoneName.trim();
    if (!name) return;

    this.tableService.createZone({ name }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notify.success(`"${res.data.name}" zonasi qo'shildi!`);
          this.zones.update(list => [...list, res.data]);
          this.newTable.zoneId = res.data.id;
          this.customZoneName = '';
          this.showCustomZone.set(false);
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Zona qo'shishda xatolik yuz berdi");
      }
    });
  }

  saveNewTable(): void {
    if (!this.newTable.tableNumber?.trim()) {
      this.notify.error("Stol raqami kiritilishi shart!");
      return;
    }
    if (!this.newTable.zoneId && !this.newTable.zoneName) {
      this.notify.error("Stol joylashuvi (Zal, Ko'cha, Ayvon, Podval...) tanlanishi shart!");
      return;
    }

    if (!this.newTable.name?.trim()) {
      this.newTable.name = 'Stol ' + this.newTable.tableNumber;
    }

    this.tableService.createTable(this.newTable).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success("Stol muvaffaqiyatli qo'shildi!");
          this.closeModal();
          this.loadTables();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Stol qo'shishda xatolik yuz berdi");
      }
    });
  }

  openAddZoneModal(): void {
    if (this.isWaiter()) return;
    this.editingZoneId = null;
    this.zoneForm = { name: '', percentage: 5, description: '' };
    this.showZoneModal.set(true);
  }

  openEditZoneModal(zone: TableZone): void {
    if (this.isWaiter()) return;
    this.editingZoneId = zone.id;
    this.zoneForm = {
      name: zone.name,
      percentage: zone.percentage ?? 0,
      description: zone.description || ''
    };
    this.showZoneModal.set(true);
  }

  closeZoneModal(): void {
    this.showZoneModal.set(false);
    this.editingZoneId = null;
  }

  saveZone(): void {
    if (!this.zoneForm.name.trim()) return;

    if (this.editingZoneId) {
      this.tableService.updateZone(this.editingZoneId, {
        name: this.zoneForm.name.trim(),
        percentage: Number(this.zoneForm.percentage) || 0,
        description: this.zoneForm.description.trim()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success(`"${res.data.name}" joyi muvaffaqiyatli yangilandi!`);
            this.closeZoneModal();
            this.loadZones();
          }
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Joyni yangilashda xatolik');
        }
      });
    } else {
      this.tableService.createZone({
        name: this.zoneForm.name.trim(),
        percentage: Number(this.zoneForm.percentage) || 0,
        description: this.zoneForm.description.trim()
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success(`"${res.data.name}" joyi muvaffaqiyatli yaratildi!`);
            this.closeZoneModal();
            this.loadZones();
          }
        },
        error: (err) => {
          this.notify.error(err.error?.message || 'Joy yaratishda xatolik');
        }
      });
    }
  }

  deleteCurrentZone(zone: TableZone): void {
    const tableCount = this.countByZone(zone.id);
    const tableWord = tableCount === 1 ? 'stol' : 'stol';
    const confirmMessage = tableCount > 0
      ? `"${zone.name}" joyini o'chirmoqchimisiz?\n\nBu amaliyot ushbu joyga tegishli ${tableCount} ta ${tableWord}ni ham o'chiradi.\n\nDavom etish uchun OK bosing.`
      : `"${zone.name}" joyini o'chirmoqchimisiz?\n\nDavom etish uchun OK bosing.`;

    if (!confirm(confirmMessage)) return;

    this.tableService.deleteZone(zone.id).subscribe({
      next: () => {
        const msg = tableCount > 0
          ? `"${zone.name}" joyi va ${tableCount} ta stol o'chirildi!`
          : `"${zone.name}" joyi o'chirildi!`;
        this.notify.success(msg);
        // Reset zone filter so deleted zone's tables won't remain visible
        this.selectedZoneId.set(null);
        // Refresh both zones and tables to reflect deletion
        this.loadZones();
        this.loadTables();
      },
      error: (err) => {
        // Backend returns Uzbek error message for active orders — show it directly
        const backendMsg: string = err?.error?.message || err?.error?.error || '';
        this.notify.error(backendMsg || 'Joyni o\'chirishda xatolik yuz berdi');
      }
    });
  }
}
