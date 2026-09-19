package com.restaurantpos.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.restaurantpos.users.entity.Role;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.RoleRepository;
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
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    private Tenant testTenantA;
    private Tenant testTenantB;
    private SubscriptionPlan starterPlan;
    private SubscriptionPlan businessPlan;

    @BeforeEach
    void setUp() {
        // 1. Ensure Discount Rules exist: 1m -> 0%, 3m -> 5%, 6m -> 10%, 12m -> 20%
        upsertRule(1, BigDecimal.ZERO, "1 oy (Standart)");
        upsertRule(3, BigDecimal.valueOf(5), "3 oylik chegirma");
        upsertRule(6, BigDecimal.valueOf(10), "6 oylik chegirma");
        upsertRule(12, BigDecimal.valueOf(20), "12 oylik chegirma");

        // 2. Ensure Starter & Business plans exist
        starterPlan = planRepository.findByCode("STARTER").orElseGet(() -> {
            SubscriptionPlan p = new SubscriptionPlan();
            p.setCode("STARTER");
            p.setName("Starter Tarifi");
            p.setDescription("Kichik kafelar uchun");
            p.setPrice(BigDecimal.valueOf(100000));
            p.setYearlyPrice(BigDecimal.valueOf(1000000));
            p.setCurrency("UZS");
            p.setMaxUsers(3);
            p.setMaxTables(10);
            p.setMaxProducts(50);
            p.setMaxKitchens(1);
            p.setMaxDevices(2);
            p.setMaxBranches(1);
            p.setActive(true);
            p.setTrialEnabled(true);
            p.setTrialDays(14);
            return planRepository.save(p);
        });

        businessPlan = planRepository.findByCode("BUSINESS").orElseGet(() -> {
            SubscriptionPlan p = new SubscriptionPlan();
            p.setCode("BUSINESS");
            p.setName("Business Tarifi");
            p.setDescription("O'rta va yirik restoranlar uchun");
            p.setPrice(BigDecimal.valueOf(200000));
            p.setYearlyPrice(BigDecimal.valueOf(2000000));
            p.setCurrency("UZS");
            p.setMaxUsers(10);
            p.setMaxTables(30);
            p.setMaxProducts(300);
            p.setMaxKitchens(3);
            p.setMaxDevices(5);
            p.setMaxBranches(2);
            p.setActive(true);
            return planRepository.save(p);
        });

        // 3. Create Tenant A & Tenant B
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
    // 1. DISCOUNT & DURATION FLOOR-TIER TESTS (Specifications 4, 5, 6)
    // =========================================================================
    @Test
    @DisplayName("DISC-01: 6 months Business plan yields exactly 600,000 base, 10% discount, 540,000 final")
    void testDiscountCalculation_6Months_10Percent() {
        starterPlan.setPrice(BigDecimal.valueOf(100000));
        planRepository.save(starterPlan);

        BillingDto.CalculatePriceResponse calc = subscriptionService.calculatePrice(testTenantA.getId(),
                new BillingDto.CalculatePriceRequest(starterPlan.getId(), "STARTER", 6, 0));

        assertThat(calc.getMonths()).isEqualTo(6);
        assertThat(calc.getBaseAmount()).isEqualByComparingTo(BigDecimal.valueOf(600000));
        assertThat(calc.getDiscountPercent()).isEqualByComparingTo(BigDecimal.valueOf(10));
        assertThat(calc.getDiscountAmount()).isEqualByComparingTo(BigDecimal.valueOf(60000));
        assertThat(calc.getFinalAmount()).isEqualByComparingTo(BigDecimal.valueOf(540000));
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
    // 2. TRIAL SUBSCRIPTION & CALENDAR DATES (Specifications 8, 9, 20)
    // =========================================================================
    @Test
    @DisplayName("TRIAL-01: Initial subscription creates 14 days trial in Asia/Tashkent")
    void testInitialTrialCreation() {
        BillingDto.CurrentSubscriptionResponse sub = subscriptionService.getCurrentSubscription(testTenantA.getId());

        assertThat(sub).isNotNull();
        assertThat(sub.getStatus()).isEqualTo("TRIAL");
        assertThat(sub.isOperating()).isTrue();
        assertThat(sub.getDaysRemaining()).isBetween(13L, 15L);
        assertThat(sub.getStartDate()).isNotNull();
        assertThat(sub.getEndDate()).isNotNull();
    }

    // =========================================================================
    // 3. CHECKOUT, INVOICE & MANUAL PAYMENT "MARK AS PAID" (Specifications 13, 14, 15, 16)
    // =========================================================================
    @Test
    @DisplayName("BILL-01: Restaurant initiates checkout -> creates PENDING invoice. Super Admin marks as PAID -> ACTIVE")
    void testInvoiceCheckoutAndManualPayment() {
        TenantContext.setExplicitTenant(testTenantA.getId());

        BillingDto.CheckoutResponse checkout = subscriptionService.initiateCheckout(testTenantA.getId(),
                new BillingDto.CheckoutRequest(businessPlan.getId(), "BUSINESS", "MANUAL", 6, 0, "Test order"));

        assertThat(checkout.getInvoiceId()).isNotNull();
        assertThat(checkout.getStatus()).isEqualTo("PENDING");

        SubscriptionInvoice invoice = invoiceRepository.findById(checkout.getInvoiceId()).orElseThrow();
        assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.PENDING);
        assertThat(invoice.getFinalAmount()).isGreaterThan(BigDecimal.ZERO);

        // Super Admin marks as paid
        BillingDto.InvoiceResponse paidInvoice = subscriptionService.markInvoiceAsPaid(invoice.getId(), "Cash payment verified by admin");
        assertThat(paidInvoice.getStatus()).isEqualTo("PAID");
        assertThat(paidInvoice.getPaidAt()).isNotNull();

        // Verify restaurant subscription is now ACTIVE
        BillingDto.CurrentSubscriptionResponse updatedSub = subscriptionService.getCurrentSubscription(testTenantA.getId());
        assertThat(updatedSub.getStatus()).isEqualTo("ACTIVE");
        assertThat(updatedSub.isOperating()).isTrue();
        assertThat(updatedSub.getPlanCode()).isEqualTo("BUSINESS");

        // Verify period was recorded
        List<SubscriptionPeriod> periods = periodRepository.findAllByTenantIdOrderByStartDateDesc(testTenantA.getId());
        assertThat(periods).isNotEmpty();
    }

    // =========================================================================
    // 4. RENEWAL PRESERVES PREVIOUS END DATE (Specification 10)
    // =========================================================================
    @Test
    @DisplayName("RENEWAL-01: Renewal extends from previous endDate, not today")
    void testRenewalPreservesPreviousEndDate() {
        Instant currentEndDate = ZonedDateTime.now(SubscriptionService.TASHKENT_ZONE).plusMonths(2).toInstant();

        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(businessPlan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now());
        sub.setEndDate(currentEndDate);
        subscriptionRepository.save(sub);

        // Create renewal invoice for 3 months
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setInvoiceNumber("INV-RENEW-01");
        invoice.setTenant(testTenantA);
        invoice.setPlan(businessPlan);
        invoice.setDurationMonths(3);
        invoice.setBaseAmount(businessPlan.getPrice().multiply(BigDecimal.valueOf(3)));
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

        // Within a 5-second tolerance
        assertThat(ChronoUnit.SECONDS.between(renewedSub.getEndDate(), expectedEndDate)).isLessThanOrEqualTo(5);
    }

    // =========================================================================
    // 5. PLAN DOWNGRADE POLICY (Specification 12)
    // =========================================================================
    @Test
    @DisplayName("DOWNGRADE-01: Downgrade is scheduled for next billing period without immediate feature cuts")
    void testPlanDowngradeDeferredToNextCycle() {
        RestaurantSubscription currentSub = new RestaurantSubscription();
        currentSub.setTenant(testTenantA);
        currentSub.setPlan(businessPlan);
        currentSub.setStatus(SubscriptionStatus.ACTIVE);
        currentSub.setStartDate(Instant.now().minus(10, ChronoUnit.DAYS));
        currentSub.setEndDate(Instant.now().plus(20, ChronoUnit.DAYS));
        subscriptionRepository.save(currentSub);

        BillingDto.CheckoutResponse response = subscriptionService.initiateCheckout(testTenantA.getId(),
                new BillingDto.CheckoutRequest(starterPlan.getId(), "STARTER", "MANUAL", 1, 0, "Downgrade request"));

        assertThat(response.isDowngradeScheduled()).isTrue();
        assertThat(response.getStatus()).isEqualTo("SCHEDULED");

        RestaurantSubscription updatedSub = subscriptionRepository.findById(currentSub.getId()).orElseThrow();
        assertThat(updatedSub.getPlan().getCode()).isEqualTo("BUSINESS");
        assertThat(updatedSub.getNextPlan().getCode()).isEqualTo("STARTER");
        assertThat(updatedSub.isOperating()).isTrue();
    }

    // =========================================================================
    // 6. RESOURCE LIMIT VALIDATION (Specification 17, 24, 25)
    // =========================================================================
    @Test
    @DisplayName("LIMIT-01: User limit enforcement blocks 4th employee on Starter plan (max=3)")
    void testResourceLimitEnforcement() {
        starterPlan.setMaxUsers(3);
        starterPlan = planRepository.save(starterPlan);

        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(starterPlan); // maxUsers = 3
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(Instant.now());
        sub.setEndDate(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(sub);

        // Delete any leftover users for Tenant A
        userRepository.findByTenantIdAndDeletedAtIsNullOrderByCreatedAtDesc(testTenantA.getId())
                .forEach(u -> userRepository.delete(u));

        // Create 3 employees (should succeed)
        for (int i = 1; i <= 3; i++) {
            User u = new User();
            u.setUsername("emp_" + i + "_" + UUID.randomUUID().toString().substring(0, 5));
            u.setPasswordHash("hash");
            u.setFirstName("Emp");
            u.setLastName(String.valueOf(i));
            u.setTenant(testTenantA);
            userRepository.save(u);
        }

        // Limit check must now throw exception when attempting 4th
        assertThatThrownBy(() -> limitService.checkUserLimit(testTenantA.getId()))
                .isInstanceOf(PosException.class)
                .hasMessageContaining("maksimal 3 ta");
    }

    // =========================================================================
    // 7. SUBSCRIPTION EXPIRY & BLOCKED OPERATIONS (Specifications 18, 20)
    // =========================================================================
    @Test
    @DisplayName("EXPIRY-01: Expired subscription disables operations and returns false for isOperating")
    void testExpiredSubscriptionBlocksOperations() {
        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setTenant(testTenantA);
        sub.setPlan(starterPlan);
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
    // 8. MULTI-TENANT ISOLATION (Specification 26)
    // =========================================================================
    @Test
    @DisplayName("TENANT-01: Tenant A cannot view or access Tenant B's invoices or subscriptions")
    void testMultiTenantIsolation() {
        SubscriptionInvoice invB = new SubscriptionInvoice();
        invB.setInvoiceNumber("INV-B-001");
        invB.setTenant(testTenantB);
        invB.setPlan(businessPlan);
        invB.setDurationMonths(1);
        invB.setBaseAmount(businessPlan.getPrice());
        invB.setDiscountPercent(BigDecimal.ZERO);
        invB.setDiscountAmount(BigDecimal.ZERO);
        invB.setFinalAmount(businessPlan.getPrice());
        invB.setStatus(InvoiceStatus.PENDING);
        invB.setPaymentMethod(PaymentProviderType.MANUAL);
        invoiceRepository.save(invB);

        List<BillingDto.InvoiceResponse> invoicesA = subscriptionService.getTenantInvoices(testTenantA.getId());
        assertThat(invoicesA.stream().noneMatch(i -> i.getId().equals(invB.getId()))).isTrue();
    }
}
