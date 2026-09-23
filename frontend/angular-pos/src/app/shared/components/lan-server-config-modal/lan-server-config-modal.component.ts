import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanStatusService, ServerLanInfo } from '../../../core/services/lan-status.service';

@Component({
  selector: 'app-lan-server-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lan-modal-backdrop">
      <div class="lan-modal-card" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="lan-modal-header">
          <div class="header-title">
            <span class="icon">🌐</span>
            <div>
              <h3>Mahalliy Tarmoq (LAN) Server Sozlamalari</h3>
              <p class="subtitle">Markaziy POS Server bilan ulanishni boshqarish</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Current Status Banner -->
        <div class="status-card" [ngClass]="lan.connectionState().toLowerCase()">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <div class="status-text">
              <span class="state-label">
                @if (lan.connectionState() === 'ONLINE') { 🟢 Serverga ulanish faol (ONLINE) }
                @else if (lan.connectionState() === 'RECONNECTING') { 🟡 Server bilan qayta ulanilmoqda... }
                @else { 🔴 Server bilan aloqa yo'q (OFFLINE) }
              </span>
              <span class="latency-text" *ngIf="lan.connectionState() === 'ONLINE'">
                Kechikish: <strong>{{ lan.latencyMs() }} ms</strong> | Baza: <strong>{{ lan.serverInfo()?.databaseStatus || 'OK' }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Form Section -->
        <div class="lan-modal-body">
          <div class="form-group">
            <label>Markaziy Server IP Manzili:</label>
            <div class="input-with-icon">
              <span class="input-icon">💻</span>
              <input type="text" [(ngModel)]="serverIp" placeholder="Masalan: 192.168.1.100 yoki localhost" class="form-input" />
            </div>
            <span class="hint">Admin kompyuterining lokal Wi-Fi yoki LAN routerdagi IP manzili</span>
          </div>

          <div class="form-group">
            <label>Server Porti:</label>
            <div class="input-with-icon">
              <span class="input-icon">🔌</span>
              <input type="number" [(ngModel)]="serverPort" placeholder="8080" class="form-input port-input" />
            </div>
          </div>

          <!-- Test result box -->
          <div *ngIf="testResult()" class="test-result-box" [class.success]="testResult()?.ok" [class.error]="!testResult()?.ok">
            <span class="res-icon">{{ testResult()?.ok ? '✅' : '⚠️' }}</span>
            <div class="res-info">
              <div class="res-msg">{{ testResult()?.ok ? 'Ulanish muvaffaqiyatli!' : (testResult()?.error || 'Ulanib bo‘lmadi') }}</div>
              <div *ngIf="testResult()?.ok" class="res-sub">
                Server: {{ testResult()?.info?.serverName }} (v{{ testResult()?.info?.version }}) | Kechikish: {{ testResult()?.latencyMs }}ms
              </div>
            </div>
          </div>

          <!-- Discovery banner if searching -->
          <div *ngIf="isDiscovering()" class="discovery-box">
            <span class="spinner"></span>
            <span>LAN tarmoq ichida markaziy POS Server qidirilmoqda (UDP broadcast)...</span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="lan-modal-footer">
          <div class="left-actions">
            <button class="btn-discover" [disabled]="isTesting() || isDiscovering()" (click)="discoverServer()">
              🔍 Avtomatik Qidirish
            </button>
            <button class="btn-test" [disabled]="isTesting()" (click)="testConnection()">
              <span *ngIf="isTesting()" class="spinner-small"></span>
              {{ isTesting() ? 'Tekshirilmoqda...' : '⚡ Ulanishni Tekshirish' }}
            </button>
          </div>

          <div class="right-actions">
            <button class="btn-secondary" (click)="close()">Bekor qilish</button>
            <button class="btn-primary" [disabled]="isTesting()" (click)="saveAndApply()">
              💾 Saqlash va Ulanish
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .lan-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 13, 0.82);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }

    .lan-modal-card {
      width: 580px;
      max-width: 92vw;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    .lan-modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-secondary);

      .header-title {
        display: flex;
        align-items: center;
        gap: 14px;

        .icon {
          font-size: 28px;
        }

        h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 3px 0 0 0;
          font-size: 12px;
          color: #94a3b8;
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }

    .status-card {
      margin: 18px 24px 0 24px;
      padding: 12px 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);

      &.online {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.25);
        .pulse-dot { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .state-label { color: #34d399; }
      }

      &.reconnecting {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.25);
        .pulse-dot { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
        .state-label { color: #fbbf24; }
      }

      &.offline {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.25);
        .pulse-dot { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
        .state-label { color: #f87171; }
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .pulse-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }

      .status-text {
        display: flex;
        flex-direction: column;
        font-size: 13px;

        .state-label {
          font-weight: 600;
        }

        .latency-text {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }
      }
    }

    .lan-modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }

        .hint {
          font-size: 11px;
          color: #64748b;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;

          .input-icon {
            position: absolute;
            left: 12px;
            font-size: 15px;
            pointer-events: none;
            opacity: 0.7;
          }

          .form-input {
            width: 100%;
            padding: 10px 14px 10px 38px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 14px;
            font-family: 'Consolas', monospace;
            transition: all 0.2s;

            &:focus {
              outline: none;
              border-color: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            }
          }

          .port-input {
            width: 160px;
          }
        }
      }
    }

    .test-result-box {
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;

      &.success {
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #34d399;
      }

      &.error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
      }

      .res-icon {
        font-size: 20px;
      }

      .res-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .res-msg {
          font-weight: 600;
        }

        .res-sub {
          font-size: 11px;
          color: #94a3b8;
        }
      }
    }

    .discovery-box {
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .spinner, .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .lan-modal-footer {
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .left-actions, .right-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      button {
        padding: 9px 15px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex;
        align-items: center;
        gap: 6px;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-discover {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border);
        &:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
      }

      .btn-test {
        background: rgba(99, 102, 241, 0.12);
        color: var(--primary);
        border: 1px solid rgba(99, 102, 241, 0.3);
        &:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.22);
        }
      }

      .btn-secondary {
        background: transparent;
        color: var(--text-muted);
        &:hover {
          color: var(--text-primary);
        }
      }

      .btn-primary {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class LanServerConfigModalComponent {
  lan = inject(LanStatusService);

  @Output() closed = new EventEmitter<void>();

  serverIp: string = '';
  serverPort: number = 8080;

  isTesting = signal<boolean>(false);
  isDiscovering = signal<boolean>(false);
  testResult = signal<{ ok: boolean; latencyMs: number; info?: ServerLanInfo; error?: string } | null>(null);

  constructor() {
    this.initFromCurrent();
  }

  private initFromCurrent(): void {
    const raw = this.lan.currentServerUrl();
    try {
      const url = new URL(raw);
      this.serverIp = url.hostname;
      this.serverPort = url.port ? parseInt(url.port, 10) : 8080;
    } catch (e) {
      this.serverIp = 'localhost';
      this.serverPort = 8080;
    }
  }

  async testConnection(): Promise<void> {
    const ip = this.serverIp.trim() || 'localhost';
    const targetUrl = `http://${ip}:${this.serverPort}`;
    this.isTesting.set(true);
    this.testResult.set(null);

    const result = await this.lan.testServer(targetUrl);
    this.testResult.set(result);
    this.isTesting.set(false);
  }

  async discoverServer(): Promise<void> {
    this.isDiscovering.set(true);
    this.testResult.set(null);

    // If Electron IPC is available, request UDP discovery
    if (typeof window !== 'undefined' && (window as any).electronAPI?.discoverServer) {
      try {
        const found = await (window as any).electronAPI.discoverServer();
        if (found && found.ip) {
          this.serverIp = found.ip;
          this.serverPort = found.port || 8080;
          this.testConnection();
        } else {
          this.testResult.set({ ok: false, latencyMs: 0, error: 'LAN tarmoqda POS Server topilmadi. IP manzilni qo‘lda kiriting.' });
        }
      } catch (e: any) {
        this.testResult.set({ ok: false, latencyMs: 0, error: e.message || 'Auto-discovery xatosi' });
      }
    } else {
      // Browser fallback: test common local subnet / localhost
      await this.testConnection();
    }
    this.isDiscovering.set(false);
  }

  saveAndApply(): void {
    const ip = this.serverIp.trim() || 'localhost';
    const targetUrl = `http://${ip}:${this.serverPort}`;
    this.lan.setAndApplyServerUrl(targetUrl);

    // Also notify Electron if available
    if (typeof window !== 'undefined' && (window as any).electronAPI?.saveServerConfig) {
      (window as any).electronAPI.saveServerConfig({ serverUrl: targetUrl });
    }

    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
