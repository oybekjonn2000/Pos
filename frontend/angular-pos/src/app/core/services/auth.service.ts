import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  deviceId?: string;
  restaurantCode?: string;
}

export interface RegisterRequest {
  ownerName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  restaurantName: string;
  restaurantPhone?: string;
  restaurantCode?: string;
  address?: string;
  city?: string;
  district?: string;
  inn?: string;
  logoUrl?: string;
  planCode?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  fullName: string;
  tenantId?: string;
  restaurantCode?: string;
  restaurantName?: string;
  restaurantStatus?: string;
  isSuperAdmin?: boolean;
  role?: string;
  kitchenId?: string;
  permissions: string[];
}

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  page?: PageMeta;
  message: string | null;
  errorCode: string | null;
  timestamp: string;
}

/**
 * Core authentication service using Angular Signals.
 * Manages JWT tokens, user state, and permissions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // Signals for reactive state
  private _user = signal<UserInfo | null>(this.loadUser());
  private _accessToken = signal<string | null>(this.loadToken());

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !!this._accessToken());
  readonly permissions = computed(() => new Set(this._user()?.permissions ?? []));
  readonly isSuperAdmin = computed(() => {
    const role = (this._user()?.role || '').toUpperCase();
    return role === 'SUPER_ADMIN' || role === 'ROLE_SUPER_ADMIN' || this._user()?.isSuperAdmin === true || this._user()?.username === 'superadmin';
  });
  readonly restaurantCode = computed(() => this._user()?.restaurantCode || '');
  readonly restaurantName = computed(() => this._user()?.restaurantName || (this.isSuperAdmin() ? 'Platform Admin' : 'Demo Restaurant'));
  readonly isAdmin = computed(() => {
    const role = (this._user()?.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'RESTAURANT_ADMIN' || role === 'SUPER_ADMIN' || this._user()?.username === 'admin';
  });
  readonly isWaiter = computed(() => {
    const role = (this._user()?.role || '').toUpperCase();
    return role === 'WAITER' || role === 'ROLE_WAITER';
  });
  readonly isKitchen = computed(() => {
    const role = (this._user()?.role || '').toUpperCase();
    return role === 'KITCHEN' || role === 'ROLE_KITCHEN';
  });

  isAdminUser(): boolean {
    return this.isAdmin();
  }

  constructor(private http: HttpClient, private router: Router) { }

  login(request: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API}/login`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeTokens(response.data);
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API}/register`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeTokens(response.data);
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<TokenResponse> | null> {
    const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    if (!refreshToken) return of(null);

    return this.http.post<ApiResponse<TokenResponse>>(`${this.API}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeTokens(response.data);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    try {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch {}
    this._user.set(null);
    this._accessToken.set(null);
    this.router.navigate(['/login']);
  }

  hasPermission(permission: string): boolean {
    if (this.isAdmin()) return true;
    return this.permissions().has(permission);
  }

  hasRole(role: string): boolean {
    const currentRole = (this._user()?.role || '').toUpperCase();
    return currentRole === role.toUpperCase();
  }

  hasAnyPermission(perms: string[]): boolean {
    if (this.isAdmin()) return true;
    return perms.some(p => this.permissions().has(p));
  }

  getCurrentUser(): UserInfo | null {
    return this._user();
  }

  getDefaultRoute(): string {
    if (this.isSuperAdmin()) return '/platform/dashboard';
    const role = (this._user()?.role || '').toUpperCase();
    if (role === 'WAITER') return '/tables';
    if (role === 'KITCHEN') return '/kitchen';
    if (role === 'CASHIER') return '/orders';
    return '/dashboard';
  }

  storeTokens(data: TokenResponse): void {
    try {
      // Store in sessionStorage so auth is discarded on application restart / window close
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      // Purge any persistent localStorage auth keys
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (e) {
      console.warn('Could not store auth tokens in sessionStorage', e);
    }
    this._accessToken.set(data.accessToken);
    this._user.set(data.user);
  }

  private loadToken(): string | null {
    try {
      // Purge any leftover legacy tokens in localStorage on app startup
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return sessionStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  private loadUser(): UserInfo | null {
    try {
      const stored = sessionStorage.getItem('user');
      if (!stored || stored === 'undefined' || stored === 'null') {
        return null;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user from sessionStorage', e);
      return null;
    }
  }
}
