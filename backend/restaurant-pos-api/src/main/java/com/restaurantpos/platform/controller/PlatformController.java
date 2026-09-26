package com.restaurantpos.platform.controller;

import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.platform.dto.PlatformDto;
import com.restaurantpos.platform.service.PlatformService;
import com.restaurantpos.tenants.dto.RestaurantDto;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/platform")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Platform Administration", description = "Central Super Admin Platform Management & Monitoring API")
public class PlatformController {

    private final PlatformService platformService;
    private final RestaurantService restaurantService;

    @GetMapping("/statistics")
    @Operation(summary = "Get platform-wide statistics (KPI cards: revenue, restaurants, employees, orders)")
    public ResponseEntity<ApiResponse<PlatformDto.StatisticsResponse>> getStatistics(
            @RequestParam(required = false, defaultValue = "TODAY") String period) {
        PlatformDto.StatisticsResponse response = platformService.getPlatformStatistics(period);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/restaurants")
    @Operation(summary = "Get all platform restaurants with live statistics")
    public ResponseEntity<ApiResponse<List<PlatformDto.RestaurantSummary>>> getRestaurants() {
        List<PlatformDto.RestaurantSummary> list = platformService.getPlatformRestaurants();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/restaurants")
    @Operation(summary = "Create a new restaurant branch from platform")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> createRestaurant(
            @Valid @RequestBody RestaurantDto.CreateRequest request) {
        RestaurantDto.Response created = restaurantService.createRestaurant(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Yangi restoran muvaffaqiyatli ro'yxatdan o'tkazildi"));
    }

    @GetMapping("/restaurants/{id}")
    @Operation(summary = "Get 360-degree restaurant monitoring details")
    public ResponseEntity<ApiResponse<PlatformDto.RestaurantDetail>> getRestaurantDetail(
            @PathVariable UUID id) {
        PlatformDto.RestaurantDetail detail = platformService.getRestaurantDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PutMapping("/restaurants/{id}")
    @Operation(summary = "Update restaurant information")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> updateRestaurant(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.UpdateRequest request) {
        RestaurantDto.Response updated = restaurantService.updateRestaurant(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Restoran ma'lumotlari yangilandi"));
    }

    @RequestMapping(value = "/restaurants/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Update restaurant status (ACTIVE, SUSPENDED, INACTIVE)")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> updateRestaurantStatus(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.StatusUpdateRequest request) {
        RestaurantStatus status;
        try {
            status = RestaurantStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw com.restaurantpos.common.exception.PosException.badRequest("Noto'g'ri status! Ruxsat etilgan: ACTIVE, SUSPENDED, INACTIVE");
        }
        RestaurantDto.Response updated = restaurantService.updateRestaurantStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Restoran holati yangilandi: " + status));
    }

    @PostMapping(value = {"/restaurants/{id}/admin", "/restaurants/{id}/admins"})
    @Operation(summary = "Provision a new restaurant administrator")
    public ResponseEntity<ApiResponse<Void>> createRestaurantAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.CreateAdminRequest request) {
        restaurantService.createRestaurantAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Restoran admini muvaffaqiyatli yaratildi"));
    }

    @GetMapping("/restaurants/{id}/employees")
    @Operation(summary = "Get list of employees for a specific restaurant")
    public ResponseEntity<ApiResponse<List<PlatformDto.EmployeeItem>>> getRestaurantEmployees(
            @PathVariable UUID id) {
        List<PlatformDto.EmployeeItem> list = platformService.getRestaurantEmployees(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/employees")
    @Operation(summary = "Get cross-restaurant employee directory with filtering")
    public ResponseEntity<ApiResponse<List<PlatformDto.EmployeeItem>>> getAllEmployees(
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active) {
        List<PlatformDto.EmployeeItem> list = platformService.getAllPlatformEmployees(restaurantId, role, active);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping("/restaurants/{restaurantId}/employees/{userId}/status")
    @Operation(summary = "Suspend or activate a restaurant employee account")
    public ResponseEntity<ApiResponse<Void>> updateEmployeeStatus(
            @PathVariable UUID restaurantId,
            @PathVariable UUID userId,
            @RequestBody PlatformDto.EmployeeStatusRequest request) {
        platformService.updateEmployeeStatus(restaurantId, userId, request.isActive());
        return ResponseEntity.ok(ApiResponse.success(null, "Xodim holati muvaffaqiyatli yangilandi"));
    }

    @GetMapping("/restaurants/{id}/orders")
    @Operation(summary = "Read-only order monitoring feed for a restaurant")
    public ResponseEntity<ApiResponse<List<PlatformDto.OrderItemMonitoring>>> getRestaurantOrders(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PlatformDto.OrderItemMonitoring> orderPage = platformService.getRestaurantOrders(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(orderPage.getContent(), ApiResponse.PageMeta.of(orderPage)));
    }

    @GetMapping("/sales")
    @Operation(summary = "Platform-wide sales monitoring breakdown")
    public ResponseEntity<ApiResponse<List<PlatformDto.RestaurantSalesBreakdown>>> getSalesMonitoring(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID restaurantId) {
        List<PlatformDto.RestaurantSalesBreakdown> sales = platformService.getPlatformSales(fromDate, toDate, restaurantId);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/reports")
    @Operation(summary = "Consolidated platform reports")
    public ResponseEntity<ApiResponse<PlatformDto.PlatformReportResponse>> getReports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status) {
        PlatformDto.PlatformReportResponse report = platformService.getPlatformReports(fromDate, toDate, status);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/superadmins")
    @Operation(summary = "Get all platform super admins")
    public ResponseEntity<ApiResponse<List<com.restaurantpos.users.dto.UserDto.Response>>> getSuperAdmins() {
        List<com.restaurantpos.users.dto.UserDto.Response> list = platformService.getSuperAdmins();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/superadmins")
    @Operation(summary = "Create a new platform super admin")
    public ResponseEntity<ApiResponse<com.restaurantpos.users.dto.UserDto.Response>> createSuperAdmin(
            @Valid @RequestBody com.restaurantpos.users.dto.UserDto.CreateSuperAdminRequest request) {
        com.restaurantpos.users.dto.UserDto.Response created = platformService.createSuperAdmin(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Yangi Superadmin muvaffaqiyatli yaratildi"));
    }

    @PutMapping("/superadmins/{id}/status")
    @Operation(summary = "Toggle super admin active/inactive status")
    public ResponseEntity<ApiResponse<com.restaurantpos.users.dto.UserDto.Response>> updateSuperAdminStatus(
            @PathVariable UUID id,
            @RequestBody com.restaurantpos.users.dto.UserDto.ToggleStatusRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.restaurantpos.auth.security.UserPrincipal currentUser) {
        com.restaurantpos.users.dto.UserDto.Response updated = platformService.updateSuperAdminStatus(id, request.isActive(), currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Superadmin holati yangilandi"));
    }
}
