package com.restaurantpos.platform.service;

import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.orders.entity.Order;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.payments.entity.Payment;
import com.restaurantpos.payments.repository.PaymentRepository;
import com.restaurantpos.platform.dto.PlatformDto;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    private static final ZoneId TASHKENT_ZONE = ZoneId.of("Asia/Tashkent");

    @Transactional(readOnly = true)
    public PlatformDto.StatisticsResponse getPlatformStatistics(String periodStr) {
        String period = periodStr != null ? periodStr.trim().toUpperCase() : "TODAY";
        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);

        // Compute today's boundary
        Instant todayStart = now.toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant todayEnd = now.plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();

        // Compute period boundary
        Instant periodStart;
        Instant periodEnd = now.plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();

        switch (period) {
            case "YESTERDAY" -> {
                periodStart = now.minusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
                periodEnd = todayStart;
            }
            case "THIS_WEEK" -> periodStart = now.with(DayOfWeek.MONDAY).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
            case "THIS_MONTH" -> periodStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
            case "ALL" -> periodStart = Instant.EPOCH;
            case "TODAY" -> periodStart = todayStart;
            default -> periodStart = todayStart;
        }

        long totalRestaurants = tenantRepository.countByDeletedAtIsNull();
        long activeRestaurants = tenantRepository.countByStatusAndDeletedAtIsNull(RestaurantStatus.ACTIVE);
        long suspendedRestaurants = tenantRepository.countByStatusAndDeletedAtIsNull(RestaurantStatus.SUSPENDED);
        long inactiveRestaurants = tenantRepository.countByStatusAndDeletedAtIsNull(RestaurantStatus.INACTIVE);

        long totalEmployees = userRepository.countByTenantIsNotNullAndDeletedAtIsNull();

        BigDecimal todaySales = paymentRepository.sumTotalAmountBetween(todayStart, todayEnd);
        long todayOrders = orderRepository.countByOpenedAtBetweenAndDeletedAtIsNull(todayStart, todayEnd);
        long todayPayments = paymentRepository.countPaymentsBetween(todayStart, todayEnd);

        BigDecimal periodSales = paymentRepository.sumTotalAmountBetween(periodStart, periodEnd);
        long periodOrders = orderRepository.countByOpenedAtBetweenAndDeletedAtIsNull(periodStart, periodEnd);

        BigDecimal averageCheck = BigDecimal.ZERO;
        if (periodOrders > 0 && periodSales.compareTo(BigDecimal.ZERO) > 0) {
            averageCheck = periodSales.divide(BigDecimal.valueOf(periodOrders), 2, RoundingMode.HALF_UP);
        }

        return PlatformDto.StatisticsResponse.builder()
                .totalRestaurants(totalRestaurants)
                .activeRestaurants(activeRestaurants)
                .suspendedRestaurants(suspendedRestaurants)
                .inactiveRestaurants(inactiveRestaurants)
                .totalEmployees(totalEmployees)
                .todaySales(todaySales)
                .todayOrders(todayOrders)
                .todayPayments(todayPayments)
                .periodSales(periodSales)
                .periodOrders(periodOrders)
                .averageCheck(averageCheck)
                .period(period)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlatformDto.RestaurantSummary> getPlatformRestaurants() {
        List<Tenant> tenants = tenantRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        Instant todayStart = now.toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant todayEnd = now.plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();

        return tenants.stream().map(tenant -> {
            UUID tId = tenant.getId();
            long empCount = userRepository.countByTenantIdAndDeletedAtIsNull(tId);
            BigDecimal todaySales = paymentRepository.sumTenantAmountBetween(tId, todayStart, todayEnd);
            BigDecimal totalSales = paymentRepository.sumTenantTotalAmount(tId);
            long todayOrders = orderRepository.countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(tId, todayStart, todayEnd);

            Optional<Order> lastOrder = orderRepository.findFirstByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(tId);
            Optional<Payment> lastPayment = paymentRepository.findFirstByTenantIdOrderByPaidAtDesc(tId);

            Instant lastActivity = tenant.getCreatedAt();
            if (lastOrder.isPresent() && lastOrder.get().getOpenedAt() != null) {
                lastActivity = lastOrder.get().getOpenedAt();
            }
            if (lastPayment.isPresent() && lastPayment.get().getPaidAt() != null && lastPayment.get().getPaidAt().isAfter(lastActivity)) {
                lastActivity = lastPayment.get().getPaidAt();
            }

            // Find restaurant admin name
            List<User> users = userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(tId);
            String adminName = "—";
            String adminUsername = "—";
            for (User u : users) {
                boolean isAdmin = u.getRoles().stream()
                        .anyMatch(r -> "RESTAURANT_ADMIN".equalsIgnoreCase(r.getName()) || "ADMIN".equalsIgnoreCase(r.getName()));
                if (isAdmin) {
                    adminName = u.getFullName();
                    adminUsername = u.getUsername();
                    break;
                }
            }

            return PlatformDto.RestaurantSummary.builder()
                    .id(tenant.getId())
                    .name(tenant.getName())
                    .code(tenant.getCode())
                    .phone(tenant.getPhone())
                    .address(tenant.getAddress())
                    .inn(tenant.getInn())
                    .status(tenant.getStatus() != null ? tenant.getStatus().name() : "ACTIVE")
                    .active(tenant.isActive())
                    .adminName(adminName)
                    .adminUsername(adminUsername)
                    .employeeCount(empCount)
                    .todaySales(todaySales)
                    .totalSales(totalSales)
                    .todayOrders(todayOrders)
                    .lastActivity(lastActivity)
                    .createdAt(tenant.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlatformDto.RestaurantDetail getRestaurantDetail(UUID restaurantId) {
        Tenant tenant = tenantRepository.findById(restaurantId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + restaurantId));

        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        Instant todayStart = now.toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant todayEnd = now.plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant weekStart = now.with(DayOfWeek.MONDAY).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant monthStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();

        // Employees
        List<User> users = userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(restaurantId);
        long totalEmployees = users.size();
        Map<String, Long> roleCounts = new HashMap<>();
        for (User u : users) {
            String roleName = u.getRoles().stream().findFirst().map(r -> r.getName().toUpperCase()).orElse("USER");
            roleCounts.put(roleName, roleCounts.getOrDefault(roleName, 0L) + 1);
        }

        // Sales
        BigDecimal todaySales = paymentRepository.sumTenantAmountBetween(restaurantId, todayStart, todayEnd);
        BigDecimal weekSales = paymentRepository.sumTenantAmountBetween(restaurantId, weekStart, todayEnd);
        BigDecimal monthSales = paymentRepository.sumTenantAmountBetween(restaurantId, monthStart, todayEnd);
        BigDecimal totalSales = paymentRepository.sumTenantTotalAmount(restaurantId);

        // Orders
        long todayOrders = orderRepository.countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(restaurantId, todayStart, todayEnd);
        long totalOrders = orderRepository.countByTenantIdAndDeletedAtIsNull(restaurantId);
        long paidOrders = orderRepository.countByTenantIdAndStatusAndDeletedAtIsNull(restaurantId, Order.OrderStatus.PAID);
        long canceledOrders = orderRepository.countByTenantIdAndStatusAndDeletedAtIsNull(restaurantId, Order.OrderStatus.CANCELLED);

        BigDecimal averageCheck = BigDecimal.ZERO;
        if (totalOrders > 0 && totalSales.compareTo(BigDecimal.ZERO) > 0) {
            averageCheck = totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        }

        Optional<Order> lastOrder = orderRepository.findFirstByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(restaurantId);
        Optional<Payment> lastPayment = paymentRepository.findFirstByTenantIdOrderByPaidAtDesc(restaurantId);

        Instant lastOrderTime = lastOrder.map(Order::getOpenedAt).orElse(null);
        Instant lastPaymentTime = lastPayment.map(Payment::getPaidAt).orElse(null);
        Instant lastActivity = tenant.getCreatedAt();
        if (lastOrderTime != null) lastActivity = lastOrderTime;
        if (lastPaymentTime != null && lastPaymentTime.isAfter(lastActivity)) lastActivity = lastPaymentTime;

        return PlatformDto.RestaurantDetail.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .code(tenant.getCode())
                .phone(tenant.getPhone())
                .address(tenant.getAddress())
                .inn(tenant.getInn())
                .status(tenant.getStatus() != null ? tenant.getStatus().name() : "ACTIVE")
                .active(tenant.isActive())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .totalEmployees(totalEmployees)
                .employeesByRole(roleCounts)
                .todaySales(todaySales)
                .weekSales(weekSales)
                .monthSales(monthSales)
                .totalSales(totalSales)
                .todayOrders(todayOrders)
                .totalOrders(totalOrders)
                .paidOrders(paidOrders)
                .canceledOrders(canceledOrders)
                .averageCheck(averageCheck)
                .lastOrderTime(lastOrderTime)
                .lastPaymentTime(lastPaymentTime)
                .lastActivityTime(lastActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlatformDto.EmployeeItem> getRestaurantEmployees(UUID restaurantId) {
        Tenant tenant = tenantRepository.findById(restaurantId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + restaurantId));

        List<User> users = userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(restaurantId);
        return users.stream().map(u -> mapToEmployeeItem(u, tenant)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlatformDto.EmployeeItem> getAllPlatformEmployees(UUID restaurantId, String roleFilter, Boolean activeFilter) {
        List<User> users;
        if (restaurantId != null) {
            users = userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(restaurantId);
        } else {
            users = userRepository.findByTenantIsNotNullAndDeletedAtIsNullOrderByCreatedAtDesc();
        }

        return users.stream()
                .filter(u -> {
                    if (activeFilter != null && u.isActive() != activeFilter) {
                        return false;
                    }
                    if (roleFilter != null && !roleFilter.isBlank()) {
                        String rName = u.getRoles().stream().findFirst().map(r -> r.getName().toUpperCase()).orElse("");
                        return rName.equalsIgnoreCase(roleFilter.trim());
                    }
                    return true;
                })
                .map(u -> mapToEmployeeItem(u, u.getTenant()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateEmployeeStatus(UUID restaurantId, UUID userId, boolean active) {
        User user = userRepository.findByIdAndTenantIdAndDeletedAtIsNull(userId, restaurantId)
                .orElseThrow(() -> PosException.notFound("Foydalanuvchi topilmadi: " + userId));

        user.setActive(active);
        userRepository.save(user);
        log.info("Platform Super Admin changed employee status: user={}, restaurant={}, active={}", user.getUsername(), restaurantId, active);
    }

    @Transactional(readOnly = true)
    public Page<PlatformDto.OrderItemMonitoring> getRestaurantOrders(UUID restaurantId, int page, int size) {
        Tenant tenant = tenantRepository.findById(restaurantId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + restaurantId));

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<Order> orderPage = orderRepository.findByTenantIdAndDeletedAtIsNullOrderByOpenedAtDesc(restaurantId, pageable);

        return orderPage.map(o -> PlatformDto.OrderItemMonitoring.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .tableName(o.getTable() != null ? o.getTable().getName() : "—")
                .waiterName(o.getWaiter() != null ? o.getWaiter().getFullName() : "—")
                .subtotal(o.getSubtotal())
                .totalAmount(o.getTotal())
                .status(o.getStatus() != null ? o.getStatus().name() : "OPEN")
                .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "UNPAID")
                .paymentMethod(o.getPaymentStatus() == Order.PaymentStatus.PAID ? "PAID" : "UNPAID")
                .itemCount(o.getItems() != null ? o.getItems().size() : 0)
                .openedAt(o.getOpenedAt())
                .closedAt(o.getClosedAt())
                .paidAt(o.getPaidAt())
                .build());
    }

    @Transactional(readOnly = true)
    public List<PlatformDto.RestaurantSalesBreakdown> getPlatformSales(LocalDate fromDate, LocalDate toDate, UUID restaurantId) {
        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        LocalDate start = fromDate != null ? fromDate : now.toLocalDate();
        LocalDate end = toDate != null ? toDate : now.toLocalDate();

        Instant fromInstant = start.atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant toInstant = end.plusDays(1).atStartOfDay(TASHKENT_ZONE).toInstant();

        List<Tenant> tenants;
        if (restaurantId != null) {
            tenants = tenantRepository.findById(restaurantId)
                    .filter(t -> t.getDeletedAt() == null)
                    .map(List::of)
                    .orElse(Collections.emptyList());
        } else {
            tenants = tenantRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        }

        return tenants.stream().map(t -> {
            UUID tId = t.getId();
            BigDecimal totalRev = paymentRepository.sumTenantAmountBetween(tId, fromInstant, toInstant);
            BigDecimal cashRev = paymentRepository.sumTenantAmountByMethodBetween(tId, Payment.PaymentMethod.CASH, fromInstant, toInstant);
            BigDecimal cardRev = paymentRepository.sumTenantAmountByMethodBetween(tId, Payment.PaymentMethod.CARD, fromInstant, toInstant);
            long ordersCount = orderRepository.countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(tId, fromInstant, toInstant);

            BigDecimal avgCheck = BigDecimal.ZERO;
            if (ordersCount > 0 && totalRev.compareTo(BigDecimal.ZERO) > 0) {
                avgCheck = totalRev.divide(BigDecimal.valueOf(ordersCount), 2, RoundingMode.HALF_UP);
            }

            return PlatformDto.RestaurantSalesBreakdown.builder()
                    .restaurantId(t.getId())
                    .restaurantName(t.getName())
                    .restaurantCode(t.getCode())
                    .status(t.getStatus() != null ? t.getStatus().name() : "ACTIVE")
                    .orderCount(ordersCount)
                    .totalRevenue(totalRev)
                    .cashRevenue(cashRev)
                    .cardRevenue(cardRev)
                    .averageCheck(avgCheck)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlatformDto.PlatformReportResponse getPlatformReports(LocalDate fromDate, LocalDate toDate, String status) {
        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        LocalDate start = fromDate != null ? fromDate : now.toLocalDate().minusDays(30);
        LocalDate end = toDate != null ? toDate : now.toLocalDate();

        Instant fromInstant = start.atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant toInstant = end.plusDays(1).atStartOfDay(TASHKENT_ZONE).toInstant();

        List<PlatformDto.RestaurantSalesBreakdown> breakdown = getPlatformSales(start, end, null);
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            breakdown = breakdown.stream()
                    .filter(b -> status.equalsIgnoreCase(b.getStatus()))
                    .collect(Collectors.toList());
        }

        long totalOrders = breakdown.stream().mapToLong(PlatformDto.RestaurantSalesBreakdown::getOrderCount).sum();
        BigDecimal totalVolume = breakdown.stream()
                .map(PlatformDto.RestaurantSalesBreakdown::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeCount = tenantRepository.countByStatusAndDeletedAtIsNull(RestaurantStatus.ACTIVE);

        return PlatformDto.PlatformReportResponse.builder()
                .fromDate(fromInstant)
                .toDate(toInstant)
                .totalOrders(totalOrders)
                .totalVolume(totalVolume)
                .activeRestaurantsCount(activeCount)
                .breakdown(breakdown)
                .build();
    }

    private PlatformDto.EmployeeItem mapToEmployeeItem(User user, Tenant tenant) {
        String roleName = user.getRoles().stream().findFirst().map(r -> r.getName().toUpperCase()).orElse("USER");
        return PlatformDto.EmployeeItem.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(roleName)
                .phone(user.getPhone())
                .email(user.getEmail())
                .active(user.isActive())
                .restaurantId(tenant != null ? tenant.getId() : null)
                .restaurantName(tenant != null ? tenant.getName() : "Platform")
                .restaurantCode(tenant != null ? tenant.getCode() : "PLATFORM")
                .createdAt(user.getCreatedAt())
                .build();
    }
}
