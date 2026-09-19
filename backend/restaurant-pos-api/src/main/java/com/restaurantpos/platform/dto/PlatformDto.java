package com.restaurantpos.platform.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class PlatformDto {

    @Getter
    @Builder
    public static class StatisticsResponse {
        private long totalRestaurants;
        private long activeRestaurants;
        private long suspendedRestaurants;
        private long inactiveRestaurants;
        private long totalEmployees;
        private BigDecimal todaySales;
        private long todayOrders;
        private long todayPayments;
        private BigDecimal periodSales;
        private long periodOrders;
        private BigDecimal averageCheck;
        private String period; // TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, ALL
    }

    @Getter
    @Builder
    public static class RestaurantSummary {
        private UUID id;
        private String name;
        private String code;
        private String phone;
        private String address;
        private String inn;
        private String status;
        private boolean active;
        private String adminName;
        private String adminUsername;
        private long employeeCount;
        private BigDecimal todaySales;
        private BigDecimal totalSales;
        private long todayOrders;
        private Instant lastActivity;
        private Instant createdAt;
    }

    @Getter
    @Builder
    public static class RestaurantDetail {
        private UUID id;
        private String name;
        private String code;
        private String phone;
        private String address;
        private String inn;
        private String status;
        private boolean active;
        private Instant createdAt;
        private Instant updatedAt;

        // Employees summary
        private long totalEmployees;
        private Map<String, Long> employeesByRole; // ADMIN, WAITER, KITCHEN, CASHIER

        // Sales summary
        private BigDecimal todaySales;
        private BigDecimal weekSales;
        private BigDecimal monthSales;
        private BigDecimal totalSales;

        // Orders summary
        private long todayOrders;
        private long totalOrders;
        private long paidOrders;
        private long canceledOrders;
        private BigDecimal averageCheck;

        // Activity
        private Instant lastOrderTime;
        private Instant lastPaymentTime;
        private Instant lastActivityTime;
    }

    @Getter
    @Builder
    public static class EmployeeItem {
        private UUID id;
        private String username;
        private String fullName;
        private String role;
        private String phone;
        private String email;
        private boolean active;
        private UUID restaurantId;
        private String restaurantName;
        private String restaurantCode;
        private Instant createdAt;
    }

    @Getter
    @Setter
    public static class EmployeeStatusRequest {
        private boolean active;
    }

    @Getter
    @Builder
    public static class OrderItemMonitoring {
        private UUID id;
        private String orderNumber;
        private String tableName;
        private String waiterName;
        private BigDecimal subtotal;
        private BigDecimal totalAmount;
        private String status;
        private String paymentStatus;
        private String paymentMethod;
        private int itemCount;
        private Instant openedAt;
        private Instant closedAt;
        private Instant paidAt;
    }

    @Getter
    @Builder
    public static class RestaurantSalesBreakdown {
        private UUID restaurantId;
        private String restaurantName;
        private String restaurantCode;
        private String status;
        private long orderCount;
        private BigDecimal totalRevenue;
        private BigDecimal cashRevenue;
        private BigDecimal cardRevenue;
        private BigDecimal averageCheck;
    }

    @Getter
    @Builder
    public static class PlatformReportResponse {
        private Instant fromDate;
        private Instant toDate;
        private long totalOrders;
        private BigDecimal totalVolume;
        private long activeRestaurantsCount;
        private List<RestaurantSalesBreakdown> breakdown;
    }
}
