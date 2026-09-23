import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  billingPeriod: string;
  trialEnabled: boolean;
  trialDays: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  maxKitchens: number;
  maxDevices: number;
  maxBranches: number;
  maxOrdersPerMonth: number;
  features: string[];
  active: boolean;
  archived: boolean;
  sortOrder: number;
}

export interface CurrentSubscriptionResponse {
  id: string;
  planCode: string;
  planName: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING_PAYMENT' | 'PAYMENT_FAILED';
  operating: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  autoRenew: boolean;
  price: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  notes?: string;
  nextPlanCode?: string;
  nextPlanName?: string;
  hasScheduledDowngrade?: boolean;
  warningLevel: 'NONE' | '7_DAYS' | '3_DAYS' | '1_DAY' | 'EXPIRED';
  currentUsers: number;
  maxUsers: number;
  currentWaiters?: number;
  currentChefs?: number;
  currentTables: number;
  maxTables: number;
  currentProducts: number;
  maxProducts: number;
  currentCategories?: number;
  currentHalls?: number;
  currentKitchens: number;
  maxKitchens: number;
  currentDevices: number;
  maxDevices: number;
  currentOrders?: number;
  currentMonthOrders: number;
  maxOrdersPerMonth: number;
  currentPrinters?: number;
  trialStartDate?: string;
  trialEndDate?: string;
}

export interface CalculatePriceRequest {
  planId?: string;
  planCode?: string;
  months?: number;
  extraWaiters?: number;
}

export interface CalculatePriceResponse {
  planId: string;
  planCode: string;
  planName: string;
  months: number;
  monthlyPrice: number;
  yearlyPrice: number;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  adjustmentAmount: number;
  extraWaiters: number;
  extraWaitersAmount: number;
  finalAmount: number;
  currency: string;
  isUpgrade: boolean;
  isDowngrade: boolean;
  isRenewal: boolean;
  prorationCredit: number;
  effectiveStartDate: string;
  note: string;
}

export interface CheckoutRequest {
  planId?: string;
  planCode?: string;
  provider?: string;
  months?: number;
  extraWaiters?: number;
  notes?: string;
}

export interface CheckoutResponse {
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  baseAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  finalAmount: number;
  currency: string;
  provider: string;
  checkoutUrl: string;
  status: string;
  message: string;
  isDowngradeScheduled: boolean;
  effectiveDate: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  restaurantName: string;
  restaurantCode: string;
  planCode: string;
  planName: string;
  durationMonths: number;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  adjustmentAmount: number;
  finalAmount: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  paymentMethod: string;
  notes?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface SubscriptionPeriodResponse {
  id: string;
  planName: string;
  planCode: string;
  startDate: string;
  endDate: string;
  periodType: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
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

export interface DiscountRuleDto {
  id?: string;
  minMonths: number;
  discountPercent: number;
  name?: string;
  active: boolean;
}

export interface ManualActivationRequest {
  tenantId: string;
  planId?: string;
  planCode?: string;
  months?: number;
  startDate?: string;
  endDate?: string;
  discountPercent?: number;
  adjustmentAmount?: number;
  notes?: string;
}

export interface AuditLogResponse {
  id: string;
  tenantId?: string;
  restaurantName?: string;
  userId?: string;
  username?: string;
  role?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformSubscriptionOverview {
  totalSubscriptions: number;
  activeSubscriptions: number;
  standardSubscriptions?: number;
  proSubscriptions?: number;
  trialSubscriptions: number;
  expiringSoonSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions?: number;
  pendingPaymentSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  totalDiscountsGiven: number;
  manualPaymentsCount: number;
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
  yearlyPrice: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  operating: boolean;
  nextPlanName?: string;
}

export interface PlanSaveRequest {
  name: string;
  code?: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  currency: string;
  billingPeriod: string;
  trialEnabled?: boolean;
  trialDays: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  maxKitchens: number;
  maxDevices?: number;
  maxBranches?: number;
  maxOrdersPerMonth: number;
  features: string[];
  active?: boolean;
  archived?: boolean;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private get apiPrefix(): string { return environment.apiUrl; }

  // ==========================================
  // RESTAURANT CLIENT BILLING
  // ==========================================

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

  calculatePrice(req: CalculatePriceRequest): Observable<CalculatePriceResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/calculate`, req).pipe(
      map(res => res.data)
    );
  }

  getPaymentHistory(): Observable<PaymentHistoryItem[]> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/history`).pipe(
      map(res => res.data || [])
    );
  }

  getInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/invoices`).pipe(
      map(res => res.data || [])
    );
  }

  getPeriods(): Observable<SubscriptionPeriodResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/periods`).pipe(
      map(res => res.data || [])
    );
  }

  initiateCheckout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/checkout`, req).pipe(
      map(res => res.data)
    );
  }

  // ==========================================
  // PLATFORM / SUPER ADMIN BILLING
  // ==========================================

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

  getPlatformInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/invoices`).pipe(
      map(res => res.data || [])
    );
  }

  markInvoiceAsPaid(invoiceId: string, adminNotes?: string): Observable<InvoiceResponse> {
    let params = new HttpParams();
    if (adminNotes) {
      params = params.set('adminNotes', adminNotes);
    }
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/invoices/${invoiceId}/mark-paid`, {}, { params }).pipe(
      map(res => res.data)
    );
  }

  manualActivate(req: ManualActivationRequest): Observable<CurrentSubscriptionResponse> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/manual-activate`, req).pipe(
      map(res => res.data)
    );
  }

  suspendSubscription(subscriptionId: string, reason?: string): Observable<TenantSubscriptionSummary> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/${subscriptionId}/suspend`, {}, { params }).pipe(
      map(res => res.data)
    );
  }

  resumeSubscription(subscriptionId: string): Observable<TenantSubscriptionSummary> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/${subscriptionId}/resume`, {}).pipe(
      map(res => res.data)
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

  archivePlan(id: string): Observable<PlanResponse> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/plans/${id}/archive`, {}).pipe(
      map(res => res.data)
    );
  }

  getDiscountRules(): Observable<DiscountRuleDto[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/discounts`).pipe(
      map(res => res.data || [])
    );
  }

  saveDiscountRule(req: DiscountRuleDto): Observable<DiscountRuleDto> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/discounts`, req).pipe(
      map(res => res.data)
    );
  }

  updateDiscountRule(id: string, req: DiscountRuleDto): Observable<DiscountRuleDto> {
    return this.http.put<any>(`${this.apiPrefix}/platform/subscriptions/discounts/${id}`, req).pipe(
      map(res => res.data)
    );
  }

  deleteDiscountRule(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiPrefix}/platform/subscriptions/discounts/${id}`).pipe(
      map(() => void 0)
    );
  }

  getAuditLogs(): Observable<AuditLogResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/audit-logs`).pipe(
      map(res => res.data || [])
    );
  }

  processMockPayment(paymentId: string, outcome: string): Observable<CurrentSubscriptionResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/mock-pay`, { paymentId, outcome }).pipe(
      map(res => res.data)
    );
  }

  getPaymentProviderSettings(): Observable<PaymentProviderSettingResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/platform/payment-settings`).pipe(
      map(res => res.data || [])
    );
  }

  updatePaymentProviderSetting(id: string, req: PaymentProviderSettingUpdateRequest): Observable<PaymentProviderSettingResponse> {
    return this.http.put<any>(`${this.apiPrefix}/platform/payment-settings/${id}`, req).pipe(
      map(res => res.data)
    );
  }

  updatePaymentProviderSettingByCode(code: string, req: PaymentProviderSettingUpdateRequest): Observable<PaymentProviderSettingResponse> {
    return this.http.put<any>(`${this.apiPrefix}/platform/payment-settings/by-code/${code}`, req).pipe(
      map(res => res.data)
    );
  }

  // ==========================================
  // SUBSCRIPTION REQUESTS (CLIENT)
  // ==========================================

  createSubscriptionRequest(req: SubscriptionRequestCreate): Observable<SubscriptionRequestResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/requests`, req).pipe(
      map(res => res.data)
    );
  }

  getLatestSubscriptionRequest(): Observable<SubscriptionRequestResponse | null> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/requests/latest`).pipe(
      map(res => res.data || null)
    );
  }

  getSubscriptionRequestHistory(): Observable<SubscriptionRequestResponse[]> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/requests/history`).pipe(
      map(res => res.data || [])
    );
  }

  cancelSubscriptionRequest(id: string): Observable<SubscriptionRequestResponse> {
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/requests/${id}/cancel`, {}).pipe(
      map(res => res.data)
    );
  }

  uploadReceipt(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiPrefix}/restaurant/billing/upload-receipt`, formData).pipe(
      map(res => res.data?.receiptUrl || '')
    );
  }

  // ==========================================
  // SUBSCRIPTION REQUESTS (SUPER ADMIN)
  // ==========================================

  getAllSubscriptionRequests(status?: string): Observable<SubscriptionRequestResponse[]> {
    let params = new HttpParams();
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/requests`, { params }).pipe(
      map(res => res.data || [])
    );
  }

  getPendingSubscriptionRequestsCount(): Observable<number> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/requests/count-pending`).pipe(
      map(res => res.data || 0)
    );
  }

  approveSubscriptionRequest(id: string, req?: SubscriptionRequestApprove): Observable<SubscriptionRequestResponse> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/requests/${id}/approve`, req || {}).pipe(
      map(res => res.data)
    );
  }

  rejectSubscriptionRequest(id: string, req: SubscriptionRequestReject): Observable<SubscriptionRequestResponse> {
    return this.http.post<any>(`${this.apiPrefix}/platform/subscriptions/requests/${id}/reject`, req).pipe(
      map(res => res.data)
    );
  }

  // ==========================================
  // PAYMENT CARD REQUISITES (B2B)
  // ==========================================

  getPlatformPaymentCard(): Observable<PaymentCardSettings> {
    return this.http.get<any>(`${this.apiPrefix}/platform/subscriptions/payment-card`).pipe(
      map(res => res.data)
    );
  }

  updatePlatformPaymentCard(req: PaymentCardSettingsUpdate): Observable<PaymentCardSettings> {
    return this.http.put<any>(`${this.apiPrefix}/platform/subscriptions/payment-card`, req).pipe(
      map(res => res.data)
    );
  }

  getClientPaymentCard(): Observable<PaymentCardSettings> {
    return this.http.get<any>(`${this.apiPrefix}/restaurant/billing/payment-card`).pipe(
      map(res => res.data)
    );
  }
}

export interface PaymentCardSettings {
  cardNumber: string;
  cardHolder: string;
  bankName: string;
  instructions: string;
  updatedAt?: string;
}

export interface PaymentCardSettingsUpdate {
  cardNumber: string;
  cardHolder: string;
  bankName: string;
  instructions: string;
}

export interface SubscriptionRequestResponse {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  planId: string;
  planCode: string;
  planName: string;
  billingPeriod: string;
  durationMonths: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  receiptUrl?: string;
  clientNotes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  adminNotes?: string;
  requestedByUsername?: string;
  reviewedByUsername?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SubscriptionRequestCreate {
  planId: string;
  billingPeriod: string;
  durationMonths: number;
  paymentMethod: string;
  receiptUrl?: string;
  clientNotes?: string;
}

export interface SubscriptionRequestApprove {
  customDaysBonus?: number;
  adminNotes?: string;
}

export interface SubscriptionRequestReject {
  reason: string;
}

export interface PaymentProviderSettingResponse {
  id: string;
  providerCode: string;
  displayName: string;
  enabled: boolean;
  testMode: boolean;
  merchantId?: string;
  maskedApiKey?: string;
  maskedSecretKey?: string;
  hasApiKey: boolean;
  hasSecretKey: boolean;
  callbackUrl?: string;
  description?: string;
  updatedAt: string;
}

export interface PaymentProviderSettingUpdateRequest {
  enabled?: boolean;
  testMode?: boolean;
  merchantId?: string;
  apiKey?: string;
  secretKey?: string;
  callbackUrl?: string;
  displayName?: string;
  description?: string;
}
