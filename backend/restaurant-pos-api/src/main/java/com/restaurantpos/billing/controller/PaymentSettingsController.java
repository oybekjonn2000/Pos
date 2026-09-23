package com.restaurantpos.billing.controller;

import com.restaurantpos.billing.dto.BillingDto;
import com.restaurantpos.billing.service.PaymentSettingsService;
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
@RequestMapping("/api/platform/payment-settings")
@RequiredArgsConstructor
@Tag(name = "Platform Payment Settings", description = "Super Admin configuration for Payment Gateways (Mock, Payme, Click, Uzcard, Humo)")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PaymentSettingsController {

    private final PaymentSettingsService paymentSettingsService;

    @GetMapping
    @Operation(summary = "Get all configured payment providers with masked secrets")
    public ResponseEntity<ApiResponse<List<BillingDto.PaymentProviderSettingResponse>>> getSettings() {
        List<BillingDto.PaymentProviderSettingResponse> settings = paymentSettingsService.getAllProviderSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update payment provider configuration by ID")
    public ResponseEntity<ApiResponse<BillingDto.PaymentProviderSettingResponse>> updateSetting(
            @PathVariable UUID id,
            @RequestBody BillingDto.PaymentProviderSettingUpdateRequest request) {
        BillingDto.PaymentProviderSettingResponse updated = paymentSettingsService.updateSetting(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "To'lov provayderi sozlamalari yangilandi"));
    }

    @PutMapping("/by-code/{code}")
    @Operation(summary = "Update payment provider configuration by provider code")
    public ResponseEntity<ApiResponse<BillingDto.PaymentProviderSettingResponse>> updateSettingByCode(
            @PathVariable String code,
            @RequestBody BillingDto.PaymentProviderSettingUpdateRequest request) {
        BillingDto.PaymentProviderSettingResponse updated = paymentSettingsService.updateSettingByCode(code, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "To'lov provayderi sozlamalari yangilandi"));
    }
}
