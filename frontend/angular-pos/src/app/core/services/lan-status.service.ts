import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WebsocketService } from './websocket.service';
import { Subject } from 'rxjs';

export interface ServerLanInfo {
  status: string;
  serverName: string;
  version: string;
  port: number;
  serverTime: string;
  timestamp: number;
  databaseStatus: string;
}

export type LanConnectionState = 'ONLINE' | 'RECONNECTING' | 'OFFLINE';

@Injectable({ providedIn: 'root' })
export class LanStatusService implements OnDestroy {
  private http = inject(HttpClient);
  private ws = inject(WebsocketService);

  readonly connectionState = signal<LanConnectionState>('ONLINE');
  readonly currentServerUrl = signal<string>(environment.baseUrl);
  readonly serverInfo = signal<ServerLanInfo | null>(null);
  readonly latencyMs = signal<number>(0);
  readonly justReconnected = signal<boolean>(false);

  // Observable for views to refresh data when connection is restored
  readonly onConnectionRestored$ = new Subject<void>();

  private pingTimer: any = null;
  private retryDelayMs = 2000;
  private readonly maxRetryDelayMs = 10000;
  private isDestroyed = false;

  constructor() {
    this.startHeartbeat();

    // Listen to browser network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkImmediate());
      window.addEventListener('offline', () => {
        this.connectionState.set('OFFLINE');
      });
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
    }
  }

  /**
   * Fast check against the currently configured server
   */
  async checkImmediate(): Promise<boolean> {
    const start = performance.now();
    try {
      const url = `${environment.apiUrl.replace(/\/api\/?$/, '')}/api/system/lan-info`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data: ServerLanInfo = await res.json();
        const latency = Math.round(performance.now() - start);
        this.latencyMs.set(latency);
        this.serverInfo.set(data);

        const wasOffline = this.connectionState() !== 'ONLINE';
        this.connectionState.set('ONLINE');
        this.retryDelayMs = 2000;

        if (wasOffline) {
          console.log('[LAN] Central serverga ulanish tiklandi!');
          this.justReconnected.set(true);
          setTimeout(() => this.justReconnected.set(false), 4000);
          this.ws.reconnectWithUrl();
          this.onConnectionRestored$.next();
        }
        return true;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      const prev = this.connectionState();
      this.connectionState.set(prev === 'ONLINE' ? 'RECONNECTING' : 'OFFLINE');
      return false;
    }
  }

  /**
   * Test connection to a specific candidate server URL
   */
  async testServer(rawUrl: string): Promise<{ ok: boolean; latencyMs: number; info?: ServerLanInfo; error?: string }> {
    const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
    const start = performance.now();
    try {
      const pingUrl = `${cleanUrl}/api/system/lan-info`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(pingUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: ServerLanInfo = await res.json();
        const latencyMs = Math.round(performance.now() - start);
        return { ok: true, latencyMs, info: data };
      }
      return { ok: false, latencyMs: 0, error: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: 0,
        error: err.name === 'AbortError' ? 'Ulanish vaqti tugadi (Timeout)' : (err.message || 'Serverga ulanib bo‘lmadi')
      };
    }
  }

  /**
   * Save new server URL and reconfigure runtime
   */
  setAndApplyServerUrl(url: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    environment.setServerUrl(cleanUrl);
    this.currentServerUrl.set(cleanUrl);
    this.ws.reconnectWithUrl();
    this.checkImmediate();
  }

  private startHeartbeat(): void {
    const scheduleNext = () => {
      if (this.isDestroyed) return;

      const delay = this.connectionState() === 'ONLINE' ? 12000 : this.retryDelayMs;
      this.pingTimer = setTimeout(async () => {
        const ok = await this.checkImmediate();
        if (!ok) {
          // Exponential backoff: 2s -> 4s -> 8s -> 10s max
          this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxRetryDelayMs);
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }
}
