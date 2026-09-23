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

    @PostMapping("/plans/{id}/archive")
    @Operation(summary = "Archive an existing subscription plan")
    public ResponseEntity<ApiResponse<BillingDto.PlanResponse>> archivePlan(@PathVariable UUID id) {
        BillingDto.PlanResponse plan = subscriptionService.archivePlan(id);
        return ResponseEntity.ok(ApiResponse.success(plan, "Tarif arxivlandi"));
    }

    @PostMapping("/manual-activate")
    @Operation(summary = "Manually activate or adjust a subscription for a restaurant")
    public ResponseEntity<ApiResponse<BillingDto.CurrentSubscriptionResponse>> manualActivate(
            @RequestBody BillingDto.ManualActivationRequest request) {
        BillingDto.CurrentSubscriptionResponse response = subscriptionService.manualActivate(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Obuna qo'lda muvaffaqiyatli faollashtirildi"));
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend a restaurant subscription (Temporarily pause POS access)")
    public ResponseEntity<ApiResponse<BillingDto.TenantSubscriptionSummary>> suspendSubscription(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        BillingDto.TenantSubscriptionSummary summary = subscriptionService.suspendSubscription(id, reason);
        return ResponseEntity.ok(ApiResponse.success(summary, "Obuna vaqtincha to'xtatildi"));
    }

    @PostMapping("/{id}/resume")
    @Operation(summary = "Resume a suspended restaurant subscription (Restore POS access)")
    public ResponseEntity<ApiResponse<BillingDto.TenantSubscriptionSummary>> resumeSubscription(
            @PathVariable UUID id) {
        BillingDto.TenantSubscriptionSummary summary = subscriptionService.resumeSubscription(id);
        return ResponseEntity.ok(ApiResponse.success(summary, "Obuna qayta faollashtirildi"));
    }

    @GetMapping("/invoices")
    @Operation(summary = "Get all platform invoices across all restaurants")
    public ResponseEntity<ApiResponse<List<BillingDto.InvoiceResponse>>> getAllInvoices() {
        List<BillingDto.InvoiceResponse> invoices = subscriptionService.getAllInvoices();
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @PostMapping("/invoices/{id}/mark-paid")
    @Operation(summary = "Mark an invoice as paid (Manual payment confirmation by Super Admin)")
    public ResponseEntity<ApiResponse<BillingDto.InvoiceResponse>> markInvoiceAsPaid(
            @PathVariable UUID id,
            @RequestParam(required = false) String adminNotes) {
        BillingDto.InvoiceResponse invoice = subscriptionService.markInvoiceAsPaid(id, adminNotes);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Hisob-faktura to'langan deb belgilandi va obuna faollashtirildi"));
    }

    @GetMapping("/discounts")
    @Operation(summary = "Get all subscription discount duration rules")
    public ResponseEntity<ApiResponse<List<BillingDto.DiscountRuleDto>>> getDiscountRules() {
        List<BillingDto.DiscountRuleDto> rules = subscriptionService.getDiscountRules();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @PostMapping("/discounts")
    @Operation(summary = "Create or update discount duration rule")
    public ResponseEntity<ApiResponse<BillingDto.DiscountRuleDto>> saveDiscountRule(
            @RequestBody BillingDto.DiscountRuleDto request) {
        BillingDto.DiscountRuleDto rule = subscriptionService.saveDiscountRule(request);
        return ResponseEntity.ok(ApiResponse.success(rule, "Chegirma qoidasi saqlandi"));
    }

    @PutMapping("/discounts/{id}")
    @Operation(summary = "Update discount duration rule")
    public ResponseEntity<ApiResponse<BillingDto.DiscountRuleDto>> updateDiscountRule(
            @PathVariable UUID id,
            @RequestBody BillingDto.DiscountRuleDto request) {
        request.setId(id);
        BillingDto.DiscountRuleDto rule = subscriptionService.saveDiscountRule(request);
        return ResponseEntity.ok(ApiResponse.success(rule, "Chegirma qoidasi yangilandi"));
    }

    @DeleteMapping("/discounts/{id}")
    @Operation(summary = "Delete discount duration rule")
    public ResponseEntity<ApiResponse<Void>> deleteDiscountRule(@PathVariable UUID id) {
        subscriptionService.deleteDiscountRule(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Chegirma qoidasi o'chirildi"));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get subscription audit logs")
    public ResponseEntity<ApiResponse<List<BillingDto.AuditLogResponse>>> getAuditLogs() {
        List<BillingDto.AuditLogResponse> logs = subscriptionService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
