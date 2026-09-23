package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.dto.SubscriptionRequestDto;
import com.restaurantpos.billing.entity.SubscriptionPayment;
import com.restaurantpos.billing.repository.SubscriptionPaymentRepository;
import com.restaurantpos.billing.service.SubscriptionRequestService;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.common.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/restaurant/billing")
@RequiredArgsConstructor
@Tag(name = "Client Billing", description = "Restaurant Admin billing and subscription management")
@PreAuthorize("isAuthenticated()")
public class ClientBillingController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionRequestService requestService;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
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

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Calculate exact price, discounts, and proration adjustments for a plan and duration")
    public ResponseEntity<ApiResponse<BillingDto.CalculatePriceResponse>> calculate(
            @RequestBody BillingDto.CalculatePriceRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        BillingDto.CalculatePriceResponse response = subscriptionService.calculatePrice(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Get all subscription invoices for current restaurant")
    public ResponseEntity<ApiResponse<List<BillingDto.InvoiceResponse>>> getInvoices() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        List<BillingDto.InvoiceResponse> invoices = subscriptionService.getTenantInvoices(tenantId);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/periods")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Get historical subscription periods for current restaurant")
    public ResponseEntity<ApiResponse<List<BillingDto.SubscriptionPeriodResponse>>> getPeriods() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        List<BillingDto.SubscriptionPeriodResponse> periods = subscriptionService.getSubscriptionPeriods(tenantId);
        return ResponseEntity.ok(ApiResponse.success(periods));
    }

    @PostMapping("/mock-pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Process test payment via Mock Gateway (SUCCESS, FAILED, PENDING, CANCELLED)")
    public ResponseEntity<ApiResponse<BillingDto.CurrentSubscriptionResponse>> processMockPay(
            @RequestBody BillingDto.MockPaymentRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        BillingDto.CurrentSubscriptionResponse response = subscriptionService.processMockPayment(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Mock to'lov simulyatsiyasi bajarildi"));
    }

    // ==========================================
    // SUBSCRIPTION REQUESTS (B2B APPROVAL FLOW)
    // ==========================================

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Submit a manual subscription request with payment proof")
    public ResponseEntity<ApiResponse<SubscriptionRequestDto.Response>> createSubscriptionRequest(
            @RequestBody SubscriptionRequestDto.CreateRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        UUID userId = TenantContext.getCurrentUserId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        SubscriptionRequestDto.Response response = requestService.createRequest(tenantId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Obuna so'rovi muvaffaqiyatli yuborildi. Super Admin tasdiqlashi kutilmoqda."));
    }

    @GetMapping("/requests/latest")
    @Operation(summary = "Get latest subscription request status for current restaurant")
    public ResponseEntity<ApiResponse<SubscriptionRequestDto.Response>> getLatestSubscriptionRequest() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        SubscriptionRequestDto.Response response = requestService.getLatestForTenant(tenantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/requests/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Get historical subscription requests for current restaurant")
    public ResponseEntity<ApiResponse<List<SubscriptionRequestDto.Response>>> getSubscriptionRequestHistory() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        List<SubscriptionRequestDto.Response> history = requestService.getHistoryForTenant(tenantId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Cancel a pending subscription request")
    public ResponseEntity<ApiResponse<SubscriptionRequestDto.Response>> cancelSubscriptionRequest(
            @PathVariable UUID id) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        UUID userId = TenantContext.getCurrentUserId();
        if (tenantId == null) {
            throw PosException.badRequest("Tenant konteksti topilmadi!");
        }
        SubscriptionRequestDto.Response response = requestService.cancelRequest(tenantId, id, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "So'rov bekor qilindi"));
    }

    @PostMapping(value = "/upload-receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')")
    @Operation(summary = "Upload payment receipt file for subscription request")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadReceipt(
            @RequestParam("file") MultipartFile file) {
        String receiptUrl = requestService.uploadReceipt(file);
        return ResponseEntity.ok(ApiResponse.success(Map.of("receiptUrl", receiptUrl), "To'lov cheki muvaffaqiyatli yuklandi"));
    }
}

