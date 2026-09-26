package com.restaurantpos.billing.service;

import com.restaurantpos.billing.entity.RestaurantSubscription;
import com.restaurantpos.billing.entity.SubscriptionPlan;
import com.restaurantpos.billing.repository.RestaurantSubscriptionRepository;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionLimitService {

    private final RestaurantSubscriptionRepository subscriptionRepository;

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
     * ZERO RESOURCE LIMITS: All resources are unlimited across Standard, Pro, and Trial.
     * Only validates that subscription is currently operating (active or trial).
     */
    @Transactional
    public void checkUserLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a tenant can create another table.
     * ZERO RESOURCE LIMITS: Unlimited for all operating plans.
     */
    @Transactional
    public void checkTableLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a tenant can create another product.
     * ZERO RESOURCE LIMITS: Unlimited for all operating plans.
     */
    @Transactional
    public void checkProductLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a tenant can create another kitchen station.
     * ZERO RESOURCE LIMITS: Unlimited for all operating plans.
     */
    @Transactional
    public void checkKitchenLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a tenant can register another device.
     * ZERO RESOURCE LIMITS: Unlimited for all operating plans.
     */
    @Transactional
    public void checkDeviceLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscriptionWithLock(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a tenant can create an order this month.
     * ZERO RESOURCE LIMITS: Unlimited for all operating plans.
     */
    @Transactional(readOnly = true)
    public void checkOrderLimit(UUID tenantId) {
        if (TenantContext.isSuperAdmin()) return;
        RestaurantSubscription sub = getActiveSubscription(tenantId);
        validateSubscriptionOperating(sub);
        // Unlimited resource - no count capping enforced
    }

    /**
     * Check if a specific module/feature is enabled for the tenant.
     * Standard & Trial: POS Core, Tables, Orders, Kitchen Management, Warehouse, Reports, Printers, Settings.
     * Pro: Standard + MOBILE_APP + KITCHEN_DISPLAY.
     */
    @Transactional(readOnly = true)
    public void checkFeatureAccess(UUID tenantId, String featureCode) {
        if (TenantContext.isSuperAdmin()) return;

        RestaurantSubscription sub = getActiveSubscription(tenantId);
        validateSubscriptionOperating(sub);

        SubscriptionPlan plan = sub.getPlan();
        boolean hasAccess = plan != null && (
                "PRO".equalsIgnoreCase(plan.getCode()) ||
                plan.hasFeature(featureCode)
        );
        if (!hasAccess) {
            String featureName = featureCode;
            if ("KITCHEN_DISPLAY".equalsIgnoreCase(featureCode)) {
                featureName = "Oshxona Ekrani (KDS)";
            } else if ("MOBILE_APP".equalsIgnoreCase(featureCode)) {
                featureName = "Mobil Ofitsiant Ilovasi (APK)";
            }
            throw PosException.proPlanRequired(
                    String.format("Ushbu funksiya (%s) faqat PRO tarifida mavjud. Iltimos, tarifingizni PRO ga yangilang.", featureName)
            );
        }
    }

    private void validateSubscriptionOperating(RestaurantSubscription sub) {
        if (sub == null || !sub.isOperating()) {
            throw PosException.paymentRequired("Obunangiz muddati tugagan yoki faol emas. POS operatsiyalarini davom ettirish uchun tarifingizni yangilang.");
        }
    }
}
