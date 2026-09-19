package com.restaurantpos.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class ResetDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrdersResetResult {
        private int orders;
        private int orderItems;
        private int payments;
        private int kitchenBatches;
        private int kitchenTickets;
        private int cancellationReceipts;
        private int tablesFreed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityResetResult {
        private String entityType;
        private int deletedCount;
        private String message;
        private Map<String, Integer> details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllResetResult {
        private int orders;
        private int orderItems;
        private int payments;
        private int kitchenBatches;
        private int kitchenTickets;
        private int cancellationReceipts;
        private int products;
        private int categories;
        private int kitchens;
        private int tables;
        private int zones;
        private int usersPreserved;
        private int printersPreserved;
        private int rolesPreserved;
    }
}
