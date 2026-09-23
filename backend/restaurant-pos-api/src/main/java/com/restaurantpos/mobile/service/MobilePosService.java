package com.restaurantpos.mobile.service;

import com.restaurantpos.auth.dto.AuthDto;
import com.restaurantpos.auth.service.AuthService;
import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.repository.RestaurantSubscriptionRepository;
import com.restaurantpos.billing.service.SubscriptionLimitService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.mobile.dto.MobileDto;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.Role;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MobilePosService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionLimitService subscriptionLimitService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final com.restaurantpos.orders.repository.OrderRepository orderRepository;
    private final com.restaurantpos.kitchen.service.KitchenService kitchenService;

    /**
     * Check connection, verify restaurant existence and MOBILE_APP / Pro subscription access.
     */
    @Transactional(readOnly = true)
    public MobileDto.ConnectionCheckResponse checkConnection(String restaurantCode) {
        Tenant tenant = resolveTenant(restaurantCode);
        if (tenant == null) {
            throw PosException.badRequest("Serverda faol restoran topilmadi.");
        }
        if (!tenant.isOperating()) {
            throw PosException.forbidden("Ushbu restoran tizimda faol emas (" + tenant.getStatus() + ").");
        }

        boolean hasAccess = hasMobileAppAccess(tenant.getId());
        if (!hasAccess) {
            throw PosException.forbidden("Ofitsiant mobil ilovasi faqat Pro tarifida mavjud. Iltimos, administratorga murojaat qiling.");
        }

        String planCode = "STANDARD";
        try {
            Optional<RestaurantSubscription> subOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
            if (subOpt.isPresent() && subOpt.get().getPlan() != null) {
                planCode = subOpt.get().getPlan().getCode();
            }
        } catch (Exception ignored) {}

        return MobileDto.ConnectionCheckResponse.builder()
                .restaurantId(tenant.getId())
                .restaurantName(tenant.getName())
                .restaurantCode(tenant.getCode())
                .restaurantSlug(tenant.getSlug())
                .subscriptionPlan(planCode)
                .mobileAppEnabled(true)
                .serverTime(Instant.now().toString())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Get list of active employees with role WAITER only for the given restaurant.
     * Admin, Cashier, Cook, Manager are strictly excluded.
     */
    @Transactional(readOnly = true)
    public List<MobileDto.MobileWaiterDto> getWaiters(UUID tenantId, String restaurantCode) {
        Tenant tenant = tenantId != null
                ? tenantRepository.findById(tenantId).orElse(null)
                : resolveTenant(restaurantCode);

        if (tenant == null) {
            throw PosException.badRequest("Restoran topilmadi.");
        }

        if (!hasMobileAppAccess(tenant.getId())) {
            throw PosException.forbidden("Ofitsiant mobil ilovasi faqat Pro tarifida mavjud.");
        }

        List<User> users = userRepository.findAllByTenantIdWithRoles(tenant.getId());
        return users.stream()
                .filter(u -> u.isActive() && isWaiter(u))
                .map(this::mapToWaiterDto)
                .sorted(Comparator.comparing(MobileDto.MobileWaiterDto::getFullName))
                .collect(Collectors.toList());
    }

    /**
     * Authenticate waiter via numeric PIN.
     * Verifies PIN against pinHash (BCrypt) and generates JWT authentication tokens.
     */
    @Transactional
    public AuthDto.TokenResponse pinLogin(MobileDto.MobilePinLoginRequest request) {
        if (request.getEmployeeId() == null) {
            throw PosException.badRequest("Xodim identifikatori (employeeId) ko'rsatilishi shart.");
        }
        String pin = request.getPin() != null ? request.getPin().trim() : "";
        if (pin.isEmpty()) {
            throw PosException.badRequest("PIN kod kiritilishi shart.");
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(request.getEmployeeId())
                .orElseThrow(() -> PosException.unauthorized("Xodim topilmadi."));

        if (!user.isActive()) {
            throw PosException.unauthorized("Ushbu xodim hisobi faol emas.");
        }

        // Verify role is WAITER
        if (!isWaiter(user)) {
            throw PosException.forbidden("Ushbu mobil ilovaga faqat ofitsiantlar kira oladi.");
        }

        Tenant tenant = user.getTenant();
        if (tenant == null || !tenant.isOperating()) {
            throw PosException.forbidden("Restoran faoliyati to'xtatilgan.");
        }

        // Check subscription
        if (!hasMobileAppAccess(tenant.getId())) {
            throw PosException.forbidden("Ofitsiant mobil ilovasi faqat Pro tarifida mavjud.");
        }

        // Validate PIN
        boolean pinMatches = user.getPinHash() != null && passwordEncoder.matches(pin, user.getPinHash());
        // Fallback: check passwordHash if pinHash was not configured separately
        if (!pinMatches && user.getPasswordHash() != null && passwordEncoder.matches(pin, user.getPasswordHash())) {
            pinMatches = true;
        }

        if (!pinMatches) {
            user.incrementFailedAttempts();
            userRepository.save(user);
            throw PosException.unauthorized("PIN kod noto‘g‘ri.");
        }

        user.resetFailedAttempts();
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        log.info("Waiter logged in via mobile PIN: {} ({}) at {}", user.getUsername(), user.getFullName(), tenant.getName());
        return authService.issueTokensForUser(user);
    }

    /**
     * Check if tenant has active subscription with MOBILE_APP feature access.
     */
    public boolean hasMobileAppAccess(UUID tenantId) {
        try {
            subscriptionLimitService.checkFeatureAccess(tenantId, "MOBILE_APP");
            return true;
        } catch (Exception e) {
            log.warn("MOBILE_APP access check returned false for tenant {}: {}", tenantId, e.getMessage());
            return false;
        }
    }

    private Tenant resolveTenant(String restaurantCode) {
        if (restaurantCode != null && !restaurantCode.isBlank()) {
            Optional<Tenant> opt = tenantRepository.findByCodeIgnoreCaseAndDeletedAtIsNull(restaurantCode.trim());
            if (opt.isPresent()) return opt.get();
            Optional<Tenant> bySlug = tenantRepository.findBySlugAndDeletedAtIsNull(restaurantCode.trim().toLowerCase(Locale.ROOT));
            if (bySlug.isPresent()) return bySlug.get();
        }
        List<Tenant> tenants = tenantRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        return tenants.stream().filter(Tenant::isOperating).findFirst().orElse(
                tenants.isEmpty() ? null : tenants.get(0)
        );
    }

    private boolean isWaiter(User user) {
        if (user.getRoles() == null) return false;
        for (Role role : user.getRoles()) {
            String name = role.getName() != null ? role.getName().toUpperCase() : "";
            if ("WAITER".equals(name) || "ROLE_WAITER".equals(name)) {
                return true;
            }
        }
        return false;
    }

    private MobileDto.MobileWaiterDto mapToWaiterDto(User user) {
        return MobileDto.MobileWaiterDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .role("WAITER")
                .avatar(null)
                .phone(user.getPhone())
                .build();
    }

    /**
     * Get real-time list of items marked READY by the kitchen for the current waiter.
     */
    @Transactional(readOnly = true)
    public List<MobileDto.ReadyNotificationDto> getReadyNotifications(UUID tenantId, com.restaurantpos.auth.security.UserPrincipal user) {
        if (tenantId == null) {
            return Collections.emptyList();
        }

        List<com.restaurantpos.orders.entity.Order> orders;
        if (user != null && user.isWaiter()) {
            orders = orderRepository.findActiveOrdersByWaiter(tenantId, user.getUserId());
            if (orders.isEmpty()) {
                orders = orderRepository.findActiveOrders(tenantId);
            }
        } else {
            orders = orderRepository.findActiveOrders(tenantId);
        }

        List<MobileDto.ReadyNotificationDto> readyItems = new ArrayList<>();
        for (com.restaurantpos.orders.entity.Order order : orders) {
            if (order.getItems() == null || order.getStatus() == com.restaurantpos.orders.entity.Order.OrderStatus.CANCELLED) {
                continue;
            }

            String tableNum = "-";
            String tableName = "-";
            UUID tableId = null;
            if (order.getTable() != null) {
                tableId = order.getTable().getId();
                tableNum = order.getTable().getTableNumber() != null ? order.getTable().getTableNumber().toString() : order.getTable().getName();
                tableName = order.getTable().getName();
            }

            for (com.restaurantpos.orders.entity.OrderItem item : order.getItems()) {
                if (item.isVoided()) continue;

                if (item.getKitchenStatus() == com.restaurantpos.orders.entity.OrderItem.KitchenStatus.READY) {
                    readyItems.add(MobileDto.ReadyNotificationDto.builder()
                            .orderId(order.getId())
                            .orderNumber(order.getOrderNumber())
                            .tableId(tableId)
                            .tableNumber(tableNum)
                            .tableName(tableName)
                            .itemId(item.getId())
                            .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                            .productName(item.getProductName())
                            .quantity(item.getQuantity())
                            .readyAt(item.getReadyAt() != null ? item.getReadyAt() : order.getUpdatedAt())
                            .kitchenName(item.getKitchen() != null ? item.getKitchen().getName() : "Oshxona")
                            .build());
                }
            }
        }

        return readyItems;
    }

    /**
     * Mark a ready item as SERVED (delivered to table) by the waiter.
     */
    @Transactional
    public void markItemServed(UUID orderId, UUID itemId, UUID tenantId, com.restaurantpos.auth.security.UserPrincipal user) {
        kitchenService.updateItemKitchenStatus(itemId, "SERVED");
        log.info("Waiter {} marked item {} as SERVED for order {}", user != null ? user.getUsername() : "unknown", itemId, orderId);
    }
}

