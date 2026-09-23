package com.restaurantpos.billing.service;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.dto.SubscriptionRequestDto;
import com.restaurantpos.billing.entity.*;
import com.restaurantpos.billing.repository.*;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.entity.Tenant;
import com.restaurantpos.tenants.repository.TenantRepository;
import com.restaurantpos.users.entity.User;
import com.restaurantpos.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionRequestService {

    private final SubscriptionRequestRepository requestRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubscriptionPaymentRepository paymentRepository;
    private final SubscriptionPeriodRepository periodRepository;
    private final SubscriptionAuditService auditService;
    private final SubscriptionService subscriptionService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // ==========================================
    // CLIENT (RESTAURANT ADMIN) METHODS
    // ==========================================

    @Transactional
    public SubscriptionRequestDto.Response createRequest(UUID tenantId, UUID userId, SubscriptionRequestDto.CreateRequest request) {
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        if (request.getPlanId() == null) {
            throw PosException.badRequest("Tarif rejasini tanlash majburiy!");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> PosException.notFound("Restoran topilmadi: " + tenantId));

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> PosException.notFound("Tarif topilmadi: " + request.getPlanId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Check if there is already a pending approval request for this tenant
        Optional<SubscriptionRequest> existingPendingOpt = requestRepository.findFirstByTenantIdAndStatusOrderByCreatedAtDesc(
                tenantId, SubscriptionRequestStatus.PENDING_APPROVAL);

        int durationMonths = (request.getDurationMonths() != null && request.getDurationMonths() > 0)
                ? request.getDurationMonths() : 1;

        // Calculate accurate final price including any plan period discounts
        BillingDto.CalculatePriceResponse calc = subscriptionService.calculatePrice(
                tenantId,
                new BillingDto.CalculatePriceRequest(plan.getId(), plan.getCode(), durationMonths, 0)
        );

        BigDecimal finalAmount = calc.getFinalAmount() != null ? calc.getFinalAmount() : plan.getPrice().multiply(BigDecimal.valueOf(durationMonths));
        String billingPeriod = request.getBillingPeriod() != null ? request.getBillingPeriod() : "MONTHLY";
        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_TRANSFER";

        SubscriptionRequest entity;
        if (existingPendingOpt.isPresent()) {
            // Update the existing pending request instead of cluttering with duplicate pending entries
            entity = existingPendingOpt.get();
            entity.setPlan(plan);
            entity.setRequestedByUser(user);
            entity.setBillingPeriod(billingPeriod);
            entity.setDurationMonths(durationMonths);
            entity.setAmount(finalAmount);
            entity.setCurrency(plan.getCurrency() != null ? plan.getCurrency() : "UZS");
            entity.setPaymentMethod(paymentMethod);
            if (request.getReceiptUrl() != null && !request.getReceiptUrl().isBlank()) {
                entity.setReceiptUrl(request.getReceiptUrl());
            }
            entity.setClientNotes(request.getClientNotes());
            entity.setRejectionReason(null);
            entity.setAdminNotes(null);
            log.info("Existing pending subscription request updated for tenant {} to plan {}", tenant.getCode(), plan.getCode());
        } else {
            entity = new SubscriptionRequest();
            entity.setTenant(tenant);
            entity.setPlan(plan);
            entity.setRequestedByUser(user);
            entity.setBillingPeriod(billingPeriod);
            entity.setDurationMonths(durationMonths);
            entity.setAmount(finalAmount);
            entity.setCurrency(plan.getCurrency() != null ? plan.getCurrency() : "UZS");
            entity.setPaymentMethod(paymentMethod);
            entity.setReceiptUrl(request.getReceiptUrl());
            entity.setClientNotes(request.getClientNotes());
            entity.setStatus(SubscriptionRequestStatus.PENDING_APPROVAL);
            log.info("New subscription request submitted for tenant {} to plan {}", tenant.getCode(), plan.getCode());
        }

        SubscriptionRequest saved = requestRepository.save(entity);

        auditService.log(tenant, user, user != null ? user.getUsername() : "USER", "USER",
                "SUBSCRIPTION_REQUEST_SUBMITTED", "SubscriptionRequest", saved.getId(),
                Map.of("plan", plan.getCode(), "amount", finalAmount, "months", durationMonths, "method", paymentMethod));

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubscriptionRequestDto.Response getLatestForTenant(UUID tenantId) {
        return requestRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionRequestDto.Response> getHistoryForTenant(UUID tenantId) {
        return requestRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SubscriptionRequestDto.Response cancelRequest(UUID tenantId, UUID requestId, UUID userId) {
        SubscriptionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> PosException.notFound("So'rov topilmadi: " + requestId));

        if (!request.getTenant().getId().equals(tenantId)) {
            throw PosException.forbidden("Ushbu so'rov sizning restoraningizga tegishli emas!");
        }

        if (request.getStatus() != SubscriptionRequestStatus.PENDING_APPROVAL) {
            throw PosException.badRequest("Faqat kutilayotgan (PENDING) arizani bekor qilish mumkin!");
        }

        request.setStatus(SubscriptionRequestStatus.CANCELLED);
        request.setReviewedAt(Instant.now());
        request.setAdminNotes("Mijoz tomonidan bekor qilindi");
        SubscriptionRequest saved = requestRepository.save(request);

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        auditService.log(request.getTenant(), user, user != null ? user.getUsername() : "USER", "USER",
                "SUBSCRIPTION_REQUEST_CANCELLED", "SubscriptionRequest", saved.getId(),
                Map.of("plan", request.getPlan().getCode()));

        return toResponse(saved);
    }

    // ==========================================
    // PLATFORM SUPER ADMIN METHODS
    // ==========================================

    @Transactional(readOnly = true)
    public List<SubscriptionRequestDto.Response> getAllRequestsForAdmin(SubscriptionRequestStatus status) {
        return requestRepository.findWithDetailsByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countPendingRequests() {
        return requestRepository.countByStatus(SubscriptionRequestStatus.PENDING_APPROVAL);
    }

    @Transactional
    public SubscriptionRequestDto.Response approveRequest(UUID requestId, UUID adminUserId, SubscriptionRequestDto.ApproveRequest approveReq) {
        SubscriptionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> PosException.notFound("So'rov topilmadi: " + requestId));

        if (request.getStatus() != SubscriptionRequestStatus.PENDING_APPROVAL) {
            throw PosException.badRequest("Ushbu ariza allaqachon ko'rib chiqilgan: " + request.getStatus());
        }

        User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
        Tenant tenant = request.getTenant();
        SubscriptionPlan plan = request.getPlan();
        int months = request.getDurationMonths();
        int bonusDays = (approveReq != null && approveReq.getCustomDaysBonus() != null && approveReq.getCustomDaysBonus() > 0)
                ? approveReq.getCustomDaysBonus() : 0;

        Instant now = Instant.now();

        // 1. Generate Invoice (Status: PAID)
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setTenant(tenant);
        invoice.setPlan(plan);
        invoice.setDurationMonths(months);
        invoice.setBaseAmount(request.getAmount());
        invoice.setDiscountPercent(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setAdjustmentAmount(BigDecimal.ZERO);
        invoice.setFinalAmount(request.getAmount());
        invoice.setCurrency(request.getCurrency());
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentMethod(PaymentProviderType.MANUAL);
        invoice.setNotes("B2B So'rov tasdiqlandi. " + (approveReq != null && approveReq.getAdminNotes() != null ? approveReq.getAdminNotes() : ""));
        invoice.setPaidAt(now);
        invoice = invoiceRepository.save(invoice);

        // 2. Generate Payment (Status: PAID)
        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setInvoice(invoice);
        payment.setTenant(tenant);
        payment.setPlan(plan);
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency());
        payment.setStatus(SubscriptionPaymentStatus.PAID);
        payment.setProvider(PaymentProviderType.MANUAL);
        payment.setProviderTransactionId("REQ-APPR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaidAt(now);
        payment = paymentRepository.save(payment);

        // 3. Activate or Extend Restaurant Subscription
        Optional<RestaurantSubscription> existingSubOpt = subscriptionRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenant.getId());
        RestaurantSubscription activeSub;
        SubscriptionPeriodType periodType = SubscriptionPeriodType.RENEWAL;

        if (existingSubOpt.isPresent() && existingSubOpt.get().isOperating()) {
            activeSub = existingSubOpt.get();
            boolean isSamePlan = activeSub.getPlan().getId().equals(plan.getId());

            if (isSamePlan) {
                // Renewal: extend from current end date
                Instant baseEnd = activeSub.getEndDate().isAfter(now) ? activeSub.getEndDate() : now;
                Instant newEndDate = SubscriptionService.addCalendarMonths(baseEnd, months);
                if (bonusDays > 0) {
                    newEndDate = SubscriptionService.addCalendarDays(newEndDate, bonusDays);
                }
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.RENEWAL;
            } else {
                // Upgrade
                Instant newEndDate = SubscriptionService.addCalendarMonths(now, months);
                if (bonusDays > 0) {
                    newEndDate = SubscriptionService.addCalendarDays(newEndDate, bonusDays);
                }
                activeSub.setPlan(plan);
                activeSub.setStartDate(now);
                activeSub.setEndDate(newEndDate);
                activeSub.setStatus(SubscriptionStatus.ACTIVE);
                periodType = SubscriptionPeriodType.UPGRADE;
            }
            activeSub = subscriptionRepository.save(activeSub);
        } else {
            // New Active Subscription
            Instant newEndDate = SubscriptionService.addCalendarMonths(now, months);
            if (bonusDays > 0) {
                newEndDate = SubscriptionService.addCalendarDays(newEndDate, bonusDays);
            }
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

        // 4. Ensure tenant status is ACTIVE
        if (tenant.getStatus() == RestaurantStatus.PENDING || tenant.getStatus() == RestaurantStatus.SUSPENDED) {
            tenant.setStatus(RestaurantStatus.ACTIVE);
            tenant.setActive(true);
            tenantRepository.save(tenant);
        }

        // 5. Update SubscriptionRequest entity
        request.setStatus(SubscriptionRequestStatus.APPROVED);
        request.setReviewedByUser(adminUser);
        request.setReviewedAt(now);
        request.setAdminNotes(approveReq != null ? approveReq.getAdminNotes() : null);
        SubscriptionRequest saved = requestRepository.save(request);

        // Audit Log
        auditService.log(tenant, adminUser, adminUser != null ? adminUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "SUBSCRIPTION_REQUEST_APPROVED", "SubscriptionRequest", saved.getId(),
                Map.of("plan", plan.getCode(), "months", months, "bonusDays", bonusDays, "amount", request.getAmount()));

        log.info("Subscription request {} for tenant {} successfully approved and activated by {}",
                requestId, tenant.getCode(), adminUser != null ? adminUser.getUsername() : "SUPER_ADMIN");

        return toResponse(saved);
    }

    @Transactional
    public SubscriptionRequestDto.Response rejectRequest(UUID requestId, UUID adminUserId, SubscriptionRequestDto.RejectRequest rejectReq) {
        SubscriptionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> PosException.notFound("So'rov topilmadi: " + requestId));

        if (request.getStatus() != SubscriptionRequestStatus.PENDING_APPROVAL) {
            throw PosException.badRequest("Ushbu ariza allaqachon ko'rib chiqilgan: " + request.getStatus());
        }

        User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
        String reason = (rejectReq != null && rejectReq.getReason() != null && !rejectReq.getReason().isBlank())
                ? rejectReq.getReason().trim() : "To'lov tasdiqlanmadi";

        request.setStatus(SubscriptionRequestStatus.REJECTED);
        request.setReviewedByUser(adminUser);
        request.setReviewedAt(Instant.now());
        request.setRejectionReason(reason);
        SubscriptionRequest saved = requestRepository.save(request);

        auditService.log(request.getTenant(), adminUser, adminUser != null ? adminUser.getUsername() : "SUPER_ADMIN", "SUPER_ADMIN",
                "SUBSCRIPTION_REQUEST_REJECTED", "SubscriptionRequest", saved.getId(),
                Map.of("reason", reason));

        log.info("Subscription request {} for tenant {} rejected by {}: {}",
                requestId, request.getTenant().getCode(), adminUser != null ? adminUser.getUsername() : "SUPER_ADMIN", reason);

        return toResponse(saved);
    }

    // ==========================================
    // RECEIPT FILE UPLOAD
    // ==========================================

    public String uploadReceipt(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw PosException.badRequest("Yuklash uchun fayl tanlanmadi!");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);
        }

        Set<String> allowedExtensions = Set.of("jpg", "jpeg", "png", "webp", "pdf");
        if (!allowedExtensions.contains(extension)) {
            throw PosException.badRequest("Faqat JPG, PNG, WEBP yoki PDF formatidagi cheklarni yuklash mumkin!");
        }

        // Limit size to 10MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw PosException.badRequest("Chek fayli hajmi 10 MB dan oshmasligi kerak!");
        }

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("receipts");
            Files.createDirectories(targetDir);

            String uniqueFilename = UUID.randomUUID() + "." + extension;
            Path targetPath = targetDir.resolve(uniqueFilename).normalize();

            if (!targetPath.startsWith(targetDir)) {
                throw PosException.badRequest("Xavfsizlik xatosi: Noto'g'ri fayl yo'li!");
            }

            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Payment receipt saved successfully: {}", targetPath);
            return "/uploads/receipts/" + uniqueFilename;
        } catch (IOException e) {
            log.error("Failed to save payment receipt", e);
            throw PosException.internalError("Chekni serverda saqlashda xatolik: " + e.getMessage());
        }
    }

    // ==========================================
    // HELPER MAPPING & GENERATORS
    // ==========================================

    private SubscriptionRequestDto.Response toResponse(SubscriptionRequest r) {
        return SubscriptionRequestDto.Response.builder()
                .id(r.getId())
                .tenantId(r.getTenant() != null ? r.getTenant().getId() : null)
                .tenantName(r.getTenant() != null ? r.getTenant().getName() : "")
                .tenantCode(r.getTenant() != null ? r.getTenant().getCode() : "")
                .planId(r.getPlan() != null ? r.getPlan().getId() : null)
                .planCode(r.getPlan() != null ? r.getPlan().getCode() : "")
                .planName(r.getPlan() != null ? r.getPlan().getName() : "")
                .billingPeriod(r.getBillingPeriod())
                .durationMonths(r.getDurationMonths())
                .amount(r.getAmount())
                .currency(r.getCurrency())
                .paymentMethod(r.getPaymentMethod())
                .receiptUrl(r.getReceiptUrl())
                .clientNotes(r.getClientNotes())
                .status(r.getStatus() != null ? r.getStatus().name() : "PENDING_APPROVAL")
                .rejectionReason(r.getRejectionReason())
                .adminNotes(r.getAdminNotes())
                .requestedByUsername(r.getRequestedByUser() != null ? r.getRequestedByUser().getUsername() : null)
                .reviewedByUsername(r.getReviewedByUser() != null ? r.getReviewedByUser().getUsername() : null)
                .createdAt(r.getCreatedAt())
                .reviewedAt(r.getReviewedAt())
                .build();
    }

    private String generateInvoiceNumber() {
        ZonedDateTime now = ZonedDateTime.now(SubscriptionService.TASHKENT_ZONE);
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "INV-" + datePart + "-" + rand;
    }
}
