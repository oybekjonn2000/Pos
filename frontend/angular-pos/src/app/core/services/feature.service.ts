import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { BillingService, CurrentSubscriptionResponse } from './billing.service';
import { AuthService } from './auth.service';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  readonly features = signal<string[]>(this.loadCachedFeatures());
  readonly currentPlanCode = signal<string>(this.loadCachedPlanCode());
  readonly isOperating = signal<boolean>(true);
  readonly subscription = signal<CurrentSubscriptionResponse | null>(null);
  readonly loading = signal<boolean>(false);

  readonly isPro = computed(() => {
    const plan = (this.currentPlanCode() || '').toUpperCase();
    return plan === 'PRO' || this.features().some(f => f.toUpperCase() === 'KITCHEN_DISPLAY');
  });

  readonly canAccessKds = computed(() => {
    // Super admin always has access
    if (this.authService.isSuperAdmin()) return true;
    const plan = (this.currentPlanCode() || '').toUpperCase();
    if (plan === 'PRO') return true;
    return this.features().some(f => f.toUpperCase() === 'KITCHEN_DISPLAY');
  });

  readonly canAccessMobileApp = computed(() => {
    if (this.authService.isSuperAdmin()) return true;
    const plan = (this.currentPlanCode() || '').toUpperCase();
    if (plan === 'PRO') return true;
    return this.features().some(f => f.toUpperCase() === 'MOBILE_APP');
  });

  constructor() {
    // Automatically load or reload features whenever authenticated user changes
    effect(() => {
      const user = this.authService.user();
      const isAuth = this.authService.isAuthenticated();
      const isSuper = this.authService.isSuperAdmin();

      if (isAuth && !isSuper) {
        this.refreshFeatures().subscribe();
      } else if (!isAuth) {
        this.clearCache();
      }
    });
  }

  hasFeature(featureCode: string): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.isPro()) return true;
    return this.features().some(f => f.toUpperCase() === featureCode.toUpperCase());
  }

  refreshFeatures(): Observable<CurrentSubscriptionResponse | null> {
    if (!this.authService.isAuthenticated() || this.authService.isSuperAdmin()) {
      return of(null);
    }

    this.loading.set(true);
    return this.billingService.getCurrentSubscription().pipe(
      tap(sub => {
        this.loading.set(false);
        if (sub) {
          const plan = (sub.planCode || 'STANDARD').toUpperCase();
          const feats = sub.features || [];
          this.subscription.set(sub);
          this.currentPlanCode.set(plan);
          this.isOperating.set(sub.operating);
          this.features.set(feats);

          try {
            localStorage.setItem('restaurant_plan_code', plan);
            localStorage.setItem('restaurant_features', JSON.stringify(feats));
          } catch (e) {}
        }
      }),
      catchError(err => {
        this.loading.set(false);
        console.warn('Could not load subscription features:', err);
        return of(null);
      })
    );
  }

  private loadCachedPlanCode(): string {
    try {
      return localStorage.getItem('restaurant_plan_code') || 'STANDARD';
    } catch {
      return 'STANDARD';
    }
  }

  private loadCachedFeatures(): string[] {
    try {
      const raw = localStorage.getItem('restaurant_features');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private clearCache(): void {
    this.features.set([]);
    this.currentPlanCode.set('STANDARD');
    this.subscription.set(null);
    try {
      localStorage.removeItem('restaurant_plan_code');
      localStorage.removeItem('restaurant_features');
    } catch (e) {}
  }
}
