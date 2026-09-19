package com.restaurantpos.tenants.controller;

import com.restaurantpos.auth.security.UserPrincipal;
import com.restaurantpos.common.exception.PosException;
import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.tenants.dto.RestaurantDto;
import com.restaurantpos.tenants.entity.RestaurantStatus;
import com.restaurantpos.tenants.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurants", description = "Multi-Tenant Platform Restaurant Management API")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all restaurants (Super Admin only)")
    public ResponseEntity<ApiResponse<List<RestaurantDto.Response>>> getAllRestaurants() {
        List<RestaurantDto.Response> list = restaurantService.getAllRestaurants();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('RESTAURANT_ADMIN')")
    @Operation(summary = "Get restaurant details by ID")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> getRestaurantById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user) {
        // If not super admin, must match own tenant
        if (!user.isSuperAdmin() && (user.getTenantId() == null || !user.getTenantId().equals(id))) {
            throw PosException.forbidden("Sizda boshqa restoran ma'lumotlarini ko'rish huquqi yo'q!");
        }
        RestaurantDto.Response res = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create new restaurant tenant (Super Admin only)")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> createRestaurant(
            @Valid @RequestBody RestaurantDto.CreateRequest request) {
        RestaurantDto.Response created = restaurantService.createRestaurant(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Yangi restoran muvaffaqiyatli yaratildi"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN') or hasRole('RESTAURANT_ADMIN')")
    @Operation(summary = "Update restaurant information")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> updateRestaurant(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.UpdateRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        if (!user.isSuperAdmin() && (user.getTenantId() == null || !user.getTenantId().equals(id))) {
            throw PosException.forbidden("Sizda ushbu restoranni tahrirlash huquqi yo'q!");
        }
        RestaurantDto.Response updated = restaurantService.updateRestaurant(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Restoran ma'lumotlari yangilandi"));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate, suspend, or deactivate a restaurant (Super Admin only)")
    public ResponseEntity<ApiResponse<RestaurantDto.Response>> updateRestaurantStatus(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.StatusUpdateRequest request) {
        RestaurantStatus status;
        try {
            status = RestaurantStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw PosException.badRequest("Noto'g'ri status! Ruxsat etilgan: ACTIVE, SUSPENDED, INACTIVE");
        }
        RestaurantDto.Response updated = restaurantService.updateRestaurantStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Restoran holati muvaffaqiyatli o'zgartirildi: " + status));
    }

    @PostMapping(value = {"/{id}/admin", "/{id}/admins"})
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Provision a new admin user for a restaurant (Super Admin only)")
    public ResponseEntity<ApiResponse<Void>> createRestaurantAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantDto.CreateAdminRequest request) {
        restaurantService.createRestaurantAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Restoran admini muvaffaqiyatli yaratildi"));
    }
}
