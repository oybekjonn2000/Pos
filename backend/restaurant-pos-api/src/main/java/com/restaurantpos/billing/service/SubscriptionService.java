package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.*;
import com.restaurantpos.billing.provider.PaymentProviderFactory;
import com.restaurantpos.billing.repository.*;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.tenant.TenantContext;
import com.restaurantpos.devices.repository.DeviceRepository;
import com.restaurantpos.kitchen.repository.KitchenRepository;
import com.restaurantpos.orders.repository.OrderRepository;
import com.restaurantpos.products.repository.ProductRepository;
import com.restaurantpos.tables.repository.RestaurantTableRepository;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    public static final ZoneId TASHKENT_ZONE = ZoneId.of("Asia/Tashkent");

    private final SubscriptionPlanRepository planRepository;
    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubscriptionPeriodRepository periodRepository;
    private final SubscriptionDiscountRuleRepository discountRuleRepository;
    private final SubscriptionAuditService auditService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final ProductRepository productRepository;
    private final KitchenRepository kitchenRepository;
    private final DeviceRepository deviceRepository;
    private final OrderRepository orderRepository;
    private final PaymentProviderFactory paymentProviderFactory;

    // ==========================================
    // PLANS MANAGEMENT (PUBLIC & ADMIN)
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillingDto.PlanResponse> getPublicPlans() {
        return planRepository.findAllByActiveTrueOrderByPriceAsc().stream()
                .filter(p -> !p.isArchived())
                .sorted(Comparator.comparing(SubscriptionPlan::getSortOrder).thenComparing(SubscriptionPlan::getPrice))
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PlanResponse> getAllPlans() {
        return planRepository.findAllByOrderByCreatedAtDesc().stream()
                .sorted(Comparator.comparing(SubscriptionPlan::getSortOrder).thenComparing(SubscriptionPlan::getCreatedAt).reversed())
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillingDto.PlanResponse getPlanByCode(String code) {
        SubscriptionPlan plan = planRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + code));
        return toPlanResponse(plan);
    }

    @Transactional
    public BillingDto.PlanResponse savePlan(UUID planId, BillingDto.PlanSaveRequest request) {
        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw PosException.badRequest("Oylik narx manfiy bo'lishi mumkin emas!");
        }
        if (request.getYearlyPrice() != null && request.getYearlyPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw PosException.badRequest("Yillik narx manfiy bo'lishi mumkin emas!");
        }
        if (request.getTrialDays() != null && request.getTrialDays() < 0) {
            throw PosException.badRequest("Trial kunlari manfiy bo'lishi mumkin emas!");
        }

        SubscriptionPlan plan;
        boolean isNew = false;
        if (planId != null) {
            plan = planRepository.findById(planId)
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + planId));
        } else {
            isNew = true;
            if (request.getCode() == null || request.getCode().trim().isBlank()) {
                throw PosException.badRequest("Tarif kodi (slug) majburiy!");
            }
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
        plan.setYearlyPrice(request.getYearlyPrice() != null ? request.getYearlyPrice() : plan.getPrice().multiply(BigDecimal.valueOf(10)));
        plan.setCurrency(request.getCurrency() != null ? request.getCurrency() : "UZS");
        if (request.getBillingPeriod() != null) {
            plan.setBillingPeriod(BillingPeriod.valueOf(request.getBillingPeriod()));
        }
        if (request.getTrialEnabled() != null) plan.setTrialEnabled(request.getTrialEnabled());
        if (request.getTrialDays() != null) plan.setTrialDays(request.getTrialDays());
        if (request.getMaxUsers() != null) plan.setMaxUsers(request.getMaxUsers());
        if (request.getMaxTables() != null) plan.setMaxTables(request.getMaxTables());
        if (request.getMaxProducts() != null) plan.setMaxProducts(request.getMaxProducts());
        if (request.getMaxKitchens() != null) plan.setMaxKitchens(request.getMaxKitchens());
        if (request.getMaxDevices() != null) plan.setMaxDevices(request.getMaxDevices());
        if (request.getMaxBranches() != null) plan.setMaxBranches(request.getMaxBranches());
        if (request.getMaxOrdersPerMonth() != null) plan.setMaxOrdersPerMonth(request.getMaxOrdersPerMonth());
        if (request.getFeatures() != null) plan.setFeatures(request.getFeatures());
        if (request.getActive() != null) plan.setActive(request.getActive());
        if (request.getArchived() != null) plan.setArchived(request.getArchived());
        if (request.getSortOrder() != null) plan.setSortOrder(request.getSortOrder());

        SubscriptionPlan saved = planRepository.save(plan);

        // Audit Log
        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(null, currentUser, currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                isNew ? "PLAN_CREATED" : "PLAN_UPDATED", "SubscriptionPlan", saved.getId(),
                Map.of("code", saved.getCode(), "name", saved.getName(), "price", saved.getPrice(), "yearlyPrice", saved.getYearlyPrice()));

        return toPlanResponse(saved);
    }

    @Transactional
    public BillingDto.PlanResponse archivePlan(UUID planId) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + planId));
        plan.setArchived(true);
        plan.setActive(false);
        SubscriptionPlan saved = planRepository.save(plan);

        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(null, currentUser, currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "PLAN_ARCHIVED", "SubscriptionPlan", saved.getId(), Map.of("code", saved.getCode()));

        log.info("Subscription plan archived: {} ({})", saved.getName(), saved.getCode());
        return toPlanResponse(saved);
    }

    // ==========================================
    // DISCOUNT RULES MANAGEMENT
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillingDto.DiscountRuleDto> getDiscountRules() {
        return discountRuleRepository.findAllByOrderByMinMonthsAsc().stream()
                .map(r -> BillingDto.DiscountRuleDto.builder()
                        .id(r.getId())
                        .minMonths(r.getMinMonths())
                        .discountPercent(r.getDiscountPercent())
                        .name(r.getName())
                        .active(r.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public BillingDto.DiscountRuleDto saveDiscountRule(BillingDto.DiscountRuleDto dto) {
        if (dto.getMinMonths() == null || dto.getMinMonths() < 1) {
            throw PosException.badRequest("Muddat (oylar) kamida 1 bo'lishi shart!");
        }
        if (dto.getDiscountPercent() == null || dto.getDiscountPercent().compareTo(BigDecimal.ZERO) < 0 || dto.getDiscountPercent().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw PosException.badRequest("Chegirma foizi 0% va 100% oralig'ida bo'lishi kerak!");
        }

        SubscriptionDiscountRule rule;
        if (dto.getId() != null) {
            rule = discountRuleRepository.findById(dto.getId())
                    .orElseThrow(() -> PosException.notFound("Chegirma qoidasi topilmadi: " + dto.getId()));
        } else {
            rule = discountRuleRepository.findByMinMonths(dto.getMinMonths()).orElse(new SubscriptionDiscountRule());
            rule.setMinMonths(dto.getMinMonths());
        }

        rule.setDiscountPercent(dto.getDiscountPercent());
        rule.setName(dto.getName() != null && !dto.getName().isBlank() ? dto.getName() : dto.getMinMonths() + " oylik chegirma");
        rule.setActive(dto.isActive());

        SubscriptionDiscountRule saved = discountRuleRepository.save(rule);

        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(null, currentUser, currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "DISCOUNT_RULE_SAVED", "SubscriptionDiscountRule", saved.getId(),
                Map.of("minMonths", saved.getMinMonths(), "discountPercent", saved.getDiscountPercent()));

        return BillingDto.DiscountRuleDto.builder()
                .id(saved.getId())
                .minMonths(saved.getMinMonths())
                .discountPercent(saved.getDiscountPercent())
                .name(saved.getName())
                .active(saved.isActive())
                .build();
    }

    @Transactional
    public void deleteDiscountRule(UUID id) {
        discountRuleRepository.deleteById(id);
    }

    // ==========================================
    // DISCOUNT & PRICE CALCULATION LOGIC
    // ==========================================

    /**
     * Determines the applicable discount percentage based on duration using floor-tier policy.
     * E.g. Rules: 3m->5%, 6m->10%, 12m->20%.
     * User selects 5 months -> matches 3m tier -> returns 5%.
     */
    @Transactional(readOnly = true)
    public BigDecimal getApplicableDiscountPercent(int months) {
        if (months < 1) return BigDecimal.ZERO;
        List<SubscriptionDiscountRule> rules = discountRuleRepository.findAllByActiveTrueOrderByMinMonthsDesc();
        for (SubscriptionDiscountRule rule : rules) {
            if (months >= rule.getMinMonths()) {
                return rule.getDiscountPercent();
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Real-time calculation of price, discount, proration, and final amount.
     */
    @Transactional(readOnly = true)
    public BillingDto.CalculatePriceResponse calculatePrice(UUID tenantId, BillingDto.CalculatePriceRequest req) {
        if (req.getMonths() == null || req.getMonths() < 1) {
            throw PosException.badRequest("Obuna muddati kamida 1 oy bo'lishi kerak!");
        }
        int months = req.getMonths();

        SubscriptionPlan targetPlan;
        if (req.getPlanId() != null) {
            targetPlan = planRepository.findById(req.getPlanId())
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + req.getPlanId()));
        } else if (req.getPlanCode() != null && !req.getPlanCode().isBlank()) {
            targetPlan = planRepository.findByCode(req.getPlanCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + req.getPlanCode()));
        } else {
            throw PosException.badRequest("Tarif ko'rsatilmadi!");
        }

        if (!targetPlan.isActive() || targetPlan.isArchived()) {
            throw PosException.badRequest("Ushbu tarif faol emas yoki arxivlangan!");
        }

        // Base price calculation
        BigDecimal monthlyPrice = targetPlan.getPrice();
        BigDecimal yearlyPrice = targetPlan.getYearlyPrice();
        BigDecimal baseAmount = monthlyPrice.multiply(BigDecimal.valueOf(months));

        // Chegirma hisoblash
        BigDecimal discountPercent = getApplicableDiscountPercent(months);
        BigDecimal discountAmount = baseAmount.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Extra waiters
        int extraWaiters = (req.getExtraWaiters() != null && req.getExtraWaiters() > 0) ? req.getExtraWaiters() : 0;
        BigDecimal extraWaitersAmount = BigDecimal.valueOf(35_000L)
                .multiply(BigDecimal.valueOf(extraWaiters))
                .multiply(BigDecimal.valueOf(months));

        // Subtotals before adjustments
        BigDecimal grossAmount = baseAmount.subtract(discountAmount).add(extraWaitersAmount);

        // Check current subscription for Upgrade Proration Credit
        BigDecimal adjustmentAmount = BigDecimal.ZERO;
        boolean isUpgrade = false;
        boolean isDowngrade = false;

        Optional<RestaurantSubscription> currentSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId);
        Instant startDate = Instant.now();
        Instant endDate;

        if (currentSubOpt.isPresent() && currentSubOpt.get().isOperating()) {
            RestaurantSubscription currentSub = currentSubOpt.get();
            SubscriptionPlan currentPlan = currentSub.getPlan();

            if (!currentPlan.getId().equals(targetPlan.getId())) {
                if (targetPlan.getPrice().compareTo(currentPlan.getPrice()) > 0) {
                    // Upgrade: calculate unused credit from current plan
                    isUpgrade = true;
                    long remainingDays = currentSub.getDaysRemaining();
                    if (remainingDays > 0) {
                        BigDecimal dailyRate = currentPlan.getPrice().divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
                        BigDecimal unusedCredit = dailyRate.multiply(BigDecimal.valueOf(remainingDays));
                        adjustmentAmount = unusedCredit.negate(); // Credit reduces the bill
                    }
                    startDate = Instant.now();
                    endDate = addCalendarMonths(startDate, months);
                } else {
                    // Downgrade: takes effect at end of current period
                    isDowngrade = true;
                    startDate = currentSub.getEndDate();
                    endDate = addCalendarMonths(startDate, months);
                }
            } else {
                // Renewal: continues after current expiration date
                startDate = currentSub.getEndDate();
                endDate = addCalendarMonths(startDate, months);
            }
        } else {
            // New subscription or re-activating expired subscription
            startDate = Instant.now();
            endDate = addCalendarMonths(startDate, months);
        }

        BigDecimal finalAmount = grossAmount.add(adjustmentAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        return BillingDto.CalculatePriceResponse.builder()
                .planId(targetPlan.getId())
                .planCode(targetPlan.getCode())
                .planName(targetPlan.getName())
                .months(months)
                .monthlyPrice(monthlyPrice)
                .yearlyPrice(yearlyPrice)
                .baseAmount(baseAmount)
                .discountPercent(discountPercent)
                .discountAmount(discountAmount)
                .extraWaiters(extraWaiters)
                .extraWaitersAmount(extraWaitersAmount)
                .adjustmentAmount(adjustmentAmount)
                .finalAmount(finalAmount)
                .currency(targetPlan.getCurrency())
                .effectiveStartDate(startDate)
                .effectiveEndDate(endDate)
                .isUpgrade(isUpgrade)
                .isDowngrade(isDowngrade)
                .build();
    }

    // ==========================================
    // INITIAL SUBSCRIPTION & TRIAL
    // ==========================================

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
        Instant now = Instant.now();
        Instant end = addCalendarDays(now, trialDays);

        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(tenant);
        sub.setPlan(plan);
        sub.setStatus(plan.isTrialEnabled() || "TRIAL".equalsIgnoreCase(plan.getCode()) ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE);
        sub.setStartDate(now);
        sub.setEndDate(end);
        sub.setAutoRenew(false);

        RestaurantSubscription saved = subscriptionRepository.save(sub);

        // Record history period
        SubscriptionPeriod period = new SubscriptionPeriod();
        period.setSubscription(saved);
        period.setTenant(tenant);
        period.setPlan(plan);
        period.setStartDate(now);
        period.setEndDate(end);
        period.setPeriodType(SubscriptionPeriodType.TRIAL);
        periodRepository.save(period);

        auditService.log(tenant, null, "SYSTEM", "SYSTEM", "SUBSCRIPTION_CREATED", "Subscription", saved.getId(),
                Map.of("plan", plan.getCode(), "status", saved.getStatus().name(), "trialDays", trialDays));

        log.info("Created initial subscription ({} days) for restaurant: {} ({}) with plan: {}",
                trialDays, tenant.getName(), tenant.getCode(), plan.getName());
        return saved;
    }

    // ==========================================
    // CURRENT SUBSCRIPTION & USAGE
    // ==========================================

    @Transactional
    public BillingDto.CurrentSubscriptionResponse getCurrentSubscription(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + tenantId));

        RestaurantSubscription sub = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId)
                .orElseGet(() -> createInitialSubscription(tenant, "TRIAL"));

        Instant now = Instant.now();

        // Check and update state
        if (sub.getEndDate() != null && now.isAfter(sub.getEndDate())) {
            if (sub.getStatus() != SubscriptionStatus.EXPIRED &&
                sub.getStatus() != SubscriptionStatus.CANCELLED &&
                sub.getStatus() != SubscriptionStatus.SUSPENDED) {
                sub.setStatus(SubscriptionStatus.EXPIRED);
                sub = subscriptionRepository.save(sub);
            }
        } else if (sub.getStatus() == SubscriptionStatus.ACTIVE && sub.getDaysRemaining() <= 7) {
            sub.setStatus(SubscriptionStatus.EXPIRING_SOON);
            sub = subscriptionRepository.save(sub);
        }

        // Determine warning level
        String warningLevel = "NONE";
        if (sub.getStatus() == SubscriptionStatus.EXPIRED) {
            warningLevel = "EXPIRED";
        } else {
            long days = sub.getDaysRemaining();
            if (days <= 1) {
                warningLevel = "1_DAY";
            } else if (days <= 3) {
                warningLevel = "3_DAYS";
            } else if (days <= 7) {
                warningLevel = "7_DAYS";
            }
        }

        long usersCount = userRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long tablesCount = restaurantTableRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long productsCount = productRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long kitchensCount = kitchenRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long devicesCount = deviceRepository.countByTenantIdAndDeletedAtIsNull(tenantId);

        // Monthly orders
        ZonedDateTime zdtNow = ZonedDateTime.now(TASHKENT_ZONE);
        Instant startOfMonth = zdtNow.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        Instant endOfMonth = zdtNow.with(TemporalAdjusters.lastDayOfMonth()).plusDays(1).toLocalDate().atStartOfDay(TASHKENT_ZONE).toInstant();
        long monthOrders = orderRepository.countByTenantIdAndOpenedAtBetweenAndDeletedAtIsNull(tenantId, startOfMonth, endOfMonth);

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
                .yearlyPrice(plan.getYearlyPrice())
                .currency(plan.getCurrency())
                .features(plan.getFeatures())
                .notes(sub.getNotes())
                .nextPlanCode(sub.getNextPlan() != null ? sub.getNextPlan().getCode() : null)
                .nextPlanName(sub.getNextPlan() != null ? sub.getNextPlan().getName() : null)
                .hasScheduledDowngrade(sub.getNextPlan() != null)
                .warningLevel(warningLevel)
                .currentUsers(usersCount)
                .maxUsers(plan.getMaxUsers())
                .currentTables(tablesCount)
                .maxTables(plan.getMaxTables())
                .currentProducts(productsCount)
                .maxProducts(plan.getMaxProducts())
                .currentKitchens(kitchensCount)
                .maxKitchens(plan.getMaxKitchens())
                .currentDevices(devicesCount)
                .maxDevices(plan.getMaxDevices())
                .currentMonthOrders(monthOrders)
                .maxOrdersPerMonth(plan.getMaxOrdersPerMonth())
                .build();
    }

    // ==========================================
    // CHECKOUT & INVOICE GENERATION
    // ==========================================

    @Transactional
    public BillingDto.CheckoutResponse initiateCheckout(UUID tenantId, BillingDto.CheckoutRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + tenantId));

        BillingDto.CalculatePriceResponse calc = calculatePrice(tenantId, new BillingDto.CalculatePriceRequest(
                request.getPlanId(), request.getPlanCode(), request.getMonths(), request.getExtraWaiters()
        ));

        SubscriptionPlan plan = planRepository.findById(calc.getPlanId())
                .orElseThrow(() -> PosException.notFound("Tarif topilmadi"));

        PaymentProviderType providerType = PaymentProviderType.MANUAL;
        if (request.getProvider() != null && !request.getProvider().isBlank()) {
            try {
                providerType = PaymentProviderType.valueOf(request.getProvider().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                providerType = PaymentProviderType.MANUAL;
            }
        }

        // Downgrade case: schedule downgrade for next cycle without charging full amount immediately
        if (calc.isDowngrade()) {
            Optional<RestaurantSubscription> currentSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId);
            if (currentSubOpt.isPresent()) {
                RestaurantSubscription currentSub = currentSubOpt.get();
                currentSub.setNextPlan(plan);
                subscriptionRepository.save(currentSub);

                UUID currentUserId = TenantContext.getCurrentUserId();
                User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
                auditService.log(tenant, currentUser, currentUser != null ? currentUser.getUsername() : "USER", "USER",
                        "PLAN_DOWNGRADE_SCHEDULED", "Subscription", currentSub.getId(),
                        Map.of("nextPlan", plan.getCode(), "effectiveDate", currentSub.getEndDate().toString()));

                return BillingDto.CheckoutResponse.builder()
                        .isDowngradeScheduled(true)
                        .effectiveDate(currentSub.getEndDate())
                        .status("SCHEDULED")
                        .message("Tarif pasaytirilishi qabul qilindi. Joriy obuna muddati tugagach (" +
                                formatDateTashkent(currentSub.getEndDate()) + ") yangi tarif kuchga kiradi.")
                        .build();
            }
        }

        // Generate Invoice
        String invoiceNumber = generateInvoiceNumber();
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setTenant(tenant);
        invoice.setPlan(plan);
        invoice.setDurationMonths(calc.getMonths());
        invoice.setBaseAmount(calc.getBaseAmount().add(calc.getExtraWaitersAmount()));
        invoice.setDiscountPercent(calc.getDiscountPercent());
        invoice.setDiscountAmount(calc.getDiscountAmount());
        invoice.setAdjustmentAmount(calc.getAdjustmentAmount());
        invoice.setFinalAmount(calc.getFinalAmount());
        invoice.setCurrency(plan.getCurrency());
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setPaymentMethod(providerType);
        invoice.setNotes(request.getNotes() != null ? request.getNotes() : (calc.isUpgrade() ? "Upgrade to " + plan.getName() : "Subscription renewal"));
        invoice.setDueDate(Instant.now().plus(7, ChronoUnit.DAYS));

        Optional<RestaurantSubscription> currentSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId);
        currentSubOpt.ifPresent(invoice::setSubscription);

        SubscriptionInvoice savedInvoice = invoiceRepository.save(invoice);

        // Generate Pending Payment
        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setInvoice(savedInvoice);
        payment.setTenant(tenant);
        payment.setPlan(plan);
        currentSubOpt.ifPresent(payment::setSubscription);
        payment.setAmount(calc.getFinalAmount());
        payment.setCurrency(plan.getCurrency());
        payment.setProvider(providerType);
        payment.setStatus(SubscriptionPaymentStatus.PENDING);
        payment.setMetadata(Map.of(
                "invoiceId", savedInvoice.getId().toString(),
                "invoiceNumber", savedInvoice.getInvoiceNumber(),
                "months", String.valueOf(calc.getMonths()),
                "planCode", plan.getCode(),
                "isUpgrade", String.valueOf(calc.isUpgrade()),
                "extraWaiters", String.valueOf(calc.getExtraWaiters())
        ));
        SubscriptionPayment savedPayment = paymentRepository.save(payment);

        // Audit Log
        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(tenant, currentUser, currentUser != null ? currentUser.getUsername() : "USER", "USER",
                "INVOICE_CREATED", "SubscriptionInvoice", savedInvoice.getId(),
                Map.of("invoiceNumber", invoiceNumber, "finalAmount", calc.getFinalAmount(), "plan", plan.getCode()));

        String checkoutUrl = paymentProviderFactory.getProvider(providerType).generateCheckoutUrl(savedPayment);

        return BillingDto.CheckoutResponse.builder()
                .invoiceId(savedInvoice.getId())
                .invoiceNumber(savedInvoice.getInvoiceNumber())
                .paymentId(savedPayment.getId())
                .baseAmount(savedInvoice.getBaseAmount())
                .discountAmount(savedInvoice.getDiscountAmount())
                .adjustmentAmount(savedInvoice.getAdjustmentAmount())
                .finalAmount(savedInvoice.getFinalAmount())
                .currency(savedInvoice.getCurrency())
                .provider(providerType.name())
                .checkoutUrl(checkoutUrl)
                .status("PENDING")
                .message("Hisob-faktura shakllantirildi. To'lov tasdiqlangandan so'ng tarif faollashtiriladi.")
                .isDowngradeScheduled(false)
                .effectiveDate(calc.getEffectiveStartDate())
                .build();
    }

    // ==========================================
    // MANUAL PAYMENT / MARK AS PAID (SUPER ADMIN)
    // ==========================================

    @Transactional
    public BillingDto.InvoiceResponse markInvoiceAsPaid(UUID invoiceId, String adminNotes) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> PosException.notFound("Hisob-faktura topilmadi: " + invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw PosException.badRequest("Ushbu hisob-faktura allaqachon to'langan!");
        }

        Instant now = Instant.now();
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(now);
        if (adminNotes != null && !adminNotes.isBlank()) {
            invoice.setNotes((invoice.getNotes() != null ? invoice.getNotes() + " | " : "") + "Admin: " + adminNotes);
        }
        invoiceRepository.save(invoice);

        // Find or create matching payment
        SubscriptionPayment payment = paymentRepository.findAllByTenantIdOrderByCreatedAtDesc(invoice.getTenant().getId()).stream()
                .filter(p -> p.getInvoice() != null && p.getInvoice().getId().equals(invoiceId))
                .findFirst()
                .orElseGet(() -> {
                    SubscriptionPayment p = new SubscriptionPayment();
                    p.setInvoice(invoice);
                    p.setTenant(invoice.getTenant());
                    p.setPlan(invoice.getPlan());
                    p.setAmount(invoice.getFinalAmount());
                    p.setCurrency(invoice.getCurrency());
                    p.setProvider(PaymentProviderType.MANUAL);
                    return p;
                });

        payment.setStatus(SubscriptionPaymentStatus.PAID);
        payment.setPaidAt(now);
        payment.setProvider(PaymentProviderType.MANUAL);
        payment.setProviderTransactionId("MANUAL-ADM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        paymentRepository.save(payment);

        // Activate or Extend Subscription
        Tenant tenant = invoice.getTenant();
        SubscriptionPlan plan = invoice.getPlan();
        int months = invoice.getDurationMonths();

        Optional<RestaurantSubscription> existingSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
        RestaurantSubscription activeSub;

        SubscriptionPeriodType periodType = SubscriptionPeriodType.RENEWAL;

        if (existingSubOpt.isPresent() && existingSubOpt.get().isOperating()) {
            activeSub = existingSubOpt.get();
            boolean isSamePlan = activeSub.getPlan().getId().equals(plan.getId());

            if (isSamePlan) {
                // Renewal: extend from current endDate
                Instant newEndDate = addCalendarMonths(activeSub.getEndDate(), months);
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.RENEWAL;
            } else {
                // Upgrade
                Instant newEndDate = addCalendarMonths(now, months);
                activeSub.setPlan(plan);
                activeSub.setStartDate(now);
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.UPGRADE;
            }
            activeSub = subscriptionRepository.save(activeSub);
        } else {
            // New active subscription
            Instant newEndDate = addCalendarMonths(now, months);
            activeSub = new RestaurantSubscription();
            activeSub.setTenant(tenant);
            activeSub.setPlan(plan);
            activeSub.setStatus(SubscriptionStatus.ACTIVE);
            activeSub.setStartDate(now);
            activeSub.setEndDate(newEndDate);
            activeSub = subscriptionRepository.save(activeSub);
            periodType = SubscriptionPeriodType.INITIAL;
        }

        // Link subscription to invoice and payment
        invoice.setSubscription(activeSub);
        invoiceRepository.save(invoice);
        payment.setSubscription(activeSub);
        paymentRepository.save(payment);

        // Record Subscription Period
        SubscriptionPeriod period = new SubscriptionPeriod();
        period.setSubscription(activeSub);
        period.setTenant(tenant);
        period.setPlan(plan);
        period.setStartDate(activeSub.getStartDate());
        period.setEndDate(activeSub.getEndDate());
        period.setPeriodType(periodType);
        period.setInvoice(invoice);
        periodRepository.save(period);

        // Ensure tenant is active
        if (tenant.getStatus() == RestaurantStatus.PENDING || tenant.getStatus() == RestaurantStatus.SUSPENDED) {
            tenant.setStatus(RestaurantStatus.ACTIVE);
            tenant.setActive(true);
            tenantRepository.save(tenant);
        }

        // Audit Log
        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(tenant, currentUser, currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "INVOICE_PAID_MANUAL", "SubscriptionInvoice", invoice.getId(),
                Map.of("invoiceNumber", invoice.getInvoiceNumber(), "amount", invoice.getFinalAmount(), "plan", plan.getCode()));

        return toInvoiceResponse(invoice);
    }

    // ==========================================
    // MANUAL SUBSCRIPTION CREATION (SUPER ADMIN)
    // ==========================================

    @Transactional
    public BillingDto.CurrentSubscriptionResponse manualActivate(BillingDto.ManualActivationRequest req) {
        if (req.getTenantId() == null) {
            throw PosException.badRequest("Restoran tanlanishi shart!");
        }
        Tenant tenant = tenantRepository.findById(req.getTenantId())
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + req.getTenantId()));

        SubscriptionPlan plan;
        if (req.getPlanId() != null) {
            plan = planRepository.findById(req.getPlanId())
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + req.getPlanId()));
        } else if (req.getPlanCode() != null && !req.getPlanCode().isBlank()) {
            plan = planRepository.findByCode(req.getPlanCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + req.getPlanCode()));
        } else {
            throw PosException.badRequest("Tarif tanlanishi shart!");
        }

        int months = (req.getMonths() != null && req.getMonths() > 0) ? req.getMonths() : 1;
        Instant start = req.getStartDate() != null ? req.getStartDate() : Instant.now();
        Instant end = req.getEndDate() != null ? req.getEndDate() : addCalendarMonths(start, months);

        if (end.isBefore(start)) {
            throw PosException.badRequest("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas!");
        }

        BigDecimal discount = req.getDiscountPercent() != null ? req.getDiscountPercent() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) < 0 || discount.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw PosException.badRequest("Chegirma 0% va 100% oralig'ida bo'lishi kerak!");
        }

        BigDecimal base = plan.getPrice().multiply(BigDecimal.valueOf(months));
        BigDecimal discAmount = base.multiply(discount).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal adj = req.getAdjustmentAmount() != null ? req.getAdjustmentAmount() : BigDecimal.ZERO;
        BigDecimal finalAmt = base.subtract(discAmount).add(adj);
        if (finalAmt.compareTo(BigDecimal.ZERO) < 0) finalAmt = BigDecimal.ZERO;

        // Create paid invoice
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setTenant(tenant);
        invoice.setPlan(plan);
        invoice.setDurationMonths(months);
        invoice.setBaseAmount(base);
        invoice.setDiscountPercent(discount);
        invoice.setDiscountAmount(discAmount);
        invoice.setAdjustmentAmount(adj);
        invoice.setFinalAmount(finalAmt);
        invoice.setCurrency(plan.getCurrency());
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentMethod(PaymentProviderType.MANUAL);
        invoice.setNotes("Super Admin tomonidan qo'lda faollashtirildi: " + (req.getNotes() != null ? req.getNotes() : ""));
        invoice.setPaidAt(Instant.now());
        invoice.setDueDate(Instant.now());
        SubscriptionInvoice savedInvoice = invoiceRepository.save(invoice);

        // Create payment record
        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setInvoice(savedInvoice);
        payment.setTenant(tenant);
        payment.setPlan(plan);
        payment.setAmount(finalAmt);
        payment.setCurrency(plan.getCurrency());
        payment.setProvider(PaymentProviderType.MANUAL);
        payment.setStatus(SubscriptionPaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        payment.setProviderTransactionId("MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        paymentRepository.save(payment);

        // Update or create subscription
        Optional<RestaurantSubscription> existingSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
        RestaurantSubscription sub;
        if (existingSubOpt.isPresent()) {
            sub = existingSubOpt.get();
            sub.setPlan(plan);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setStartDate(start);
            sub.setEndDate(end);
            sub.setNotes(req.getNotes());
        } else {
            sub = new RestaurantSubscription();
            sub.setTenant(tenant);
            sub.setPlan(plan);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setStartDate(start);
            sub.setEndDate(end);
            sub.setNotes(req.getNotes());
        }
        sub = subscriptionRepository.save(sub);

        savedInvoice.setSubscription(sub);
        invoiceRepository.save(savedInvoice);

        payment.setSubscription(sub);
        paymentRepository.save(payment);

        // Period history
        SubscriptionPeriod period = new SubscriptionPeriod();
        period.setSubscription(sub);
        period.setTenant(tenant);
        period.setPlan(plan);
        period.setStartDate(start);
        period.setEndDate(end);
        period.setPeriodType(SubscriptionPeriodType.MANUAL);
        period.setInvoice(savedInvoice);
        periodRepository.save(period);

        // Activate tenant
        tenant.setStatus(RestaurantStatus.ACTIVE);
        tenant.setActive(true);
        tenantRepository.save(tenant);

        // Audit Log
        UUID currentUserId = TenantContext.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        auditService.log(tenant, currentUser, currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "MANUAL_SUBSCRIPTION_ACTIVATION", "RestaurantSubscription", sub.getId(),
                Map.of("plan", plan.getCode(), "months", months, "finalAmount", finalAmt, "startDate", start.toString(), "endDate", end.toString()));

        return getCurrentSubscription(tenant.getId());
    }

    // ==========================================
    // PAYMENT WEBHOOKS (AUTOMATED PROCESSING)
    // ==========================================

    @Transactional
    public BillingDto.CurrentSubscriptionResponse processPaymentSuccess(UUID paymentId, String providerTxId, Map<String, Object> payload) {
        SubscriptionPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + paymentId));

        if (payment.getStatus() == SubscriptionPaymentStatus.PAID) {
            log.info("Payment {} already marked as PAID", paymentId);
            return getCurrentSubscription(payment.getTenant().getId());
        }

        Instant now = Instant.now();
        payment.setStatus(SubscriptionPaymentStatus.PAID);
        payment.setPaidAt(now);
        payment.setProviderTransactionId(providerTxId);
        if (payload != null && !payload.isEmpty()) {
            Map<String, Object> meta = payment.getMetadata() != null ? new HashMap<>(payment.getMetadata()) : new HashMap<>();
            meta.putAll(payload);
            payment.setMetadata(meta);
        }
        paymentRepository.save(payment);

        SubscriptionInvoice invoice = payment.getInvoice();
        if (invoice != null) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(now);
            invoiceRepository.save(invoice);
        }

        Tenant tenant = payment.getTenant();
        SubscriptionPlan plan = payment.getPlan();
        int months = invoice != null ? invoice.getDurationMonths() : 1;

        Optional<RestaurantSubscription> existingSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
        RestaurantSubscription activeSub;
        SubscriptionPeriodType periodType;

        if (existingSubOpt.isPresent() && existingSubOpt.get().isOperating()) {
            activeSub = existingSubOpt.get();
            boolean isSamePlan = activeSub.getPlan().getId().equals(plan.getId());
            if (isSamePlan) {
                Instant newEndDate = addCalendarMonths(activeSub.getEndDate(), months);
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.RENEWAL;
            } else {
                Instant newEndDate = addCalendarMonths(now, months);
                activeSub.setPlan(plan);
                activeSub.setStartDate(now);
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.UPGRADE;
            }
            activeSub = subscriptionRepository.save(activeSub);
        } else {
            Instant newEndDate = addCalendarMonths(now, months);
            activeSub = new RestaurantSubscription();
            activeSub.setTenant(tenant);
            activeSub.setPlan(plan);
            activeSub.setStatus(SubscriptionStatus.ACTIVE);
            activeSub.setStartDate(now);
            activeSub.setEndDate(newEndDate);
            activeSub = subscriptionRepository.save(activeSub);
            periodType = SubscriptionPeriodType.INITIAL;
        }

        if (invoice != null) {
            invoice.setSubscription(activeSub);
            invoiceRepository.save(invoice);
        }
        payment.setSubscription(activeSub);
        paymentRepository.save(payment);

        SubscriptionPeriod period = new SubscriptionPeriod();
        period.setSubscription(activeSub);
        period.setTenant(tenant);
        period.setPlan(plan);
        period.setStartDate(activeSub.getStartDate());
        period.setEndDate(activeSub.getEndDate());
        period.setPeriodType(periodType);
        period.setInvoice(invoice);
        periodRepository.save(period);

        if (tenant.getStatus() == RestaurantStatus.PENDING || tenant.getStatus() == RestaurantStatus.SUSPENDED) {
            tenant.setStatus(RestaurantStatus.ACTIVE);
            tenant.setActive(true);
            tenantRepository.save(tenant);
        }

        auditService.log(tenant, null, "PAYMENT_WEBHOOK", "WEBHOOK",
                "PAYMENT_SUCCESS", "SubscriptionPayment", payment.getId(),
                Map.of("providerTxId", providerTxId, "amount", payment.getAmount(), "plan", plan.getCode()));

        return getCurrentSubscription(tenant.getId());
    }

    @Transactional
    public void processPaymentFailed(UUID paymentId, String reason) {
        SubscriptionPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + paymentId));

        payment.setStatus(SubscriptionPaymentStatus.FAILED);
        paymentRepository.save(payment);

        if (payment.getInvoice() != null) {
            payment.getInvoice().setStatus(InvoiceStatus.CANCELLED);
            invoiceRepository.save(payment.getInvoice());
        }

        auditService.log(payment.getTenant(), null, "PAYMENT_WEBHOOK", "WEBHOOK",
                "PAYMENT_FAILED", "SubscriptionPayment", payment.getId(),
                Map.of("reason", reason != null ? reason : "Unknown failure"));
    }

    // ==========================================
    // INVOICE & PAYMENT HISTORY
    // ==========================================

    @Transactional(readOnly = true)
    public List<BillingDto.InvoiceResponse> getTenantInvoices(UUID tenantId) {
        return invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toInvoiceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toInvoiceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PaymentHistoryItem> getTenantPaymentHistory(UUID tenantId) {
        return paymentRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toPaymentHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.PaymentHistoryItem> getPlatformPaymentHistory() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toPaymentHistoryItem)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingDto.SubscriptionPeriodResponse> getSubscriptionPeriods(UUID tenantId) {
        return periodRepository.findAllByTenantIdOrderByStartDateDesc(tenantId).stream()
                .map(p -> BillingDto.SubscriptionPeriodResponse.builder()
                        .id(p.getId())
                        .planName(p.getPlan().getName())
                        .planCode(p.getPlan().getCode())
                        .startDate(p.getStartDate())
                        .endDate(p.getEndDate())
                        .periodType(p.getPeriodType().name())
                        .invoiceNumber(p.getInvoice() != null ? p.getInvoice().getInvoiceNumber() : null)
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ==========================================
    // SUPER ADMIN OVERVIEW & DASHBOARD
    // ==========================================

    @Transactional(readOnly = true)
    public BillingDto.PlatformSubscriptionOverview getPlatformSubscriptionOverview() {
        long total = subscriptionRepository.count();
        long active = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        long trial = subscriptionRepository.countByStatus(SubscriptionStatus.TRIAL);
        long expiringSoon = subscriptionRepository.countByStatus(SubscriptionStatus.EXPIRING_SOON);
        long expired = subscriptionRepository.countByStatus(SubscriptionStatus.EXPIRED);
        long cancelled = subscriptionRepository.countByStatus(SubscriptionStatus.CANCELLED);
        long pending = invoiceRepository.countByStatus(InvoiceStatus.PENDING);

        BigDecimal totalRevenue = invoiceRepository.sumTotalPaidRevenue();
        BigDecimal totalDiscounts = invoiceRepository.sumTotalDiscounts();
        long manualPayments = paymentRepository.countByStatus(SubscriptionPaymentStatus.PAID);

        List<RestaurantSubscription> allSubs = subscriptionRepository.findAllByOrderByCreatedAtDesc();

        // Calculate exact MRR from all operating subscriptions
        BigDecimal mrr = BigDecimal.ZERO;
        for (RestaurantSubscription s : allSubs) {
            if (s.isOperating() && (s.getStatus() == SubscriptionStatus.ACTIVE || s.getStatus() == SubscriptionStatus.EXPIRING_SOON)) {
                BigDecimal pPrice = s.getPlan().getPrice();
                if (s.getPlan().getBillingPeriod() == BillingPeriod.YEARLY) {
                    pPrice = pPrice.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
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
                        .yearlyPrice(s.getPlan().getYearlyPrice())
                        .status(s.getStatus().name())
                        .startDate(s.getStartDate())
                        .endDate(s.getEndDate())
                        .daysRemaining(s.getDaysRemaining())
                        .operating(s.isOperating())
                        .nextPlanName(s.getNextPlan() != null ? s.getNextPlan().getName() : null)
                        .build())
                .collect(Collectors.toList());

        return BillingDto.PlatformSubscriptionOverview.builder()
                .totalSubscriptions(total)
                .activeSubscriptions(active)
                .trialSubscriptions(trial)
                .expiringSoonSubscriptions(expiringSoon)
                .expiredSubscriptions(expired)
                .cancelledSubscriptions(cancelled)
                .pendingPaymentSubscriptions(pending)
                .totalRevenue(totalRevenue)
                .monthlyRecurringRevenue(mrr)
                .totalDiscountsGiven(totalDiscounts)
                .manualPaymentsCount(manualPayments)
                .subscriptions(summaryList)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BillingDto.AuditLogResponse> getAuditLogs() {
        return auditService.getRecentAuditLogs();
    }

    @Transactional(readOnly = true)
    public List<BillingDto.AuditLogResponse> getTenantAuditLogs(UUID tenantId) {
        return auditService.getTenantAuditLogs(tenantId);
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

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    public static Instant addCalendarMonths(Instant start, int months) {
        ZonedDateTime zdt = start.atZone(TASHKENT_ZONE);
        return zdt.plusMonths(months).toInstant();
    }

    public static Instant addCalendarDays(Instant start, int days) {
        ZonedDateTime zdt = start.atZone(TASHKENT_ZONE);
        return zdt.plusDays(days).toInstant();
    }

    private String generateInvoiceNumber() {
        ZonedDateTime now = ZonedDateTime.now(TASHKENT_ZONE);
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "INV-" + datePart + "-" + rand;
    }

    private String formatDateTashkent(Instant instant) {
        if (instant == null) return "";
        return ZonedDateTime.ofInstant(instant, TASHKENT_ZONE)
                .format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
    }

    private BillingDto.PlanResponse toPlanResponse(SubscriptionPlan plan) {
        return BillingDto.PlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .price(plan.getPrice())
                .yearlyPrice(plan.getYearlyPrice())
                .currency(plan.getCurrency())
                .billingPeriod(plan.getBillingPeriod().name())
                .trialEnabled(plan.isTrialEnabled())
                .trialDays(plan.getTrialDays())
                .maxUsers(plan.getMaxUsers())
                .maxTables(plan.getMaxTables())
                .maxProducts(plan.getMaxProducts())
                .maxKitchens(plan.getMaxKitchens())
                .maxDevices(plan.getMaxDevices())
                .maxBranches(plan.getMaxBranches())
                .maxOrdersPerMonth(plan.getMaxOrdersPerMonth())
                .features(plan.getFeatures())
                .active(plan.isActive())
                .archived(plan.isArchived())
                .sortOrder(plan.getSortOrder())
                .build();
    }

    private BillingDto.InvoiceResponse toInvoiceResponse(SubscriptionInvoice i) {
        return BillingDto.InvoiceResponse.builder()
                .id(i.getId())
                .invoiceNumber(i.getInvoiceNumber())
                .tenantId(i.getTenant().getId())
                .restaurantName(i.getTenant().getName())
                .restaurantCode(i.getTenant().getCode())
                .planCode(i.getPlan().getCode())
                .planName(i.getPlan().getName())
                .durationMonths(i.getDurationMonths())
                .baseAmount(i.getBaseAmount())
                .discountPercent(i.getDiscountPercent())
                .discountAmount(i.getDiscountAmount())
                .adjustmentAmount(i.getAdjustmentAmount())
                .finalAmount(i.getFinalAmount())
                .currency(i.getCurrency())
                .status(i.getStatus().name())
                .paymentMethod(i.getPaymentMethod().name())
                .notes(i.getNotes())
                .dueDate(i.getDueDate())
                .paidAt(i.getPaidAt())
                .createdAt(i.getCreatedAt())
                .build();
    }

    private BillingDto.PaymentHistoryItem toPaymentHistoryItem(SubscriptionPayment p) {
        return BillingDto.PaymentHistoryItem.builder()
                .id(p.getId())
                .invoiceId(p.getInvoice() != null ? p.getInvoice().getId() : null)
                .invoiceNumber(p.getInvoice() != null ? p.getInvoice().getInvoiceNumber() : null)
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
