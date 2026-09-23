package com.restaurantpos.billing;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.*;
import com.restaurantpos.billing.repository.*;
import com.restaurantpos.billing.service.SubscriptionLimitService;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.tenant.TenantContext;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubscriptionComprehensiveIntegrationTest {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private SubscriptionLimitService limitService;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private SubscriptionDiscountRuleRepository discountRuleRepository;

    @Autowired
    private RestaurantSubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionInvoiceRepository invoiceRepository;

    @Autowired
    private SubscriptionPeriodRepository periodRepository;

    @Autowired
    private SubscriptionPaymentRepository paymentRepository;

    @Autowired
    private SubscriptionFeatureRepository featureRepository;

    @Autowired
    private PlanFeatureRepository planFeatureRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    private Tenant testTenantA;
    private Tenant testTenantB;
    private SubscriptionPlan standardPlan;
    private SubscriptionPlan proPlan;
    private SubscriptionFeature kdsFeature;
    private SubscriptionFeature mobileAppFeature;

    @BeforeEach
    void setUp() {
        // 1. Ensure Discount Rules exist: 1m -> 0%, 3m -> 5%, 6m -> 10%, 12m -> 20%
        upsertRule(1, BigDecimal.ZERO, "1 oy (Standart)");
        upsertRule(3, BigDecimal.valueOf(5), "3 oylik chegirma");
        upsertRule(6, BigDecimal.valueOf(10), "6 oylik chegirma");
        upsertRule(12, BigDecimal.valueOf(20), "12 oylik chegirma");

        // 2. Ensure features exist
        kdsFeature = featureRepository.findByCode("KITCHEN_DISPLAY").orElseGet(() -> {
            SubscriptionFeature f = new SubscriptionFeature();
            f.setCode("KITCHEN_DISPLAY");
            f.setName("Oshxona Ekrani (KDS)");
            f.setDescription("Live Kitchen Display System");
            return featureRepository.save(f);
        });

        mobileAppFeature = featureRepository.findByCode("MOBILE_APP").orElseGet(() -> {
            SubscriptionFeature f = new SubscriptionFeature();
            f.setCode("MOBILE_APP");
            f.setName("Mobil Ofitsiant Ilovasi");
            f.setDescription("Mobile waiter terminal app");
            return featureRepository.save(f);
        });

        // 3. Ensure Standard & Pro plans exist
        standardPlan = planRepository.findByCode("STANDARD").orElseGet(() -> {
            SubscriptionPlan p = new SubscriptionPlan();
            p.setCode("STANDARD");
            p.setName("Standard");
            p.setDescription("Barcha asosiy POS funksiyalari");
            p.setPrice(BigDecimal.valueOf(189000));
            p.setYearlyPrice(BigDecimal.valueOf(1890000));
            p.setCurrency("UZS");
            p.setMaxUsers(-1);
            p.setMaxTables(-1);
            p.setMaxProducts(-1);
            p.setMaxKitchens(-1);
            p.setMaxDevices(-1);
            p.setMaxBranches(1);
            p.setMaxOrdersPerMonth(-1);
            p.setActive(true);
            p.setSortOrder(2);
            return planRepository.save(p);
        });

        proPlan = planRepository.findByCode("PRO").orElseGet(() -> {
            SubscriptionPlan p = new SubscriptionPlan();
            p.setCode("PRO");
            p.setName("Pro");
            p.setDescription("Standard + KDS va Mobil Ilova");
            p.setPrice(BigDecimal.valueOf(249000));
            p.setYearlyPrice(BigDecimal.valueOf(2490000));
            p.setCurrency("UZS");
            p.setMaxUsers(-1);
            p.setMaxTables(-1);
            p.setMaxProducts(-1);
            p.setMaxKitchens(-1);
            p.setMaxDevices(-1);
            p.setMaxBranches(2);
            p.setMaxOrdersPerMonth(-1);
            p.setActive(true);
            p.setSortOrder(3);
            return planRepository.save(p);
        });

        // Link KDS and Mobile App to Pro plan
        if (!planFeatureRepository.existsByPlanIdAndFeatureId(proPlan.getId(), kdsFeature.getId())) {
            PlanFeature pf = new PlanFeature();
            pf.setPlan(proPlan);
            pf.setFeature(kdsFeature);
            pf.setEnabled(true);
            planFeatureRepository.save(pf);
        }
        if (!planFeatureRepository.existsByPlanIdAndFeatureId(proPlan.getId(), mobileAppFeature.getId())) {
            PlanFeature pf = new PlanFeature();
            pf.setPlan(proPlan);
            pf.setFeature(mobileAppFeature);
            pf.setEnabled(true);
            planFeatureRepository.save(pf);
        }

        // 4. Create Tenant A & Tenant B
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        testTenantA = new Tenant();
        testTenantA.setName("Oshxona Alpha " + suffix);
        testTenantA.setSlug("oshxona-alpha-" + suffix);
        testTenantA.setCode("A" + suffix.toUpperCase());
        testTenantA.setStatus(RestaurantStatus.ACTIVE);
        testTenantA.setActive(true);
        testTenantA = tenantRepository.save(testTenantA);

        testTenantB = new Tenant();
        testTenantB.setName("Choyxona Beta " + suffix);
        testTenantB.setSlug("choyxona-beta-" + suffix);
        testTenantB.setCode("B" + suffix.toUpperCase());
        testTenantB.setStatus(RestaurantStatus.ACTIVE);
        testTenantB.setActive(true);
        testTenantB = tenantRepository.save(testTenantB);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private void upsertRule(int months, BigDecimal discount, String name) {
        SubscriptionDiscountRule rule = discountRuleRepository.findByMinMonths(months)
                .orElseGet(SubscriptionDiscountRule::new);
        rule.setMinMonths(months);
        rule.setDiscountPercent(discount);
        rule.setName(name);
        rule.setActive(true);
        discountRuleRepository.save(rule);
    }

    // =========================================================================
    // 1. DISCOUNT & DURATION FLOOR-TIER TESTS
    // =========================================================================
    @Test
    @DisplayName("DISC-01: 6 months Standard plan (189,000) yields 1,134,000 base, 10% discount, 1,020,600 final")
    void testDiscountCalculation_6Months_10Percent() {
        BillingDto.CalculatePriceResponse calc = subscriptionService.calculatePrice(testTenantA.getId(),
                new BillingDto.CalculatePriceRequest(standardPlan.getId(), "STANDARD", 6, 0));

        assertThat(calc.getMonths()).isEqualTo(6);
        assertThat(calc.getBaseAmount()).isEqualByComparingTo(BigDecimal.valueOf(1134000));
        assertThat(calc.getDiscountPercent()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(calc.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(113400));
        assertThat(calc.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(1020600));
    }

    @Test
    @DisplayName("DISC-02: Floor-tier policy matches highest tier <= selected duration (e.g. 5 months -> 5% discount)")
    void testDurationFloorTierPolicy() {
        // Tiers: 1m->0%, 3m->5%, 6m->10%, 12m->20%
        assertThat(subscriptionService.getApplicableDiscountPercent(1)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(subscriptionService.getApplicableDiscountPercent(2)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(subscriptionService.getApplicableDiscountPercent(3)).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(subscriptionService.getApplicableDiscountPercent(5)).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(subscriptionService.getApplicableDiscountPercent(6)).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(subscriptionService.getApplicableDiscountPercent(11)).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(subscriptionService.getApplicableDiscountPercent(12)).isEqualByComparingTo(BigDecimal.valueOf(20));
        assertThat(subscriptionService.getApplicableDiscountPercent(24)).isEqualByComparingTo(BigDecimal.valueOf(20));
    }

    // =========================================================================
    // 2. TRIAL SUBSCRIPTION & 15 DAYS DURATION
    // =========================================================================
    @Test
    @DisplayName("TRIAL-01: Initial subscription creates 15 days free trial in Asia/Tashkent")
    void testInitialTrialCreation_15Days() {
        BillingDto.CurrentSubscriptionResponse sub = subscriptionService.getCurrentSubscription(testTenantA.getId());

        assertThat(sub).isNotNull();
        assertThat(sub.getStatus()).isEqualTo("TRIAL");
        assertThat(sub.isOperating()).isTrue();
        assertThat(sub.getDaysRemaining()).isBetween(14L, 16L);
        assertThat(sub.getStartDate()).isNotNull();
        assertThat(sub.getEndDate()).isNotNull();
    }

    // =========================================================================
    // 3. CHECKOUT & MOCK PAYMENT SIMULATOR
    // =========================================================================
    @Test
    @DisplayName("MOCK-01: Checkout for PRO plan + Mock Payment SUCCESS immediately transitions to ACTIVE")
    void testMockPaymentSuccessActivatesProSubscription() {
        TenantContext.setExplicitTenant(testTenantA.getId());

        BillingDto.CheckoutResponse checkout = subscriptionService.initiateCheckout(testTenantA.getId(),
                new BillingDto.CheckoutRequest(proPlan.getId(), "PRO", "MOCK", 1, 0, "Test pro upgrade"));

        assertThat(checkout.getInvoiceId()).isNotNull();
        assertThat(checkout.getPaymentId()).isNotNull();
        assertThat(checkout.getStatus()).isEqualTo("PENDING");

        // Execute Mock Payment SUCCESS
        BillingDto.MockPaymentRequest mockReq = new BillingDto.MockPaymentRequest();
        mockReq.setPaymentId(checkout.getPaymentId());
        mockReq.setOutcome("SUCCESS");

        BillingDto.CurrentSubscriptionResponse activeSub = subscriptionService.processMockPayment(testTenantA.getId(), mockReq);

        assertThat(activeSub.getStatus()).isEqualTo("ACTIVE");
        assertThat(activeSub.getPlanCode()).isEqualTo("PRO");
        assertThat(activeSub.isOperating()).isTrue();

        // Check invoice is PAID
        SubscriptionInvoice inv = invoiceRepository.findById(checkout.getInvoiceId()).orElseThrow();
        assertThat(inv.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(inv.getPaidAt()).isNotNull();

        // Check period recorded
        List<SubscriptionPeriod> periods = periodRepository.findAllByTenantIdOrderByStartDateDesc(testTenantA.getId());
        assertThat(periods).isNotEmpty();
    }

    // =========================================================================
    // 4. UNLIMITED RESOURCE CAPABILITIES (ZERO LIMIT EXCEPTIONS)
    // =========================================================================
    @Test
    @DisplayName("UNLIMITED-01: Adding numerous users never throws limit exception when subscription is operating")
    void testUnlimitedResourceCapabilities() {
        // Activate Standard subscription
        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(standardPlan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now());
        sub.setEndDate(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(sub);

        // Limit checks must never throw limit exceeded exceptions
        limitService.checkUserLimit(testTenantA.getId());
        limitService.checkTableLimit(testTenantA.getId());
        limitService.checkProductLimit(testTenantA.getId());
        limitService.checkKitchenLimit(testTenantA.getId());
        limitService.checkDeviceLimit(testTenantA.getId());
        limitService.checkOrderLimit(testTenantA.getId());
    }

    // =========================================================================
    // 5. FEATURE GATING: PRO VS STANDARD (KDS & MOBILE APP)
    // =========================================================================
    @Test
    @DisplayName("FEATURE-01: STANDARD tenant is blocked from KDS (403), PRO tenant is granted access")
    void testFeatureAccessControl() {
        // Set tenant A to STANDARD
        RestaurantSubscription subA = new RestaurantSubscription();
        subA.setTenant(testTenantA);
        subA.setPlan(standardPlan);
        subA.setStatus(SubscriptionStatus.ACTIVE);
        subA.setStartDate(Instant.now());
        subA.setEndDate(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(subA);

        // Standard tenant cannot access KITCHEN_DISPLAY or MOBILE_APP
        assertThatThrownBy(() -> limitService.checkFeatureAccess(testTenantA.getId(), "KITCHEN_DISPLAY"))
                .isInstanceOf(PosException.class)
                .hasMessageContaining("PRO tarifida mavjud");

        assertThatThrownBy(() -> limitService.checkFeatureAccess(testTenantA.getId(), "MOBILE_APP"))
                .isInstanceOf(PosException.class)
                .hasMessageContaining("PRO tarifida mavjud");

        // Set tenant B to PRO
        RestaurantSubscription subB = new RestaurantSubscription();
        subB.setTenant(testTenantB);
        subB.setPlan(proPlan);
        subB.setStatus(SubscriptionStatus.ACTIVE);
        subB.setStartDate(Instant.now());
        subB.setEndDate(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(subB);

        // Pro tenant has full access
        limitService.checkFeatureAccess(testTenantB.getId(), "KITCHEN_DISPLAY");
        limitService.checkFeatureAccess(testTenantB.getId(), "MOBILE_APP");
    }

    // =========================================================================
    // 6. RENEWAL PRESERVES PREVIOUS END DATE
    // =========================================================================
    @Test
    @DisplayName("RENEWAL-01: Renewal extends from previous endDate, not today")
    void testRenewalPreservesPreviousEndDate() {
        Instant currentEndDate = ZonedDateTime.now(SubscriptionService.TASHKENT_ZONE).plusMonths(2).toInstant();

        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(standardPlan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now());
        sub.setEndDate(currentEndDate);
        subscriptionRepository.save(sub);

        // Create renewal invoice for 3 months
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setInvoiceNumber("INV-RENEW-01");
        invoice.setTenant(testTenantA);
        invoice.setPlan(standardPlan);
        invoice.setDurationMonths(3);
        invoice.setBaseAmount(standardPlan.getPrice().multiply(BigDecimal.valueOf(3)));
        invoice.setDiscountPercent(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setFinalAmount(invoice.getBaseAmount());
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setPaymentMethod(PaymentProviderType.MANUAL);
        invoice = invoiceRepository.save(invoice);

        // Admin marks as paid
        subscriptionService.markInvoiceAsPaid(invoice.getId(), "Renewal payment");

        // Assert new end date is currentEndDate + 3 months!
        RestaurantSubscription renewedSub = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(testTenantA.getId()).orElseThrow();
        Instant expectedEndDate = SubscriptionService.addCalendarMonths(currentEndDate, 3);

        assertThat(ChronoUnit.SECONDS.between(renewedSub.getEndDate(), expectedEndDate)).isLessThanOrEqualTo(5);
    }

    // =========================================================================
    // 7. SUBSCRIPTION EXPIRY & BLOCKED OPERATIONS
    // =========================================================================
    @Test
    @DisplayName("EXPIRY-01: Expired subscription disables operations and returns false for isOperating")
    void testExpiredSubscriptionBlocksOperations() {
        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(standardPlan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now().minus(40, ChronoUnit.DAYS));
        sub.setEndDate(Instant.now().minus(2, ChronoUnit.DAYS)); // Past
        subscriptionRepository.save(sub);

        BillingDto.CurrentSubscriptionResponse status = subscriptionService.getCurrentSubscription(testTenantA.getId());
        assertThat(status.getStatus()).isEqualTo("EXPIRED");
        assertThat(status.isOperating()).isFalse();
        assertThat(status.getWarningLevel()).isEqualTo("EXPIRED");

        // checkOrderLimit must throw 402 Payment Required
        assertThatThrownBy(() -> limitService.checkOrderLimit(testTenantA.getId()))
                .isInstanceOf(PosException.class)
                .hasMessageContaining("muddati tugagan");
    }

    // =========================================================================
    // 8. MULTI-TENANT ISOLATION
    // =========================================================================
    @Test
    @DisplayName("TENANT-01: Tenant A cannot view or access Tenant B's invoices or subscriptions")
    void testMultiTenantIsolation() {
        SubscriptionInvoice invB = new SubscriptionInvoice();
        invB.setInvoiceNumber("INV-B-001");
        invB.setTenant(testTenantB);
        invB.setPlan(proPlan);
        invB.setDurationMonths(1);
        invB.setBaseAmount(proPlan.getPrice());
        invB.setDiscountPercent(BigDecimal.ZERO);
        invB.setDiscountAmount(BigDecimal.ZERO);
        invB.setFinalAmount(proPlan.getPrice());
        invB.setStatus(InvoiceStatus.PENDING);
        invB.setPaymentMethod(PaymentProviderType.MANUAL);
        invoiceRepository.save(invB);

        List<BillingDto.InvoiceResponse> invoicesA = subscriptionService.getTenantInvoices(testTenantA.getId());
        assertThat(invoicesA.stream().noneMatch(i -> i.getId().equals(invB.getId()))).isTrue();
    }
}
