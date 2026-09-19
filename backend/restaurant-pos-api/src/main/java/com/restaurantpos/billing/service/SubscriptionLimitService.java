package com.restaurantpos.billing.service;

import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.entity.SubscriptionPlan;
import com.restaurantpos.billing.repository.RestaurantSubscriptionRepository;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.tenant.TenantContext;
import com.restaurantpos.devices.repository.DeviceRepository;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tables.repository.RestaurantTableRepository;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionLimitService {

    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final RestaurantTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final KitchenRepository kitchenRepository;
    private final DeviceRepository deviceRepository;
    private final OrderRepository orderRepository;

    private static final ZoneId TASHKENT_ZONE = ZoneId.of("Asia/Tashkent");

    /**
     * Retrieves the current active or trial subscription for the tenant with concurrency lock.
     */
    @Transactional
    public RestaurantSubscription getActiveSubscriptionWithLock(UUID tenantId) {
        if (tenantId == null) {
            return null;
        }
        List<RestaurantSubscription> subs = subscriptionRepository.findAllByTenantIdForUpdate(tenantId);
        if (subs.isEmpty()) {
            return null;
        }
        return subs.get(0);
    }

    @Transactional(readOnly = true)
    public RestaurantSubscription getActiveSubscription(UUID tenantId) {
        if (tenantId == null) {
            return null;
        }
        return subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId).orElse(null);
    }

    /**
     * Check if a tenant can create another user/employee.
     */
    @Transactional
    public void checkUserLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxUsers = plan.getMaxUsers();
        if (maxUsers == null || maxUsers == -1) {
            return; // Unlimited
        }
        if (maxUsers == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha qo'shimcha xodim qo'shish imkoniyati mavjud emas.");
        }

        long currentCount = userRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        if (currentCount >= maxUsers) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha maksimal %d ta xodim mavjud. Yangi xodim qo‘shish uchun tarifingizni yangilang.", maxUsers)
            );
        }
    }

    /**
     * Check if a tenant can create another table.
     */
    @Transactional
    public void checkTableLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxTables = plan.getMaxTables();
        if (maxTables == null || maxTables == -1) {
            return; // Unlimited
        }
        if (maxTables == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha stol yaratish imkoniyati mavjud emas.");
        }

        long currentCount = tableRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        if (currentCount >= maxTables) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha maksimal %d ta stol mavjud. Yangi stol qo‘shish uchun tarifingizni yangilang.", maxTables)
            );
        }
    }

    /**
     * Check if a tenant can create another product.
     */
    @Transactional
    public void checkProductLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxProducts = plan.getMaxProducts();
        if (maxProducts == null || maxProducts == -1) {
            return; // Unlimited
        }
        if (maxProducts == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha mahsulot qo'shish imkoniyati mavjud emas.");
        }

        long currentCount = productRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        if (currentCount >= maxProducts) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha maksimal %d ta mahsulot mavjud. Yangi mahsulot qo‘shish uchun tarifingizni yangilang.", maxProducts)
            );
        }
    }

    /**
     * Check if a tenant can create another kitchen.
     */
    @Transactional
    public void checkKitchenLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxKitchens = plan.getMaxKitchens();
        if (maxKitchens == null || maxKitchens == -1) {
            return; // Unlimited
        }
        if (maxKitchens == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha oshxona qo'shish imkoniyati mavjud emas.");
        }

        long currentCount = kitchenRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        if (currentCount >= maxKitchens) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha maksimal %d ta oshxona mavjud. Yangi oshxona qo‘shish uchun tarifingizni yangilang.", maxKitchens)
            );
        }
    }

    /**
     * Check if a tenant can register another device.
     */
    @Transactional
    public void checkDeviceLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxDevices = plan.getMaxDevices();
        if (maxDevices == null || maxDevices == -1) {
            return; // Unlimited
        }
        if (maxDevices == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha qurilma qo'shish imkoniyati mavjud emas.");
        }

        long currentCount = deviceRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        if (currentCount >= maxDevices) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha maksimal %d ta qurilma mavjud. Yangi qurilma ulash uchun tarifingizni yangilang.", maxDevices)
            );
        }
    }

    /**
     * Check if a tenant can create an order this month.
     */
    @Transactional(readOnly = true)
    public void checkOrderLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscription(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        Integer maxOrders = plan.getMaxOrdersPerMonth();
        if (maxOrders == null || maxOrders == -1) {
            return; // Unlimited
        }
        if (maxOrders == 0) {
            throw PosException.badRequest("Tarifingiz bo‘yicha buyurtma yaratish imkoniyati mavjud emas.");
        }

        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        Instant startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth()).plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();

        long currentOrders = orderRepository.countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(tenantId, startOfMonth, endOfMonth);
        if (currentOrders >= maxOrders) {
            throw PosException.badRequest(
                    String.format("Tarifingiz bo‘yicha oylik maksimal %d ta buyurtma limitiga yetdingiz. Yangi buyurtma yaratish uchun tarifingizni yangilang.", maxOrders)
            );
        }
    }

    /**
     * Check if a specific module/feature is enabled for the tenant.
     */
    @Transactional(readOnly = true)
    public void checkFeatureAccess(UUID tenantId, String featureCode) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscription(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        if (!plan.hasFeature(featureCode)) {
            throw PosException.forbidden(
                    String.format("Sizning tarif rejangizda ushbu modul (%s) mavjud emas. Yangilash uchun tarifingizni o'zgartiring.", featureCode)
            );
        }
    }

    private void validateSubscriptionOperating(RestaurantSubscription sub) {
        if (sub == null || !sub.isOperating()) {
            throw PosException.paymentRequired("Obunangiz muddati tugagan yoki faol emas. Ushbu amalni bajarish uchun tarifingizni yangilang.");
        }
    }
}
