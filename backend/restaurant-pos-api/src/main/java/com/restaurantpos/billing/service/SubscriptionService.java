package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.*;
import com.restaurantpos.billing.provider.MockPaymentProvider;
import com.restaurantpos.billing.repository.RestaurantSubscriptionRepository;
import com.restaurantpos.billing.repository.SubscriptionPaymentRepository;
import com.restaurantpos.billing.repository.SubscriptionPlanRepository;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tables.repository.RestaurantTableRepository;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ProductRepository productRepository;
    private final KitchenRepository kitchenRepository;
    private final MockPaymentProvider mockPaymentProvider;

    @Transactional(readOnly = true)
    public List<BillingDto.PlanResponse> getPublicPlans() {
        return planRepository.findAllByActiveTrueOrderByPriceAsc().stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PlanResponse> getAllPlans() {
        return planRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDto.PlanResponse getPlanByCode(String code) {
        SubscriptionPlan plan = planRepository.findByCode(code)
                .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + code));
        return toPlanResponse(plan);
    }

    @Transactional
    public RestaurantSubscription createInitialSubscription(Tenant tenant, String preferredPlanCode) {
        SubscriptionPlan plan = null;
        if (preferredPlanCode != null && !preferredPlanCode.isBlank()) {
            plan = planRepository.findByCode(preferredPlanCode.trim().toUpperCase(Locale.ROOT)).orElse(null);
        }
        if (plan == null) {
            plan = planRepository.findByCode("TRIAL")
                    .or(() -> planRepository.findByCode("STARTER"))
                    .orElseGet(() -> planRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> PosException.badRequest("Tizimda tarif rejalari mavjud emas!")));
        }

        int trialDays = (plan.getTrialDays() != null && plan.getTrialDays() > 0) ? plan.getTrialDays() : 14;

        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(tenant);
        sub.setPlan(plan);
        sub.setStatus(SubscriptionStatus.TRIAL);
        sub.setStartDate(Instant.now());
        sub.setEndDate(Instant.now().plus(trialDays, ChronoUnit.DAYS));
        sub.setAutoRenew(false);

        RestaurantSubscription saved = subscriptionRepository.save(sub);
        log.info("Created initial trial subscription ({} days) for restaurant: {} ({}) with plan: {}",
                trialDays, tenant.getName(), tenant.getCode(), plan.getName());
        return saved;
    }

    @Transactional
    public BillingDto.CurrentSubscriptionResponse getCurrentSubscription(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + tenantId));

        RestaurantSubscription sub = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId)
                .orElseGet(() -> createInitialSubscription(tenant, "TRIAL"));

        // Check expiration
        if ((sub.getStatus() == SubscriptionStatus.TRIAL || sub.getStatus() == SubscriptionStatus.ACTIVE)
                && sub.getEndDate() != null && Instant.now().isAfter(sub.getEndDate())) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            sub = subscriptionRepository.save(sub);
            log.info("Subscription expired for restaurant: {} (ID: {})", tenant.getName(), tenant.getId());
        }

        long usersCount = userRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long tablesCount = restaurantTableRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long productsCount = productRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long kitchensCount = kitchenRepository.countByTenantIdAndDeletedAtIsNull(tenantId);

        SubscriptionPlan plan = sub.getPlan();

        return BillingDto.CurrentSubscriptionResponse.builder()
                .id(sub.getId())
                .planCode(plan.getCode())
                .planName(plan.getName())
                .status(sub.getStatus().name())
                .operating(sub.isOperating())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .daysRemaining(sub.getDaysRemaining())
                .autoRenew(sub.isAutoRenew())
                .price(plan.getPrice())
                .currency(plan.getCurrency())
                .features(plan.getFeatures())
                .currentUsers(usersCount)
                .maxUsers(plan.getMaxUsers())
                .currentTables(tablesCount)
                .maxTables(plan.getMaxTables())
                .currentProducts(productsCount)
                .maxProducts(plan.getMaxProducts())
                .currentKitchens(kitchensCount)
                .maxKitchens(plan.getMaxKitchens())
                .build();
    }

    @Transactional
    public BillingDto.CheckoutResponse initiateCheckout(UUID tenantId, BillingDto.CheckoutRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + tenantId));

        SubscriptionPlan plan;
        if (request.getPlanId() != null) {
            plan = planRepository.findById(request.getPlanId())
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + request.getPlanId()));
        } else if (request.getPlanCode() != null && !request.getPlanCode().isBlank()) {
            plan = planRepository.findByCode(request.getPlanCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + request.getPlanCode()));
        } else {
            throw PosException.badRequest("Tarif tanlanmagan!");
        }

        PaymentProviderType providerType = PaymentProviderType.MOCK;
        if (request.getProvider() != null && !request.getProvider().isBlank()) {
            try {
                providerType = PaymentProviderType.valueOf(request.getProvider().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                providerType = PaymentProviderType.MOCK;
            }
        }

        // --- Narx hisoblash ---
        int months = (request.getMonths() != null && request.getMonths() >= 1) ? request.getMonths() : 1;
        if (months > 12) months = 12;

        int extraWaiters = (request.getExtraWaiters() != null && request.getExtraWaiters() > 0)
                ? request.getExtraWaiters() : 0;

        // Asosiy tarif narxi: planPrice * months
        BigDecimal planTotal = plan.getPrice().multiply(BigDecimal.valueOf(months));

        // Qo'shimcha ofitsiantlar: har biri oyiga 35_000 UZS (2 ta bepul)
        BigDecimal waiterExtra = BigDecimal.valueOf(35_000L)
                .multiply(BigDecimal.valueOf(extraWaiters))
                .multiply(BigDecimal.valueOf(months));

        BigDecimal totalAmount = planTotal.add(waiterExtra);
        // ----------------------

        // Create pending payment record
        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setTenant(tenant);
        payment.setPlan(plan);
        payment.setAmount(totalAmount);
        payment.setCurrency(plan.getCurrency());
        payment.setProvider(providerType);
        payment.setStatus(SubscriptionPaymentStatus.PENDING);
        payment.setMetadata(Map.of(
                "initiatedBy", tenant.getName(),
                "planCode", plan.getCode(),
                "months", String.valueOf(months),
                "extraWaiters", String.valueOf(extraWaiters)
        ));

        SubscriptionPayment savedPayment = paymentRepository.save(payment);

        String checkoutUrl = mockPaymentProvider.generateCheckoutUrl(savedPayment);

        return BillingDto.CheckoutResponse.builder()
                .paymentId(savedPayment.getId())
                .amount(savedPayment.getAmount())
                .currency(savedPayment.getCurrency())
                .provider(savedPayment.getProvider().name())
                .checkoutUrl(checkoutUrl)
                .status(savedPayment.getStatus().name())
                .message("To'lov jarayoni boshlandi")
                .build();
    }

    @Transactional
    public BillingDto.CurrentSubscriptionResponse processPaymentSuccess(UUID paymentId,
                                                                         String providerTransactionId,
                                                                         Map<String, Object> metadata) {
        SubscriptionPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + paymentId));

        // Idempotency: if already paid, return current subscription
        if (payment.getStatus() == SubscriptionPaymentStatus.PAID) {
            log.info("Payment {} was already processed as PAID.", paymentId);
            return getCurrentSubscription(payment.getTenant().getId());
        }

        Tenant tenant = payment.getTenant();
        SubscriptionPlan plan = payment.getPlan();

        // months metadatadan olish (default: 1)
        int months = 1;
        try {
            if (payment.getMetadata() != null && payment.getMetadata().containsKey("months")) {
                months = Integer.parseInt(payment.getMetadata().get("months").toString());
            }
        } catch (NumberFormatException ignored) {}
        if (months < 1) months = 1;

        int durationDays = 30 * months;
        if (plan.getBillingPeriod() == BillingPeriod.YEARLY) {
            durationDays = 365 * months;
        }

        // Find active/trial subscription or latest subscription
        Optional<RestaurantSubscription> latestSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
        RestaurantSubscription targetSub;

        if (latestSubOpt.isPresent() && latestSubOpt.get().isOperating()) {
            // Extend existing subscription
            targetSub = latestSubOpt.get();
            Instant baseTime = targetSub.getEndDate().isAfter(Instant.now()) ? targetSub.getEndDate() : Instant.now();
            targetSub.setEndDate(baseTime.plus(durationDays, ChronoUnit.DAYS));
            targetSub.setPlan(plan);
            targetSub.setStatus(SubscriptionStatus.ACTIVE);
            targetSub = subscriptionRepository.save(targetSub);
            log.info("Extended subscription for {} until {}", tenant.getName(), targetSub.getEndDate());
        } else {
            // Create new active subscription
            targetSub = new RestaurantSubscription();
            targetSub.setTenant(tenant);
            targetSub.setPlan(plan);
            targetSub.setStatus(SubscriptionStatus.ACTIVE);
            targetSub.setStartDate(Instant.now());
            targetSub.setEndDate(Instant.now().plus(durationDays, ChronoUnit.DAYS));
            targetSub = subscriptionRepository.save(targetSub);
            log.info("Created new ACTIVE subscription for {} until {}", tenant.getName(), targetSub.getEndDate());
        }

        // Activate tenant if PENDING
        if (tenant.getStatus() == RestaurantStatus.PENDING) {
            tenant.setStatus(RestaurantStatus.ACTIVE);
            tenant.setActive(true);
            tenantRepository.save(tenant);
        }

        payment.setStatus(SubscriptionPaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        payment.setSubscription(targetSub);
        if (providerTransactionId != null) {
            payment.setProviderTransactionId(providerTransactionId);
        }
        if (metadata != null) {
            payment.setMetadata(metadata);
        }
        paymentRepository.save(payment);

        return getCurrentSubscription(tenant.getId());
    }

    @Transactional
    public void processPaymentFailed(UUID paymentId, String reason) {
        SubscriptionPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + paymentId));

        if (payment.getStatus() == SubscriptionPaymentStatus.PAID) {
            log.warn("Cannot mark already PAID payment {} as FAILED", paymentId);
            return;
        }

        payment.setStatus(SubscriptionPaymentStatus.FAILED);
        Map<String, Object> meta = new HashMap<>(payment.getMetadata() != null ? payment.getMetadata() : Map.of());
        meta.put("failedReason", reason);
        payment.setMetadata(meta);
        paymentRepository.save(payment);
        log.warn("Subscription payment {} failed: {}", paymentId, reason);
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PaymentHistoryItem> getTenantPaymentHistory(UUID tenantId) {
        return paymentRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toPaymentHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDto.PlatformSubscriptionOverview getPlatformSubscriptionOverview() {
        long total = subscriptionRepository.count();
        long active = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        long trial = subscriptionRepository.countByStatus(SubscriptionStatus.TRIAL);
        long expired = subscriptionRepository.countByStatus(SubscriptionStatus.EXPIRED);

        BigDecimal totalRevenue = paymentRepository.sumTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        List<RestaurantSubscription> allSubs = subscriptionRepository.findAllByOrderByCreatedAtDesc();

        // Calculate approximate MRR
        BigDecimal mrr = BigDecimal.ZERO;
        for (RestaurantSubscription sub : allSubs) {
            if (sub.isOperating() && sub.getStatus() == SubscriptionStatus.ACTIVE) {
                BigDecimal pPrice = sub.getPlan().getPrice();
                if (sub.getPlan().getBillingPeriod() == BillingPeriod.YEARLY) {
                    pPrice = pPrice.divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP);
                }
                mrr = mrr.add(pPrice);
            }
        }

        List<BillingDto.TenantSubscriptionSummary> summaryList = allSubs.stream()
                .map(s -> BillingDto.TenantSubscriptionSummary.builder()
                        .id(s.getId())
                        .tenantId(s.getTenant().getId())
                        .restaurantName(s.getTenant().getName())
                        .restaurantCode(s.getTenant().getCode())
                        .restaurantStatus(s.getTenant().getStatus() != null ? s.getTenant().getStatus().name() : "ACTIVE")
                        .planName(s.getPlan().getName())
                        .planCode(s.getPlan().getCode())
                        .price(s.getPlan().getPrice())
                        .status(s.getStatus().name())
                        .startDate(s.getStartDate())
                        .endDate(s.getEndDate())
                        .daysRemaining(s.getDaysRemaining())
                        .operating(s.isOperating())
                        .build())
                .collect(Collectors.toList());

        return BillingDto.PlatformSubscriptionOverview.builder()
                .totalSubscriptions(total)
                .activeSubscriptions(active)
                .trialSubscriptions(trial)
                .expiredSubscriptions(expired)
                .totalRevenue(totalRevenue)
                .monthlyRecurringRevenue(mrr)
                .subscriptions(summaryList)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PaymentHistoryItem> getPlatformPaymentHistory() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toPaymentHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillingDto.PlanResponse savePlan(UUID planId, BillingDto.PlanSaveRequest request) {
        SubscriptionPlan plan;
        if (planId != null) {
            plan = planRepository.findById(planId)
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + planId));
        } else {
            String code = request.getCode().trim().toUpperCase(Locale.ROOT);
            if (planRepository.findByCode(code).isPresent()) {
                throw PosException.badRequest("Ushbu kodli tarif allaqachon mavjud: " + code);
            }
            plan = new SubscriptionPlan();
            plan.setCode(code);
        }

        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
        plan.setCurrency(request.getCurrency() != null ? request.getCurrency() : "UZS");
        if (request.getBillingPeriod() != null) {
            plan.setBillingPeriod(BillingPeriod.valueOf(request.getBillingPeriod()));
        }
        if (request.getTrialDays() != null) plan.setTrialDays(request.getTrialDays());
        if (request.getMaxUsers() != null) plan.setMaxUsers(request.getMaxUsers());
        if (request.getMaxTables() != null) plan.setMaxTables(request.getMaxTables());
        if (request.getMaxProducts() != null) plan.setMaxProducts(request.getMaxProducts());
        if (request.getMaxKitchens() != null) plan.setMaxKitchens(request.getMaxKitchens());
        if (request.getMaxOrdersPerMonth() != null) plan.setMaxOrdersPerMonth(request.getMaxOrdersPerMonth());
        if (request.getFeatures() != null) plan.setFeatures(request.getFeatures());
        if (request.getActive() != null) plan.setActive(request.getActive());

        SubscriptionPlan saved = planRepository.save(plan);
        return toPlanResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean isTenantOperationAllowed(UUID tenantId) {
        if (tenantId == null) {
            return true; // Super admin
        }
        return subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId)
                .map(RestaurantSubscription::isOperating)
                .orElse(false);
    }

    private BillingDto.PlanResponse toPlanResponse(SubscriptionPlan plan) {
        return BillingDto.PlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .price(plan.getPrice())
                .currency(plan.getCurrency())
                .billingPeriod(plan.getBillingPeriod().name())
                .trialDays(plan.getTrialDays())
                .maxUsers(plan.getMaxUsers())
                .maxTables(plan.getMaxTables())
                .maxProducts(plan.getMaxProducts())
                .maxKitchens(plan.getMaxKitchens())
                .maxOrdersPerMonth(plan.getMaxOrdersPerMonth())
                .features(plan.getFeatures())
                .active(plan.isActive())
                .build();
    }

    private BillingDto.PaymentHistoryItem toPaymentHistoryItem(SubscriptionPayment p) {
        return BillingDto.PaymentHistoryItem.builder()
                .id(p.getId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .provider(p.getProvider().name())
                .providerTransactionId(p.getProviderTransactionId())
                .planName(p.getPlan().getName())
                .planCode(p.getPlan().getCode())
                .status(p.getStatus().name())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .restaurantName(p.getTenant() != null ? p.getTenant().getName() : "")
                .restaurantCode(p.getTenant() != null ? p.getTenant().getCode() : "")
                .build();
    }
}
