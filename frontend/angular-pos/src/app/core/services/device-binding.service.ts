import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, ApiResponse, TokenResponse } from './auth.service';
import { LanStatusService } from './lan-status.service';

export interface DeviceTenantInfo {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface DeviceEmployee {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: string;
  avatar?: string;
  kitchenId?: string;
  kitchenName?: string;
  kitchenIds?: string[];
  authenticationType?: string;
  isAdmin?: boolean;
  phone?: string;
}

export interface DeviceActivateRequest {
  username: string;
  password: string;
  installationId: string;
  deviceId: string;
  deviceName?: string;
  osInfo?: string;
  appVersion?: string;
}

export interface DeviceActivateResponse {
  installationId: string;
  deviceId: string;
  status: string;
  tenant: DeviceTenantInfo;
  employees: DeviceEmployee[];
}

export interface DeviceInfoDto {
  installationId: string;
  bound: boolean;
  status: string;
  tenant: DeviceTenantInfo;
  employees: DeviceEmployee[];
}

export interface EmployeeLoginRequest {
  installationId: string;
  deviceId?: string;
  employeeId?: string;
  username?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceBindingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private lan = inject(LanStatusService);
  private readonly API = `${environment.apiUrl}/auth/device`;

  readonly installationId = signal<string>(this.getOrCreateInstallationId());
  readonly deviceId = signal<string>(this.getOrCreateDeviceId());

  readonly boundRestaurant = signal<DeviceTenantInfo | null>(this.loadCachedTenant());
  readonly cachedEmployees = signal<DeviceEmployee[]>(this.loadCachedEmployees());
  readonly deviceStatus = signal<string>(this.loadCachedStatus());
  readonly loading = signal<boolean>(false);
  readonly selectedEmployee = signal<DeviceEmployee | null>(null);

  readonly isBound = computed(() => {
    return !!this.boundRestaurant() && this.deviceStatus() === 'ACTIVE';
  });

  constructor() {
    // Check device info on startup if running in desktop mode
    if (this.lan.isDesktop()) {
      this.refreshDeviceInfo().subscribe();
    }
  }

  /**
   * Generates or loads a persistent unique installation identifier for this desktop setup
   */
  getOrCreateInstallationId(): string {
    try {
      let id = localStorage.getItem('pos_installation_id');
      if (!id || id.trim() === '') {
        const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '').substring(0, 16)
          : Math.random().toString(36).substring(2, 18);
        id = `inst-${randomPart}`;
        localStorage.setItem('pos_installation_id', id);
      }
      return id;
    } catch {
      return `inst-${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Generates or loads persistent hardware/machine identifier
   */
  getOrCreateDeviceId(): string {
    try {
      let id = localStorage.getItem('pos_device_id');
      if (!id || id.trim() === '') {
        const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '').substring(0, 16)
          : Math.random().toString(36).substring(2, 18);
        id = `dev-${randomPart}`;
        localStorage.setItem('pos_device_id', id);
      }
      return id;
    } catch {
      return `dev-${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Check device status on server
   */
  refreshDeviceInfo(): Observable<ApiResponse<DeviceInfoDto> | null> {
    const instId = this.installationId();
    if (!instId) return of(null);

    this.loading.set(true);
    return this.http.get<ApiResponse<DeviceInfoDto>>(`${this.API}/info?installationId=${encodeURIComponent(instId)}`).pipe(
      tap(res => {
        this.loading.set(false);
        if (res.success && res.data) {
          if (res.data.bound) {
            this.boundRestaurant.set(res.data.tenant);
            this.cachedEmployees.set(res.data.employees || []);
            this.deviceStatus.set(res.data.status || 'ACTIVE');

            this.persistCachedData(res.data.tenant, res.data.employees || [], res.data.status || 'ACTIVE');
          } else {
            // Device is not yet bound to any restaurant
            this.boundRestaurant.set(null);
            this.cachedEmployees.set([]);
            this.deviceStatus.set('UNBOUND');
            this.clearCachedData();
          }
        }
      }),
      catchError(err => {
        this.loading.set(false);
        console.warn('Could not refresh device info from server:', err);
        return of(null);
      })
    );
  }

  /**
   * Initial Device Activation (binds terminal to restaurant account)
   */
  activate(username: string, password: string, deviceName?: string): Observable<ApiResponse<DeviceActivateResponse>> {
    this.loading.set(true);
    const req: DeviceActivateRequest = {
      username: username.trim(),
      password,
      installationId: this.installationId(),
      deviceId: this.deviceId(),
      deviceName: deviceName || (navigator.userAgent.includes('Windows') ? 'Windows POS Terminal' : 'Desktop Terminal'),
      osInfo: navigator.userAgent.substring(0, 200),
      appVersion: 'v1.0.0'
    };

    return this.http.post<ApiResponse<DeviceActivateResponse>>(`${this.API}/activate`, req).pipe(
      tap(res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.boundRestaurant.set(res.data.tenant);
          this.cachedEmployees.set(res.data.employees || []);
          this.deviceStatus.set(res.data.status || 'ACTIVE');

          this.persistCachedData(res.data.tenant, res.data.employees || [], res.data.status || 'ACTIVE');
        }
      }),
      catchError(err => {
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Employee Login via bound terminal (PIN or Password)
   */
  employeeLogin(employeeId: string, password: string): Observable<ApiResponse<TokenResponse>> {
    this.loading.set(true);
    const req: EmployeeLoginRequest = {
      installationId: this.installationId(),
      deviceId: this.deviceId(),
      employeeId,
      password
    };

    return this.http.post<ApiResponse<TokenResponse>>(`${this.API}/employee-login`, req).pipe(
      tap(res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.authService.storeTokens(res.data);
          try {
            localStorage.setItem('pos_last_employee_id', employeeId);
          } catch {}
        }
      }),
      catchError(err => {
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Select an employee for PIN/Password entry
   */
  selectEmployee(emp: DeviceEmployee | null): void {
    this.selectedEmployee.set(emp);
  }

  /**
   * Local cache helpers
   */
  private loadCachedTenant(): DeviceTenantInfo | null {
    try {
      const stored = localStorage.getItem('pos_bound_tenant');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private loadCachedEmployees(): DeviceEmployee[] {
    try {
      const stored = localStorage.getItem('pos_cached_employees');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private loadCachedStatus(): string {
    try {
      return localStorage.getItem('pos_device_status') || 'UNBOUND';
    } catch {
      return 'UNBOUND';
    }
  }

  private persistCachedData(tenant: DeviceTenantInfo, employees: DeviceEmployee[], status: string): void {
    try {
      localStorage.setItem('pos_bound_tenant', JSON.stringify(tenant));
      localStorage.setItem('pos_cached_employees', JSON.stringify(employees));
      localStorage.setItem('pos_device_status', status);
    } catch (e) {
      console.warn('Could not persist device binding cache to localStorage', e);
    }
  }

  private clearCachedData(): void {
    try {
      localStorage.removeItem('pos_bound_tenant');
      localStorage.removeItem('pos_cached_employees');
      localStorage.setItem('pos_device_status', 'UNBOUND');
    } catch {}
  }

  /**
   * Completely unbinds local terminal, purges cached restaurant data and resets to initial activation screen.
   */
  unbindLocalTerminal(): void {
    this.clearCachedData();
    try {
      localStorage.removeItem('pos_installation_id');
      localStorage.removeItem('pos_device_id');
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_bound_tenant');
      localStorage.removeItem('pos_cached_employees');
      localStorage.setItem('pos_device_status', 'UNBOUND');
    } catch {}

    this.boundRestaurant.set(null);
    this.cachedEmployees.set([]);
    this.deviceStatus.set('UNBOUND');
    this.selectedEmployee.set(null);
    this.installationId.set(this.getOrCreateInstallationId());
    this.deviceId.set(this.getOrCreateDeviceId());
    this.authService.logout();

    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.clearAllStorage === 'function') {
        electronAPI.clearAllStorage().catch(() => {});
      }
    } catch {}
  }
}

