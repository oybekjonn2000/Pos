package com.restaurantpos.kitchen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class KitchenBatchDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID orderId;
        private String orderNumber;
        private String orderType;
        private UUID tableId;
        private String tableNumber;
        private String tableName;
        private String waiterName;
        private String customerName;
        private String customerPhone;
        private String deliveryAddress;

        private UUID kitchenId;
        private String kitchenName;
        private String kitchenCode;

        private Integer batchNumber;
        private String batchType; // INITIAL, ADDON
        private String status;    // NEW, ACCEPTED, COOKING, READY, SERVED, CANCELLED
        private String notes;

        private Instant createdAt;
        private Instant sentAt;
        private Instant readyAt;
        private Instant servedAt;
        private Instant cancelledAt;

        private List<ItemResponse> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private UUID id;
        private UUID batchId;
        private UUID orderItemId;
        private UUID productId;
        private String productName;
        private String productSku;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private String status;
        private String notes;
        private Instant readyAt;
        private BigDecimal totalOrderQuantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status;
    }
}
