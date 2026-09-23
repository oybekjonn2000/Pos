package com.restaurantpos.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class MobileDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Response for mobile POS connection check")
    public static class ConnectionCheckResponse {
        private UUID restaurantId;
        private String restaurantName;
        private String restaurantCode;
        private String restaurantSlug;
        private String subscriptionPlan;
        private boolean mobileAppEnabled;
        private String serverTime;
        private long timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Waiter employee item for mobile selection")
    public static class MobileWaiterDto {
        private UUID id;
        private String fullName;
        private String firstName;
        private String lastName;
        private String username;
        private String role;
        private String avatar;
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Request for waiter PIN authentication")
    public static class MobilePinLoginRequest {
        @NotNull(message = "employeeId kiritilishi shart")
        private UUID employeeId;

        @NotBlank(message = "PIN kod kiritilishi shart")
        private String pin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Notification payload for items ready in kitchen")
    public static class ReadyNotificationDto {
        private UUID orderId;
        private String orderNumber;
        private UUID tableId;
        private String tableNumber;
        private String tableName;
        private UUID itemId;
        private UUID productId;
        private String productName;
        private java.math.BigDecimal quantity;
        private java.time.Instant readyAt;
        private String kitchenName;
    }
}

