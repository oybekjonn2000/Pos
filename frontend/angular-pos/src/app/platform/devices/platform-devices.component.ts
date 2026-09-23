import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

export interface PlatformDeviceItem {
  id: string;
  installationId: string;
  deviceId: string;
  tenantId: string;
  restaurantName: string;
  restaurantCode: string;
  deviceName: string;
  deviceType: string;
  osInfo: string;
  appVersion: string;
  ipAddress: string;
  status: 'ACTIVE' | 'BLOCKED' | 'REVOKED';
  lastUserFullName: string;
  activatedAt: string;
  lastSeenAt: string;
  online: boolean;
}

@Component({
  selector: 'app-platform-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="platform-devices-page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">💻</div>
          <div>
            <h1 class="page-title">Qurilmalar Boshqaruvi (Desktop Terminals)</h1>
            <p class="page-subtitle">Restoranlarga biriktirilgan desktop .exe terminallari, ularning holati va xavfsizlik nazorati</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="pos-btn pos-btn--secondary" (click)="loadDevices()" [disabled]="loading()">
            <span>🔄 Yangilash</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-icon--purple">💻</div>
          <div class="metric-content">
            <span class="metric-label">Jami Terminallar</span>
            <span class="metric-value">{{ devices().length }}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon metric-icon--green">🟢</div>
          <div class="metric-content">
            <span class="metric-label">Online (Hozir faol)</span>
            <span class="metric-value">{{ onlineCount() }}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon metric-icon--blue">✓</div>
          <div class="metric-content">
            <span class="metric-label">Biriktirilgan (ACTIVE)</span>
            <span class="metric-value">{{ activeCount() }}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon metric-icon--amber">🔒</div>
          <div class="metric-content">
            <span class="metric-label">Bloklangan (BLOCKED)</span>
            <span class="metric-value">{{ blockedCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="pos-card toolbar-card">
        <div class="toolbar-left">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="pos-input search-input"
              placeholder="Restoran nomi, terminal yoki Installation ID bo‘yicha qidirish..."
              [(ngModel)]="searchQuery"
            />
            <button *ngIf="searchQuery" class="clear-search-btn" (click)="searchQuery = ''">✕</button>
          </div>

          <div class="filter-tabs">
            <button
              class="filter-tab"
              [class.active]="statusFilter === 'ALL'"
              (click)="statusFilter = 'ALL'">
              Barchasi ({{ devices().length }})
            </button>
            <button
              class="filter-tab"
              [class.active]="statusFilter === 'ACTIVE'"
              (click)="statusFilter = 'ACTIVE'">
              Faol ({{ activeCount() }})
            </button>
            <button
              class="filter-tab"
              [class.active]="statusFilter === 'BLOCKED'"
              (click)="statusFilter = 'BLOCKED'">
              Bloklangan ({{ blockedCount() }})
            </button>
            <button
              class="filter-tab"
              [class.active]="statusFilter === 'REVOKED'"
              (click)="statusFilter = 'REVOKED'">
              Bekor qilingan ({{ revokedCount() }})
            </button>
          </div>
        </div>
      </div>

      <!-- Devices Table -->
      <div class="pos-card table-card">
        <div *ngIf="loading() && devices().length === 0" class="state-container">
          <div class="spinner"></div>
          <p>Terminallar yuklanmoqda...</p>
        </div>

        <div *ngIf="!loading() && filteredDevices().length === 0" class="state-container empty-state">
          <div class="empty-icon">💻</div>
          <h3>Terminallar topilmadi</h3>
          <p *ngIf="searchQuery || statusFilter !== 'ALL'">Qidiruv filtriga mos terminal topilmadi.</p>
          <p *ngIf="!searchQuery && statusFilter === 'ALL'">Hozircha tizimda birorta desktop .exe o'rnatilmagan.</p>
        </div>

        <div class="table-responsive" *ngIf="filteredDevices().length > 0">
          <table class="pos-table">
            <thead>
              <tr>
                <th>Restoran</th>
                <th>Terminal Nomi</th>
                <th>Installation ID</th>
                <th>Tizim / Versiya</th>
                <th style="text-align: center;">Holati</th>
                <th>Oxirgi Faollik</th>
                <th>Oxirgi Xodim</th>
                <th style="text-align: right;">Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of filteredDevices()" [class.row-blocked]="d.status === 'BLOCKED'" [class.row-revoked]="d.status === 'REVOKED'">
                <td>
                  <div class="restaurant-cell">
                    <strong class="rest-name">{{ d.restaurantName }}</strong>
                    <span class="code-badge">{{ d.restaurantCode }}</span>
                  </div>
                </td>
                <td>
                  <div class="device-cell">
                    <span class="online-indicator" [class.is-online]="d.online" [title]="d.online ? 'Online (oxirgi 5 daqiqada faol)' : 'Offline'"></span>
                    <div>
                      <strong class="dev-name">{{ d.deviceName || 'Desktop POS' }}</strong>
                      <span class="dev-type">{{ d.deviceType }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="inst-badge" [title]="'Installation ID: ' + d.installationId + '\nDevice ID: ' + d.deviceId">
                    {{ d.installationId }}
                  </span>
                </td>
                <td>
                  <div class="os-info-cell" [title]="d.osInfo || ''">
                    <span class="os-text">{{ formatOs(d.osInfo) }}</span>
                    <span class="app-version">{{ d.appVersion || 'v1.0.0' }}</span>
                  </div>
                </td>
                <td style="text-align: center;">
                  <span class="status-chip"
                        [class.status-chip--active]="d.status === 'ACTIVE'"
                        [class.status-chip--blocked]="d.status === 'BLOCKED'"
                        [class.status-chip--revoked]="d.status === 'REVOKED'">
                    <span class="status-dot"></span>
                    {{ d.status }}
                  </span>
                </td>
                <td>
                  <span class="date-text" [title]="d.lastSeenAt">
                    {{ formatDate(d.lastSeenAt) }}
                  </span>
                </td>
                <td>
                  <span class="user-text">
                    {{ d.lastUserFullName || '—' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-buttons">
                    <!-- If ACTIVE -> Block -->
                    <button
                      *ngIf="d.status === 'ACTIVE'"
                      class="action-btn action-btn--block"
                      (click)="changeStatus(d, 'BLOCKED')"
                      title="Qurilmani vaqtincha bloklash">
                      🔒 Bloklash
                    </button>

                    <!-- If BLOCKED -> Activate -->
                    <button
                      *ngIf="d.status === 'BLOCKED'"
                      class="action-btn action-btn--activate"
                      (click)="changeStatus(d, 'ACTIVE')"
                      title="Qurilmani qayta faollashtirish">
                      ⚡ Faollashtirish
                    </button>

                    <!-- Revoke -->
                    <button
                      *ngIf="d.status !== 'REVOKED'"
                      class="action-btn action-btn--revoke"
                      (click)="changeStatus(d, 'REVOKED')"
                      title="Biriktiruvni butunlay bekor qilish (Revoke)">
                      ⛔ Revoke
                    </button>

                    <!-- Unbind / Delete -->
                    <button
                      class="action-btn action-btn--delete"
                      (click)="confirmUnbind(d)"
                      title="Qurilmani o'chirish (Unbind)">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .platform-devices-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
      border: 1px solid rgba(99, 102, 241, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;

      &--purple { background: rgba(99, 102, 241, 0.12); }
      &--green { background: rgba(16, 185, 129, 0.12); }
      &--amber { background: rgba(245, 158, 11, 0.12); }
      &--blue { background: rgba(59, 130, 246, 0.12); }
    }

    .metric-content {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .toolbar-card {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      flex: 1;
    }

    .search-input-wrap {
      position: relative;
      min-width: 280px;
      flex: 1;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding-left: 36px;
      padding-right: 32px;
      width: 100%;
    }

    .clear-search-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 12px;
    }

    .filter-tabs {
      display: flex;
      gap: 6px;
      background: var(--bg-tertiary);
      padding: 3px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }

    .filter-tab {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover { color: var(--text-primary); }
      &.active {
        background: var(--bg-card);
        color: var(--primary);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
    }

    .pos-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;

      th {
        background: var(--bg-tertiary);
        color: var(--text-muted);
        font-weight: 600;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        color: var(--text-secondary);
        vertical-align: middle;
      }

      tbody tr:hover {
        background: var(--bg-hover);
      }

      .row-blocked {
        opacity: 0.75;
        background: rgba(245, 158, 11, 0.04);
      }

      .row-revoked {
        opacity: 0.6;
        background: rgba(239, 68, 68, 0.04);
      }
    }

    .restaurant-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .rest-name {
      color: var(--text-primary);
      font-size: 13px;
    }

    .code-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--primary);
      background: rgba(99, 102, 241, 0.1);
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .device-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .online-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #94a3b8;
      flex-shrink: 0;

      &.is-online {
        background: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
    }

    .dev-name {
      display: block;
      color: var(--text-primary);
      font-size: 13px;
    }

    .dev-type {
      font-size: 11px;
      color: var(--text-muted);
    }

    .inst-badge {
      font-family: monospace;
      font-size: 11px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 6px;
      color: var(--text-primary);
    }

    .os-info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 180px;
    }

    .os-text {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .app-version {
      font-size: 10px;
      color: var(--text-muted);
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &--active {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        .status-dot { background: #10b981; }
      }

      &--blocked {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
        .status-dot { background: #f59e0b; }
      }

      &--revoked {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        .status-dot { background: #ef4444; }
      }
    }

    .date-text, .user-text {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
    }

    .action-btn {
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition);

      &:hover { background: var(--bg-hover); }

      &--block {
        border-color: rgba(245, 158, 11, 0.4);
        color: #f59e0b;
        &:hover { background: rgba(245, 158, 11, 0.15); }
      }

      &--activate {
        border-color: rgba(16, 185, 129, 0.4);
        color: #10b981;
        &:hover { background: rgba(16, 185, 129, 0.15); }
      }

      &--revoke {
        border-color: rgba(239, 68, 68, 0.4);
        color: #ef4444;
        &:hover { background: rgba(239, 68, 68, 0.15); }
      }

      &--delete {
        padding: 5px 8px;
        color: var(--text-muted);
        &:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
      }
    }

    .state-container {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
  `]
})
export class PlatformDevicesComponent implements OnInit {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private readonly API = `${environment.apiUrl}/platform/devices`;

  readonly devices = signal<PlatformDeviceItem[]>([]);
  readonly loading = signal<boolean>(false);

  searchQuery = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'BLOCKED' | 'REVOKED' = 'ALL';

  readonly onlineCount = computed(() => this.devices().filter(d => d.online).length);
  readonly activeCount = computed(() => this.devices().filter(d => d.status === 'ACTIVE').length);
  readonly blockedCount = computed(() => this.devices().filter(d => d.status === 'BLOCKED').length);
  readonly revokedCount = computed(() => this.devices().filter(d => d.status === 'REVOKED').length);

  readonly filteredDevices = computed(() => {
    let list = this.devices();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(d => d.status === this.statusFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(d =>
        (d.restaurantName || '').toLowerCase().includes(q) ||
        (d.restaurantCode || '').toLowerCase().includes(q) ||
        (d.deviceName || '').toLowerCase().includes(q) ||
        (d.installationId || '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<PlatformDeviceItem[]>>(this.API).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.devices.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error('Terminallar ro‘yxatini yuklab bo‘lmadi');
      }
    });
  }

  changeStatus(item: PlatformDeviceItem, newStatus: 'ACTIVE' | 'BLOCKED' | 'REVOKED'): void {
    const actionName = newStatus === 'BLOCKED' ? 'bloklash' : (newStatus === 'REVOKED' ? 'bekor qilish (revoke)' : 'faollashtirish');
    if (!confirm(`Haqiqatan ham "${item.restaurantName}" ga tegishli ushbu terminalni ${actionName}ni xohlaysizmi?`)) {
      return;
    }

    this.http.patch<ApiResponse<PlatformDeviceItem>>(`${this.API}/${item.id}/status`, { status: newStatus }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notify.success(`Terminal muvaffaqiyatli ${newStatus} holatiga o'tkazildi`);
          this.devices.update(list => list.map(d => d.id === item.id ? res.data : d));
        }
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Holatni yangilab bo‘lmadi');
      }
    });
  }

  confirmUnbind(item: PlatformDeviceItem): void {
    if (!confirm(`"${item.restaurantName}" terminalini o'chirish (Unbind) xohlaysizmi? Ushbu kompyuter qayta bog'lanmaguncha POS ga kira olmaydi.`)) {
      return;
    }

    this.http.delete<ApiResponse<void>>(`${this.API}/${item.id}`).subscribe({
      next: () => {
        this.notify.success('Terminal biriktiruvi o‘chirildi');
        this.devices.update(list => list.filter(d => d.id !== item.id));
      },
      error: (err) => {
        this.notify.error('Terminalni o‘chirishda xatolik yuz berdi');
      }
    });
  }

  formatOs(os: string): string {
    if (!os) return 'Desktop';
    if (os.includes('Windows')) return 'Windows';
    if (os.includes('Macintosh') || os.includes('Mac OS')) return 'macOS';
    if (os.includes('Linux')) return 'Linux';
    return os.substring(0, 25);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
