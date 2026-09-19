package com.restaurantpos.settings.controller;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.settings.dto.ResetDto;
import com.restaurantpos.settings.service.ResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings/reset")
@RequiredArgsConstructor
@Tag(name = "Settings Reset", description = "Development & Test Data Reset Center")
@PreAuthorize("hasAuthority('MANAGE_SETTINGS') or hasRole('ADMIN')")
public class ResetController {

    private final ResetService resetService;

    @PostMapping("/orders")
    @Operation(summary = "Buyurtmalar tarixini tozalash (Buyurtmalar, to'lovlar, oshxona buyurtmalari)")
    public ResponseEntity<ApiResponse<ResetDto.OrdersResetResult>> resetOrders(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.OrdersResetResult result = resetService.resetOrders(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, "Buyurtmalar tarixi muvaffaqiyatli tozalandi"));
    }

    @PostMapping("/products")
    @Operation(summary = "Mahsulotlarni tozalash")
    public ResponseEntity<ApiResponse<ResetDto.EntityResetResult>> resetProducts(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.EntityResetResult result = resetService.resetProducts(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/categories")
    @Operation(summary = "Kategoriyalarni tozalash")
    public ResponseEntity<ApiResponse<ResetDto.EntityResetResult>> resetCategories(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.EntityResetResult result = resetService.resetCategories(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/kitchens")
    @Operation(summary = "Oshxonalarni tozalash")
    public ResponseEntity<ApiResponse<ResetDto.EntityResetResult>> resetKitchens(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.EntityResetResult result = resetService.resetKitchens(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/tables")
    @Operation(summary = "Stollarni tozalash")
    public ResponseEntity<ApiResponse<ResetDto.EntityResetResult>> resetTables(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.EntityResetResult result = resetService.resetTables(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/zones")
    @Operation(summary = "Joylar va zallarni tozalash")
    public ResponseEntity<ApiResponse<ResetDto.EntityResetResult>> resetZones(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.EntityResetResult result = resetService.resetZones(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/all")
    @Operation(summary = "Barcha test ma'lumotlarini tozalash (Full Reset)")
    public ResponseEntity<ApiResponse<ResetDto.AllResetResult>> resetAll(
            @AuthenticationPrincipal UserPrincipal user) {
        ResetDto.AllResetResult result = resetService.resetAll(user.getTenantId(), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result, "Barcha test ma'lumotlari muvaffaqiyatli tozalandi"));
    }
}
