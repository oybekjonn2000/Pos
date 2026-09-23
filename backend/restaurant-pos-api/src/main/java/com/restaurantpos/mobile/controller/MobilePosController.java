package com.restaurantpos.mobile.controller;

import com.restaurantpos.auth.dto.AuthDto;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.mobile.dto.MobileDto;
import com.restaurantpos.mobile.service.MobilePosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
@Tag(name = "Mobile POS", description = "Mobile Waiter POS Endpoints (Connection check, Waiters list, PIN authentication)")
public class MobilePosController {

    private final MobilePosService mobilePosService;

    @GetMapping("/connection-check")
    @Operation(summary = "Check connection, restaurant status, and verify Pro/MOBILE_APP subscription")
    public ResponseEntity<ApiResponse<MobileDto.ConnectionCheckResponse>> connectionCheck(
            @RequestParam(required = false) String restaurantCode) {
        MobileDto.ConnectionCheckResponse res = mobilePosService.checkConnection(restaurantCode);
        return ResponseEntity.ok(ApiResponse.success(res, "POS serverga muvaffaqiyatli ulandi"));
    }

    @GetMapping("/waiters")
    @Operation(summary = "Get list of active WAITERS only for this restaurant")
    public ResponseEntity<ApiResponse<List<MobileDto.MobileWaiterDto>>> getWaiters(
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) String restaurantCode) {
        List<MobileDto.MobileWaiterDto> waiters = mobilePosService.getWaiters(restaurantId, restaurantCode);
        return ResponseEntity.ok(ApiResponse.success(waiters, "Ofitsiantlar ro'yxati olindi"));
    }

    @PostMapping("/pin-login")
    @Operation(summary = "Waiter PIN authentication")
    public ResponseEntity<ApiResponse<AuthDto.TokenResponse>> pinLogin(
            @Valid @RequestBody MobileDto.MobilePinLoginRequest request) {
        AuthDto.TokenResponse tokenRes = mobilePosService.pinLogin(request);
        return ResponseEntity.ok(ApiResponse.success(tokenRes, "Muvaffaqiyatli kirildi"));
    }

    @GetMapping("/ready-notifications")
    @Operation(summary = "Get real-time list of dishes ready in kitchen for waiter")
    public ResponseEntity<ApiResponse<List<MobileDto.ReadyNotificationDto>>> getReadyNotifications(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.restaurantpos.auth.security.UserPrincipal user) {
        UUID tenantId = user != null ? user.getTenantId() : null;
        List<MobileDto.ReadyNotificationDto> items = mobilePosService.getReadyNotifications(tenantId, user);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/orders/{orderId}/items/{itemId}/served")
    @Operation(summary = "Mark ready item as served/delivered to table")
    public ResponseEntity<ApiResponse<Void>> markItemServed(
            @PathVariable UUID orderId,
            @PathVariable UUID itemId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.restaurantpos.auth.security.UserPrincipal user) {
        UUID tenantId = user != null ? user.getTenantId() : null;
        mobilePosService.markItemServed(orderId, itemId, tenantId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Taom yetkazildi deb belgilandi"));
    }
}

