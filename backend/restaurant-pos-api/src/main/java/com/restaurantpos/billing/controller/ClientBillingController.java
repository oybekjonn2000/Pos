package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.entity.SubscriptionPayment;
import com.restaurantpos.billing.repository.SubscriptionPaymentRepository;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/restaurant/billing")
@RequiredArgsConstructor
@Tag(name = "Client Billing", description = "Restaurant Admin billing and subscription management")
@PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
public class ClientBillingController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionPaymentRepository paymentRepository;

    @GetMapping("/current")
    @Operation(summary = "Get current restaurant subscription, plan limits, and usage")
    public ResponseEntity<ApiResponse<BillingDto.CurrentSubscriptionResponse>> getCurrentSubscription() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        BillingDto.CurrentSubscriptionResponse response = subscriptionService.getCurrentSubscription(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get payment transaction history for current restaurant")
    public ResponseEntity<ApiResponse<List<BillingDto.PaymentHistoryItem>>> getPaymentHistory() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        List<BillingDto.PaymentHistoryItem> history = subscriptionService.getTenantPaymentHistory(tenantId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Initiate subscription checkout for upgrade or renewal")
    public ResponseEntity<ApiResponse<BillingDto.CheckoutResponse>> initiateCheckout(
            @RequestBody BillingDto.CheckoutRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        BillingDto.CheckoutResponse response = subscriptionService.initiateCheckout(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "To'lov jarayoni boshlandi"));
    }

    @PostMapping("/mock-pay")
    @Operation(summary = "Process test/mock payment (Development mode)")
    public ResponseEntity<ApiResponse<BillingDto.CurrentSubscriptionResponse>> mockPay(
            @RequestBody BillingDto.MockPayRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }

        SubscriptionPayment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> PosException.notFound("To'lov topilmadi: " + request.getPaymentId()));

        // Tenant Security Check: Ensure payment belongs to the current caller's tenant
        if (!payment.getTenant().getId().equals(tenantId)) {
            log.warn("Unauthorized attempt by tenant {} to pay for payment {} belonging to tenant {}",
                    tenantId, payment.getId(), payment.getTenant().getId());
            throw PosException.forbidden("Siz boshqa restoranning to'lovini amalga oshirolmaysiz!");
        }

        if (request.isSimulateSuccess()) {
            String fakeTx = "MOCK-TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            BillingDto.CurrentSubscriptionResponse updated = subscriptionService.processPaymentSuccess(
                    payment.getId(), fakeTx, Map.of("mode", "SIMULATED_SUCCESS", "timestamp", System.currentTimeMillis()));
            return ResponseEntity.ok(ApiResponse.success(updated, "To'lov muvaffaqiyatli qabul qilindi va obuna faollashtirildi!"));
        } else {
            subscriptionService.processPaymentFailed(payment.getId(), "Foydalanuvchi tomonidan bekor qilindi yoki simulyatsiya xatosi");
            throw PosException.badRequest("To'lov muvaffaqiyatsiz yakunlandi (Simulated failure).");
        }
    }
}
