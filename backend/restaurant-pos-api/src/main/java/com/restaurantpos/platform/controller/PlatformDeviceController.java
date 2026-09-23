package com.restaurantpos.platform.controller;

import com.restaurantpos.common.response.ApiResponse;
import com.restaurantpos.devices.dto.DeviceBindingDto;
import com.restaurantpos.devices.entity.DeviceInstallationStatus;
import com.restaurantpos.devices.service.DeviceBindingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/platform/devices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Devices", description = "Super Admin Terminal and Hardware Device Management")
public class PlatformDeviceController {

    private final DeviceBindingService deviceBindingService;

    @GetMapping
    @Operation(summary = "Get all desktop devices across all restaurants")
    public ResponseEntity<ApiResponse<List<DeviceBindingDto.PlatformDeviceResponse>>> getAllDevices() {
        List<DeviceBindingDto.PlatformDeviceResponse> devices = deviceBindingService.getAllDevices();
        return ResponseEntity.ok(ApiResponse.success(devices));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update device installation status (ACTIVE, BLOCKED, REVOKED)")
    public ResponseEntity<ApiResponse<DeviceBindingDto.PlatformDeviceResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody DeviceBindingDto.UpdateDeviceStatusRequest request) {
        DeviceInstallationStatus status = DeviceInstallationStatus.valueOf(request.getStatus().trim().toUpperCase());
        DeviceBindingDto.PlatformDeviceResponse updated = deviceBindingService.updateDeviceStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Qurilma holati yangilandi"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Unbind device from restaurant")
    public ResponseEntity<ApiResponse<Void>> unbindDevice(@PathVariable UUID id) {
        deviceBindingService.unbindDevice(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Qurilma biriktiruvi bekor qilindi (Unbound)"));
    }
}
