package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.service.SubscriptionService;
import com.restaurantpos.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/platform/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Platform Subscriptions Admin", description = "SUPER_ADMIN platform-level subscription and payment monitoring")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PlatformSubscriptionAdminController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/overview")
    @Operation(summary = "Get platform-wide subscription metrics, MRR, and all tenant statuses")
    public ResponseEntity<ApiResponse<BillingDto.PlatformSubscriptionOverview>> getOverview() {
        BillingDto.PlatformSubscriptionOverview overview = subscriptionService.getPlatformSubscriptionOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/payments")
    @Operation(summary = "Get all platform payments across all restaurants")
    public ResponseEntity<ApiResponse<List<BillingDto.PaymentHistoryItem>>> getAllPayments() {
        List<BillingDto.PaymentHistoryItem> payments = subscriptionService.getPlatformPaymentHistory();
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/plans")
    @Operation(summary = "Get all subscription plans for management")
    public ResponseEntity<ApiResponse<List<BillingDto.PlanResponse>>> getAllPlans() {
        List<BillingDto.PlanResponse> plans = subscriptionService.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @PostMapping("/plans")
    @Operation(summary = "Create a new subscription plan")
    public ResponseEntity<ApiResponse<BillingDto.PlanResponse>> createPlan(
            @RequestBody BillingDto.PlanSaveRequest request) {
        BillingDto.PlanResponse plan = subscriptionService.savePlan(null, request);
        return ResponseEntity.ok(ApiResponse.success(plan, "Yangi tarif muvaffaqiyatli yaratildi"));
    }

    @PutMapping("/plans/{id}")
    @Operation(summary = "Update an existing subscription plan")
    public ResponseEntity<ApiResponse<BillingDto.PlanResponse>> updatePlan(
            @PathVariable UUID id,
            @RequestBody BillingDto.PlanSaveRequest request) {
        BillingDto.PlanResponse plan = subscriptionService.savePlan(id, request);
        return ResponseEntity.ok(ApiResponse.success(plan, "Tarif muvaffaqiyatli yangilandi"));
    }
}
