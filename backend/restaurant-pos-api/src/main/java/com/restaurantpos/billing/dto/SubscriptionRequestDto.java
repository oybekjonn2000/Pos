package com.restaurantpos.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class SubscriptionRequestDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private UUID planId;
        private String billingPeriod;
        private Integer durationMonths;
        private String paymentMethod;
        private String receiptUrl;
        private String clientNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private UUID id;
        private UUID tenantId;
        private String tenantName;
        private String tenantCode;
        private UUID planId;
        private String planCode;
        private String planName;
        private String billingPeriod;
        private int durationMonths;
        private BigDecimal amount;
        private String currency;
        private String paymentMethod;
        private String receiptUrl;
        private String clientNotes;
        private String status;
        private String rejectionReason;
        private String adminNotes;
        private String requestedByUsername;
        private String reviewedByUsername;
        private Instant createdAt;
        private Instant reviewedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproveRequest {
        private Integer customDaysBonus;
        private String adminNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectRequest {
        private String reason;
    }
}
