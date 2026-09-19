package com.restaurantpos.billing.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class BillingDto {

    @Data
    @Builder
    public static class PlanResponse {
        private UUID id;
        private String code;
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private String billingPeriod;
        private Integer trialDays;
        private Integer maxUsers;
        private Integer maxTables;
        private Integer maxProducts;
        private Integer maxKitchens;
        private Integer maxOrdersPerMonth;
        private List<String> features;
        private boolean active;
    }

    @Data
    @Builder
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
        private String currency;
        private List<String> features;

        // Current Tenant Usage against Limits
        private long currentUsers;
        private Integer maxUsers;
        private long currentTables;
        private Integer maxTables;
        private long currentProducts;
        private Integer maxProducts;
        private long currentKitchens;
        private Integer maxKitchens;
    }

    @Data
    public static class CheckoutRequest {
        private UUID planId;
        private String planCode;
        private String provider; // MOCK, CLICK, PAYME, UZUM
        private Integer months;        // 1, 3, 6, 12 (default: 1)
        private Integer extraWaiters;  // qo'shimcha ofitsiantlar soni (2 tadan ortiq, oyiga 35_000 UZS)
    }

    @Data
    @Builder
    public static class CheckoutResponse {
        private UUID paymentId;
        private BigDecimal amount;
        private String currency;
        private String provider;
        private String checkoutUrl;
        private String status;
        private String message;
    }

    @Data
    public static class MockPayRequest {
        private UUID paymentId;
        private boolean simulateSuccess;
    }

    @Data
    @Builder
    public static class PaymentHistoryItem {
        private UUID id;
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
    public static class PlatformSubscriptionOverview {
        private long totalSubscriptions;
        private long activeSubscriptions;
        private long trialSubscriptions;
        private long expiredSubscriptions;
        private BigDecimal totalRevenue;
        private BigDecimal monthlyRecurringRevenue;
        private List<TenantSubscriptionSummary> subscriptions;
    }

    @Data
    @Builder
    public static class TenantSubscriptionSummary {
        private UUID id;
        private UUID tenantId;
        private String restaurantName;
        private String restaurantCode;
        private String restaurantStatus;
        private String planName;
        private String planCode;
        private BigDecimal price;
        private String status;
        private Instant startDate;
        private Instant endDate;
        private long daysRemaining;
        private boolean operating;
    }

    @Data
    public static class PlanSaveRequest {
        private String name;
        private String code;
        private String description;
        private BigDecimal price;
        private String currency;
        private String billingPeriod;
        private Integer trialDays;
        private Integer maxUsers;
        private Integer maxTables;
        private Integer maxProducts;
        private Integer maxKitchens;
        private Integer maxOrdersPerMonth;
        private List<String> features;
        private Boolean active;
    }
}
