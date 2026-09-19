import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  maxKitchens: number;
  maxOrdersPerMonth: number;
  features: string[];
  active: boolean;
}

export interface CurrentSubscriptionResponse {
  id: string;
  planCode: string;
  planName: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING_PAYMENT';
  operating: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  autoRenew: boolean;
  price: number;
  currency: string;
  features: string[];
  currentUsers: number;
  maxUsers: number;
  currentTables: number;
  maxTables: number;
  currentProducts: number;
  maxProducts: number;
  currentKitchens: number;
  maxKitchens: number;
}

export interface CheckoutRequest {
  planId?: string;
  planCode?: string;
  provider?: string;
  months?: number;       // 1, 3, 6, 12
  extraWaiters?: number; // 2 ta tekin, qo'shimchasi oyiga 35_000 UZS
}

export interface CheckoutResponse {
  paymentId: string;
  amount: number;
  currency: string;
  provider: string;
  checkoutUrl: string;
  status: string;
  message: string;
}

export interface MockPayRequest {
  paymentId: string;
  simulateSuccess: boolean;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  providerTransactionId: string;
  planName: string;
  planCode: string;
  status: string;
  paidAt: string;
  createdAt: string;
  restaurantName: string;
  restaurantCode: string;
}

export interface PlatformSubscriptionOverview {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  subscriptions: TenantSubscriptionSummary[];
}

export interface TenantSubscriptionSummary {
  id: string;
  tenantId: string;
  restaurantName: string;
  restaurantCode: string;
  restaurantStatus: string;
  planName: string;
  planCode: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  operating: boolean;
}

export interface PlanSaveRequest {
  name: string;
  code?: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  maxKitchens: number;
  maxOrdersPerMonth: number;
  features: string[];
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private get apiPrefix(): string { return environment.apiUrl; }

  getPublicPlans(): Observable<PlanResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/public/plans`).pipe(
      map(res => res.data || [])
    );
  }

  getCurrentSubscription(): Observable<CurrentSubscriptionResponse> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/current`).pipe(
      map(res => res.data)
    );
  }

  getPaymentHistory(): Observable<PaymentHistoryItem[]> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/history`).pipe(
      map(res => res.data || [])
    );
  }

  initiateCheckout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/checkout`, req).pipe(
      map(res => res.data)
    );
  }

  mockPay(req: MockPayRequest): Observable<CurrentSubscriptionResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/mock-pay`, req).pipe(
      map(res => res.data)
    );
  }

  getPlatformOverview(): Observable<PlatformSubscriptionOverview> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/overview`).pipe(
      map(res => res.data)
    );
  }

  getPlatformPayments(): Observable<PaymentHistoryItem[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/payments`).pipe(
      map(res => res.data || [])
    );
  }

  getPlatformPlans(): Observable<PlanResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/plans`).pipe(
      map(res => res.data || [])
    );
  }

  createPlan(req: PlanSaveRequest): Observable<PlanResponse> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/plans`, req).pipe(
      map(res => res.data)
    );
  }

  updatePlan(id: string, req: PlanSaveRequest): Observable<PlanResponse> {
    return this.http.put<any>(`${this.apiPrefix}/platform/subscriptions/plans/${id}`, req).pipe(
      map(res => res.data)
    );
  }
}
