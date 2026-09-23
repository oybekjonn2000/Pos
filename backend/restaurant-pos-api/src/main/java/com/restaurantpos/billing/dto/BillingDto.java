package com.restaurantpos.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class BillingDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanResponse {
        private UUID id;
        private String code;
        private String name;
        private String description;
        private BigDecimal price; // Monthly price
        private BigDecimal yearlyPrice; // Yearly price
        private String currency;
        private String billingPeriod;
        private boolean trialEnabled;
        private Integer trialDays;
        private Integer maxUsers;
        private Integer maxTables;
        private Integer maxProducts;
        private Integer maxKitchens;
        private Integer maxDevices;
        private Integer maxBranches;
        private Integer maxOrdersPerMonth;
        private List<String> features;
        private boolean active;
        private boolean archived;
        private Integer sortOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentSubscriptionResponse {
        private UUID id;
        private String planCode;
        private String planName;
        private String status;
        private boolean operating;
        private Instant startDate;
        private Instant endDate;
        private long daysRemaining;
        private boolean autoRenew;
        private BigDecimal price;
        private BigDecimal yearlyPrice;
        private String currency;
        private List<String> features;
        private String notes;

        // Next scheduled plan (for downgrades)
        private String nextPlanCode;
        private String nextPlanName;
        private boolean hasScheduledDowngrade;

        // Warning level for notification banners
        private String warningLevel; // "NONE", "7_DAYS", "3_DAYS", "1_DAY", "EXPIRED"

        // Current Tenant Usage against Limits
        private long currentUsers;
        private Integer maxUsers;
        private long currentWaiters;
        private long currentChefs;
        private long currentTables;
        private Integer maxTables;
        private long currentProducts;
        private Integer maxProducts;
        private long currentCategories;
        private long currentHalls;
        private long currentKitchens;
        private Integer maxKitchens;
        private long currentDevices;
        private Integer maxDevices;
        private long currentOrders;
        private long currentMonthOrders;
        private Integer maxOrdersPerMonth;
        private long currentPrinters;

        // Trial dates
        private Instant trialStartDate;
        private Instant trialEndDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutRequest {
        private UUID planId;
        private String planCode;
        private String provider; // MANUAL, CLICK, PAYME, UZUM, STRIPE, MOCK
        private Integer months;  // 1, 3, 6, 12...
        private Integer extraWaiters; // optional extra waiters
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutResponse {
        private UUID invoiceId;
        private String invoiceNumber;
        private UUID paymentId;
        private BigDecimal baseAmount;
        private BigDecimal discountAmount;
        private BigDecimal adjustmentAmount;
        private BigDecimal finalAmount;
        private String currency;
        private String provider;
        private String checkoutUrl;
        private String status;
        private String message;
        private boolean isDowngradeScheduled;
        private Instant effectiveDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalculatePriceRequest {
        private UUID planId;
        private String planCode;
        private Integer months;
        private Integer extraWaiters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalculatePriceResponse {
        private UUID planId;
        private String planCode;
        private String planName;
        private int months;
        private BigDecimal monthlyPrice;
        private BigDecimal yearlyPrice;
        private BigDecimal baseAmount;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private int extraWaiters;
        private BigDecimal extraWaitersAmount;
        private BigDecimal adjustmentAmount;
        private BigDecimal finalAmount;
        private String currency;
        private Instant effectiveStartDate;
        private Instant effectiveEndDate;
        private boolean isUpgrade;
        private boolean isDowngrade;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MockPayRequest {
        private UUID paymentId;
        private UUID invoiceId;
        private boolean simulateSuccess;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceResponse {
        private UUID id;
        private String invoiceNumber;
        private UUID tenantId;
        private String restaurantName;
        private String restaurantCode;
        private String planCode;
        private String planName;
        private Integer durationMonths;
        private BigDecimal baseAmount;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal adjustmentAmount;
        private BigDecimal finalAmount;
        private String currency;
        private String status;
        private String paymentMethod;
        private String notes;
        private Instant dueDate;
        private Instant paidAt;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionPeriodResponse {
        private UUID id;
        private String planName;
        private String planCode;
        private Instant startDate;
        private Instant endDate;
        private String periodType;
        private String invoiceNumber;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentHistoryItem {
        private UUID id;
        private UUID invoiceId;
        private String invoiceNumber;
        private BigDecimal amount;
        private String currency;
        private String provider;
        private String providerTransactionId;
        private String planName;
        private String planCode;
        private String status;
        private Instant paidAt;
        private Instant createdAt;
        private String restaurantName;
        private String restaurantCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiscountRuleDto {
        private UUID id;
        private Integer minMonths;
        private BigDecimal discountPercent;
        private String name;
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformSubscriptionOverview {
        private long totalSubscriptions;
        private long activeSubscriptions;
        private long standardSubscriptions;
        private long proSubscriptions;
        private long trialSubscriptions;
        private long expiringSoonSubscriptions;
        private long expiredSubscriptions;
        private long cancelledSubscriptions;
        private long suspendedSubscriptions;
        private long pendingPaymentSubscriptions;
        private BigDecimal totalRevenue;
        private BigDecimal monthlyRecurringRevenue;
        private BigDecimal totalDiscountsGiven;
        private long manualPaymentsCount;
        private List<TenantSubscriptionSummary> subscriptions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantSubscriptionSummary {
        private UUID id;
        private UUID tenantId;
        private String restaurantName;
        private String restaurantCode;
        private String restaurantStatus;
        private String planName;
        private String planCode;
        private BigDecimal price;
        private BigDecimal yearlyPrice;
        private String status;
        private Instant startDate;
        private Instant endDate;
        private long daysRemaining;
        private boolean operating;
        private String nextPlanName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanSaveRequest {
        private String name;
        private String code;
        private String description;
        private BigDecimal price;
        private BigDecimal yearlyPrice;
        private String currency;
        private String billingPeriod;
        private Boolean trialEnabled;
        private Integer trialDays;
        private Integer maxUsers;
        private Integer maxTables;
        private Integer maxProducts;
        private Integer maxKitchens;
        private Integer maxDevices;
        private Integer maxBranches;
        private Integer maxOrdersPerMonth;
        private List<String> features;
        private Boolean active;
        private Boolean archived;
        private Integer sortOrder;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualActivationRequest {
        private UUID tenantId;
        private UUID planId;
        private String planCode;
        private Integer months;
        private Instant startDate;
        private Instant endDate;
        private BigDecimal discountPercent;
        private BigDecimal adjustmentAmount;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogResponse {
        private UUID id;
        private UUID tenantId;
        private String restaurantName;
        private UUID userId;
        private String username;
        private String role;
        private String action;
        private String entityType;
        private UUID entityId;
        private Map<String, Object> details;
        private String ipAddress;
        private Instant createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MockPaymentRequest {
        private UUID paymentId;
        private String outcome; // SUCCESS, FAILED, PENDING, CANCELLED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentProviderSettingResponse {
        private UUID id;
        private String providerCode;
        private String displayName;
        private boolean enabled;
        private boolean testMode;
        private String merchantId;
        private String maskedApiKey;
        private String maskedSecretKey;
        private boolean hasApiKey;
        private boolean hasSecretKey;
        private String callbackUrl;
        private String description;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentProviderSettingUpdateRequest {
        private Boolean enabled;
        private Boolean testMode;
        private String merchantId;
        private String apiKey;
        private String secretKey;
        private String callbackUrl;
        private String displayName;
        private String description;
    }
}
